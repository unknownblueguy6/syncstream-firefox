import type {
  StreamState,
  RoomStateData,
  ContentEvent,
  ServerEvent,
  ServerEventType,
} from "./events";

// const TOLERANCE = 1/64 // power of 2 closest to 1/60

// function areEqual(a: number, b: number){
//     return Math.abs(a-b) < TOLERANCE;
// }

class RoomState implements RoomStateData {
  url: string;
  streamState: StreamState;
  streamElement: object | null;
  users: string[];
  lastUpdate: Date;
  roomID: string; // this is the client's ID inside the room. do not use to make server events.

  constructor() {
    this.url = "";
    this.streamState = {
      paused: true,
      currentTime: 0,
      playbackRate: 1,
    };
    this.streamElement = null;
    this.users = [];
    this.lastUpdate = new Date();
    this.roomID = "";
  }

  updateRoom(newRoomState: RoomStateData, roomID: string) {
    this.roomID = roomID;
    this.url = newRoomState.url;
    this.streamState = newRoomState.streamState;
    this.streamElement = newRoomState.streamElement;
    this.users = newRoomState.users;
    this.lastUpdate = new Date();
  }

  updateStreamState(contentEvent: ContentEvent) {
    this.streamState = contentEvent.data.streamState;
    this.lastUpdate = contentEvent.timestamp;
  }

  // isSameStreamState(newState: StreamState, timestamp: Date){
  //     if (this.streamState.paused !== newState.paused){
  //         return false;
  //     } else{
  //         const timeDelta = this.streamState.paused ? 0 : (timestamp.getTime() - this.lastUpdate.getTime())/1000;
  //         if (!areEqual(this.streamState.playbackRate, newState.playbackRate)){
  //             return false;
  //         } else if (!areEqual(this.streamState.currentTime + timeDelta*this.streamState.playbackRate, newState.currentTime)){
  //             return false;
  //         } else{
  //             return true;
  //         }
  //     }
  // }

  makeServerEvent(id: string, type: ServerEventType): ServerEvent {
    return {
      sourceID: id,
      timestamp: this.lastUpdate,
      type: type,
      data: {
        streamState: this.streamState,
      },
    };
  }
}

export { RoomState };
