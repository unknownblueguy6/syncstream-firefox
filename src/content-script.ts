// import browser from "webextension-polyfill";

import type { ContentEvent } from "./events";
enum ContentEventType {
  VIDEO_STREAM_STATE = -2,
  VIDEO_ELEMENT_CHECK = -1,
  ZERO = 0,
  ROOM_STATE = 3,
  PLAY = 4,
  PAUSE = 5,
  SEEK = 6,
}

console.log("Content script loaded");
const videoElement = document.querySelector("video");
const clientPort = browser.runtime.connect({ name: "content-script" });

function main() {
  const videoElementCheckEvent: ContentEvent = {
    timestamp: new Date(),
    type: ContentEventType.VIDEO_ELEMENT_CHECK,
    data: {
      hasVideoElement: false,
    },
  };

  console.log(window.location.href);

  if (videoElement !== null) {
    videoElementCheckEvent.data.hasVideoElement = true;
    console.log("video element found");
  } else {
    console.log("video element not found");
    // return;
  }

  clientPort.postMessage(videoElementCheckEvent);
}

main();

clientPort.onMessage.addListener((message: ContentEvent) => {
  console.log(message);
  if (message === undefined) return;
  if (message.type === ContentEventType.VIDEO_STREAM_STATE) {
    const videoStreamStateEvent: ContentEvent = {
          timestamp: new Date(),
      type: ContentEventType.VIDEO_STREAM_STATE,
      data: {
        paused: videoElement!.paused,
        currentTime: videoElement!.currentTime,
        playbackRate: videoElement!.playbackRate,
        url: window.location.href,
      },
    };
    clientPort.postMessage(videoStreamStateEvent);
  } else if (message.type === ContentEventType.ROOM_STATE) {
    console.log("room state????");
    updateRoomState(message);
  }
});

browser.runtime.onMessage.addListener((message: ContentEvent) => {
  if (message === undefined) return;
  console.log(message);
  if (message.type === ContentEventType.ROOM_STATE) {
    console.log("room state received");
    updateRoomState(message);
  }
});

function updateRoomState(message: ContentEvent) {
  console.log("updating room state");
  let timeDelta =
    (new Date().getTime() - new Date(message.timestamp).getTime()) / 1000;
  if (message.data.streamState.paused) {
    timeDelta = 0;
  }
  videoElement!.currentTime =
    message.data.streamState.currentTime +
    timeDelta * message.data.streamState.playbackRate;
  videoElement!.playbackRate = message.data.streamState.playbackRate;
  if (message.data.streamState.paused) {
    videoElement!.pause();
  } else {
    if (videoElement!.paused) {
      videoElement!
        .play()
        .then(() => {
          console.log("playing");
        })
        .catch(() => {
          console.log("send pause event");
          // clientPort.postMessage(generatePauseEvent())
        });
    }
  }
}
