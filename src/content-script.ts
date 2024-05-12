// import browser from "webextension-polyfill";

import type { ContentEvent } from "./events";
enum EventType {
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


let lastUpdate: Date = new Date();
const UPDATE_INTERVAL_MILI = 75;

function canSendEvent(){
  const currentTime = new Date();
  const elapsedMili = currentTime.getTime() - lastUpdate.getTime();
  console.log("elapsed mili", elapsedMili)
  if (elapsedMili > UPDATE_INTERVAL_MILI){
    lastUpdate = currentTime;
    return true
  }
  return false;
}

function main() {
  const videoElementCheckEvent: ContentEvent = {
    timestamp: new Date(),
    type: EventType.VIDEO_ELEMENT_CHECK,
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
    return;
  }

  clientPort.postMessage(videoElementCheckEvent);
}

main();

clientPort.onMessage.addListener((message: ContentEvent) => {
  console.log(message);
  if (message === undefined) return;
  switch (message.type) {
    case EventType.VIDEO_STREAM_STATE:{
        const videoStreamStateEvent: ContentEvent = {
          timestamp: new Date(),
          type: EventType.VIDEO_STREAM_STATE,
          data: {
            streamState:{
                paused: videoElement!.paused,
                currentTime: videoElement!.currentTime,
                playbackRate: videoElement!.playbackRate,
            },
            url: window.location.href,
          },
        };
        clientPort.postMessage(videoStreamStateEvent);
    }
    case EventType.ROOM_STATE:
    case EventType.PLAY:
    case EventType.PAUSE:
    case EventType.SEEK:
        updateRoomState(message);
    // default:{
    //     updateRoomState(message);
    // }
  }
});

browser.runtime.onMessage.addListener((message: ContentEvent) => {
  if (message === undefined) return;
  console.log(message);
  if (message.type === EventType.ROOM_STATE) {
    console.log("room state received");
    updateRoomState(message);
  }
});

videoElement!.addEventListener("play", (event) => {
    console.log("play event");
    if (canSendEvent()){
      clientPort.postMessage(generateEvent(EventType.PLAY));
    }
})

videoElement!.addEventListener("pause", (event) => {
    console.log("pause event");
    if (canSendEvent()){
      clientPort.postMessage(generateEvent(EventType.PAUSE));
    }
})

videoElement!.addEventListener("seeked", (event) => {
    console.log("seek event");
    if (canSendEvent()){
      clientPort.postMessage(generateEvent(EventType.SEEK));
    }
})

function updateRoomState(message: ContentEvent) {
  console.log("updating room state");
  console.log(message);
  console.log("video element", videoElement)
  lastUpdate = new Date();
  let timeDelta =
    (lastUpdate.getTime() - message.timestamp.getTime()) / 1000;
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
          clientPort.postMessage(generateEvent(EventType.PAUSE))
        });
    }
  }
}

function generateEvent(type: EventType): ContentEvent{
  return {
    timestamp: new Date(),
    type: type,
    data: {
        streamState:{
            paused: videoElement!.paused,
            currentTime: videoElement!.currentTime,
            playbackRate: videoElement!.playbackRate,
        }
    },
  };
}
