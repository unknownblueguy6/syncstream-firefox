import browser from "webextension-polyfill";
import { NIL as NIL_UUID } from "uuid";
import Sockette from "sockette";

import { EventType } from "./events";
import type { UIEvent, ContentEvent, ServerEvent, ServerEventType } from "./events";
import { id, code } from "./stores";
import { RoomState } from "./room";

let id_val = NIL_UUID;
id.subscribe((value: string) => {
  id_val = value;
});
let code_val = "";
code.subscribe((value: string) => {
  code_val = value;
});

const HOST_PATTERN = "://localhost:8080";

async function getActiveTab(): Promise<void | browser.Tabs.Tab>{
  try {
    const tab_results = await browser.tabs.query({active: true, currentWindow: true})
    return tab_results[0];
  }
  catch (error) {
    console.error("Error getting active tab", error);
  };
}

let newTab: browser.Tabs.Tab | undefined;

const ports: {
  ui?: browser.Runtime.Port;
  contentScript?: browser.Runtime.Port;
  ws?: Sockette;
} = {};

const initEvent: UIEvent = {
  timestamp: new Date(),
  type: EventType.ZERO,
  data: {
    canCreateRoom: false,
    isEditable: true,
  },
};

const roomState = new RoomState();

console.log("Client script loaded");

browser.runtime.onConnect.addListener((port) => {
  // console.log("Port connected:", port.name);
  switch (port.name) {
    case "UI":
      console.log("UI port connected");
      ports.ui = port;
      ports.ui.onMessage.addListener(uiEventListener);
      console.log(initEvent);
      ports.ui.postMessage(initEvent);
      break;
    case "content-script":
      console.log("Content script port connection attempt");
      ports.contentScript = port;
      ports.contentScript.onMessage.addListener(contentEventListener);
      // console.log(canConnectToNewContent)
      // if (ports.contentScript === undefined) {
      // }
      break;
  }
});

async function contentEventListener(message: ContentEvent) {
    switch (message.type) {
        case EventType.VIDEO_ELEMENT_CHECK:{
            console.log("video element check hello!");
            if (code_val !== "") {
              initEvent.data.isEditable = false;
              initEvent.data.canCreateRoom = false;
              // canConnectToNewContent = false;
            } else {
              initEvent.data.canCreateRoom = message.data.hasVideoElement;
              // canConnectToNewContent = true;
            }
            console.log(initEvent);
            ports.ui?.postMessage(initEvent);
            break;
        }

        case EventType.VIDEO_STREAM_STATE: {
            console.log("received video stream state!");
            try {
              const createResponse = await fetch(`http${HOST_PATTERN}/create`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: id_val,
                  url: message.data.url,
                  streamState: message.data.streamState,
                  streamElement: null,
                  timestamp: message.timestamp,
                }),
              });
        
              if (createResponse.ok) {
                const createResponseJSON = await createResponse.json();
                const roomCode = createResponseJSON.code as string;
        
                const createRoomEvent: UIEvent = {
                  timestamp: message.timestamp,
                  type: EventType.CREATE_ROOM,
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
            break;
        }
        
        case EventType.PLAY:
          console.log("received play event from content");
          break;
        case EventType.PAUSE:
          console.log("received pause event from content");
          break;
        case EventType.SEEK:
          console.log("received seek event from content");
          break;
    }

    if (message.type >= EventType.PLAY && message.type <= EventType.SEEK) {
      roomState.updateStreamState(message);
      const serverEvent: ServerEvent = roomState.makeServerEvent(id_val, message.type as ServerEventType);
      ports.ws?.send(JSON.stringify(serverEvent));
    }
}

async function uiEventListener(message: UIEvent) {
  if (message.type === EventType.CREATE_ROOM) {
    console.log(message);
    if (ports.contentScript !== undefined) {
      const getVideoStreamState: ContentEvent = {
        timestamp: message.timestamp,
        type: EventType.VIDEO_STREAM_STATE,
        data: {
          url: "",
          streamState: {
            paused: true,
            currentTime: 0,
            playbackRate: 1,
          }
        },
      };
      ports.contentScript.postMessage(getVideoStreamState);
    }
  
  } else if (message.type === EventType.JOIN_ROOM) {
    const joinRoomEvent: UIEvent = {
      timestamp: message.timestamp,
      type: EventType.JOIN_ROOM,
      data: {
        success: true,
      },
    };
    
    newTab = await browser.tabs.create({active: true});
    ports.contentScript?.disconnect();
    ports.contentScript = undefined
    
    joinRoomEvent.data.success &&= await initiateJoin(message.data.code);

    if (joinRoomEvent.data.success) {
      console.log("joined created room!");
      initEvent.data.canCreateRoom = false;
      initEvent.data.isEditable = false;
      code.set(message.data.code);
    }
    ports.ui?.postMessage(joinRoomEvent);
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
      event.timestamp = new Date(event.timestamp);
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
    case EventType.ROOM_STATE: {
      console.log("received room state event");
      roomState.updateRoom(event.data, event.sourceID);
      ports.ui?.postMessage(event);

      const activeTab = await getActiveTab();
      console.log(activeTab?.url, roomState.url)

      if (activeTab?.url !== roomState.url) {
        console.log("tab url is different from room url");
        browser.tabs.onUpdated.addListener(async (tabID, changeInfo) => {
          if (tabID === activeTab?.id! && changeInfo.status === "complete") {
              await browser.scripting.executeScript({
                files: ["content-script.js"],
                target: {
                  tabId: activeTab?.id!,
                },
              });
              browser.tabs.sendMessage(activeTab?.id!, event);
            }
        });
        browser.tabs.update(activeTab?.id!, {url: roomState.url});
      } else {
        ports.contentScript?.postMessage(event);
      }

      break;
    }
    case EventType.PLAY:{
      console.log("received play event")
      ports.contentScript?.postMessage(event);
      break;
    }
    case EventType.PAUSE:{
      console.log("received pause event")
      ports.contentScript?.postMessage(event);
      break;
    }
    case EventType.SEEK:{
      console.log("received seek event")
      ports.contentScript?.postMessage(event);
      break;
    }
    default: {
      console.log("Unhandled server event:", event);
      break;
    }
  }
}
