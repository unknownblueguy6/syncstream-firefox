import browser from "webextension-polyfill";
import { NIL as NIL_UUID } from "uuid";
import Sockette from "sockette";

import { UIEventType, ContentEventType, ServerEventType } from "./events";
import type { UIEvent, ContentEvent, ServerEvent } from "./events";
import { id, code } from "./stores";

let id_val = NIL_UUID;
id.subscribe((value: string) => {
  id_val = value;
});
let code_val = "";
code.subscribe((value: string) => {
  code_val = value;
});

const HOST_PATTERN = "://localhost:8080";

const ports: {
  ui?: browser.Runtime.Port;
  contentScript?: browser.Runtime.Port;
  ws?: Sockette;
} = {};

const initEvent: UIEvent = {
  timestamp: "",
  type: UIEventType.ZERO,
  data: {
    canCreateRoom: false,
    isEditable: true,
  },
};

console.log("Client script loaded");

browser.runtime.onConnect.addListener((port) => {
  console.log("Port connected:", port.name);
  switch (port.name) {
    case "UI":
      console.log("UI port connected");
      ports.ui = port;
      ports.ui.onMessage.addListener(uiEventListener);
      console.log(initEvent);
      ports.ui.postMessage(initEvent);
      break;
    case "content-script":
      if (ports.contentScript === undefined) {
        ports.contentScript = port;
        ports.contentScript.onMessage.addListener(contentEventListener);
      }
      break;
  }
});

async function contentEventListener(message: ContentEvent) {
  if (message.type === ContentEventType.VIDEO_ELEMENT_CHECK) {
    console.log("video element check hello!");
    if (code_val !== "") {
      initEvent.data.isEditable = false;
      initEvent.data.canCreateRoom = false;
    } else {
      initEvent.data.canCreateRoom = true;
    }
    console.log(initEvent);
    if (ports.ui !== undefined) {
      ports.ui.postMessage(initEvent);
    }
  } else if (message.type === ContentEventType.VIDEO_STREAM_STATE) {
    console.log("received video steream state!");
    try {
      const createResponse = await fetch(`http${HOST_PATTERN}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id_val,
          url: message.data.url,
          streamState: {
            paused: message.data.paused,
            currentTime: message.data.currentTime,
            playbackRate: message.data.playbackRate,
          },
          streamElement: null,
          timestamp: message.timestamp,
        }),
      });

      if (createResponse.ok) {
        const createResponseJSON = await createResponse.json();
        const roomCode = createResponseJSON.code as string;

        const createRoomEvent: UIEvent = {
          timestamp: message.timestamp,
          type: UIEventType.CREATE_ROOM,
          data: {
            code: roomCode,
            success: createResponse.ok,
          },
        };

        createRoomEvent.data.success &&= await initiateJoin(roomCode);

        if (createRoomEvent.data.success) {
          console.log("created and joined room!");
          initEvent.data.canCreateRoom = false;
          initEvent.data.isEditable = false;
          code.set(roomCode);
        } else {
          createRoomEvent.data.code = "";
        }
        ports.ui.postMessage(createRoomEvent);
      } else {
        console.error(
          "Failed to create room:",
          createResponse.status,
          createResponse.statusText,
        );
      }
    } catch (error) {
      console.error("/create request failed", error);
    }
  }
}

async function uiEventListener(message: UIEvent) {
  if (message.type === UIEventType.CREATE_ROOM) {
    console.log(message);
    if (ports.contentScript !== undefined) {
      const getVideoStreamState: ContentEvent = {
        timestamp: message.timestamp,
        type: ContentEventType.VIDEO_STREAM_STATE,
        data: {},
      };
      ports.contentScript.postMessage(getVideoStreamState);
    }
  } else if (message.type === UIEventType.JOIN_ROOM) {
    const joinRoomEvent: UIEvent = {
      timestamp: message.timestamp,
      type: UIEventType.JOIN_ROOM,
      data: {
        success: true,
      },
    };
    joinRoomEvent.data.success &&= await initiateJoin(message.data.code);
    if (joinRoomEvent.data.success) {
      console.log("joined created room!");
      initEvent.data.canCreateRoom = false;
      initEvent.data.isEditable = false;
      code.set(message.data.code);
    }
    ports.ui.postMessage(joinRoomEvent);
  }
}

async function initiateJoin(roomCode: string): Promise<boolean> {
  const joinTokenResponse = await fetch(`http${HOST_PATTERN}/joinToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: id_val,
      code: roomCode,
    }),
  });

  if (joinTokenResponse.ok) {
    const joinTokenResponseJSON = await joinTokenResponse.json();
    const token = joinTokenResponseJSON.token as string;
    joinRoom(token);
  } else {
    console.error(
      "Failed to join room:",
      joinTokenResponse.status,
      joinTokenResponse.statusText,
    );
  }

  return joinTokenResponse.ok;
}

function joinRoom(token: string) {
  ports.ws = new Sockette(`ws${HOST_PATTERN}/join?token=${token}`, {
    timeout: 5e3,
    maxAttempts: 10,
    onopen: (e) => {
      console.log("Connected:", e);
    },
    onmessage: (e) => {
      const event: ServerEvent = JSON.parse(e.data);
      console.log("Received From Server:", event);
      handleServerEvent(event);
    },
    onreconnect: (e) => {
      console.log("Reconnecting...", e);
    },
    onmaximum: (e) => {
      console.log("Stop Attempting!", e);
    },
    onclose: (e) => {
      console.log("Closed!", e);
    },
    onerror: (e) => {
      console.log("Error:", e);
    },
  });
}

async function handleServerEvent(event: ServerEvent) {
  switch (event.type) {
    case ServerEventType.ROOM_STATE: {
      const tab_results = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const activeTab = tab_results[0];
      if (activeTab.url !== event.data.url) {
        const newTab = await browser.tabs.create({
          url: event.data.url,
        });
        if (ports.contentScript !== undefined) {
          ports.contentScript.disconnect();
        }
        browser.tabs.onUpdated.addListener(async (tabID, changeInfo) => {
          if (tabID === newTab.id && changeInfo.status === "complete") {
            await browser.scripting.executeScript({
              files: ["content-script.js"],
              target: {
                tabId: newTab.id!,
              },
            });
            browser.tabs.sendMessage(newTab.id!, event);
          }
        });
        console.log("?");
      }
      break;
    }
    default: {
      console.log("Unhandled server event:", event);
      break;
    }
  }
}
