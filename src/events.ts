enum EventType{
  CREATE_ROOM = -4,
  JOIN_ROOM,
  VIDEO_STREAM_STATE,
  VIDEO_ELEMENT_CHECK, 
  ZERO,
  USER_JOIN,
  USER_LEFT,
  ROOM_STATE,
  PLAY,
  PAUSE,
  SEEK,
  MESSAGE,
}

type ServerEvent = {
  sourceID: string;
  timestamp: Date;
  type: ServerEventType;
  data: ServerEventData;
};

type UIEvent = {
  timestamp: Date;
  type: UIEventType;
  data: UIEventData;
};

type ContentEvent = {
  timestamp: Date;
  type: ContentEventType;
  data: ContentEventData;
};

type ServerEventType = EventType.USER_JOIN | EventType.USER_LEFT | EventType.ROOM_STATE | EventType.PLAY | EventType.PAUSE | EventType.SEEK | EventType.MESSAGE;
type UIEventType = EventType.CREATE_ROOM | EventType.JOIN_ROOM | EventType.ZERO | EventType.ROOM_STATE | EventType.MESSAGE;
type ContentEventType = EventType.VIDEO_STREAM_STATE | EventType.VIDEO_ELEMENT_CHECK | EventType.ZERO | EventType.ROOM_STATE | EventType.PLAY | EventType.PAUSE | EventType.SEEK;

type ServerEventData = RoomStateData | MessageData | object;
type UIEventData = CreateRoomData | JoinRoomData | MessageData | object;
type ContentEventData =
  | VideoElementCheckData
  | VideoStreamStateData
  | object;


type CreateRoomData = {
  code: string;
  success?: boolean;
};

type JoinRoomData = {
  code?: string;
  success?: boolean;
};

type VideoStreamStateData = {
  streamState: StreamState;
  url: string;
};

type VideoElementCheckData = {
  hasVideoElement: boolean;
};

type StreamState = {
  paused: boolean;
  currentTime: number;
  playbackRate: number;
};

interface RoomStateData{
  url: string;
  streamState: StreamState;
  streamElement: object | null;
  users: string[];
};

type MessageData = {
  message: string;
};

function convertMessageToUIEvent(message: string): UIEvent {
  return {
    timestamp: new Date(),
    type: EventType.MESSAGE,
    data: {
      message: message,
    }
  }
}

export {
  type StreamState,
  type RoomStateData,
  type UIEvent,
  // type UIEventType,
  type ContentEvent,
  // type ContentEventType,
  type ServerEvent,
  type ServerEventType,
  EventType,
  convertMessageToUIEvent
};
