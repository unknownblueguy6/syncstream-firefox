type ServerEvent = {
  sourceID: string;
  timestamp: Date;
  type: ServerEventType;
  data: ServerEventData;
};

enum ServerEventType {
  USER_JOIN = 1,
  USER_LEFT,
  ROOM_STATE,
  PLAY,
  PAUSE,
  SEEK,
  MESSAGE,
}

type ServerEventData = RoomStateData | object;

enum UIEventType {
  CREATE_ROOM = -4,
  JOIN_ROOM = -3,
  // VIDEO_STREAM_STATE = -2,
  // VIDEO_ELEMENT_CHECK = -1,
  ZERO = 0,
  // USER_JOIN = 1,
  // USER_LEFT = 2,
  ROOM_STATE = 3,
  // PLAY = 4,
  // PAUSE = 5,
  // SEEK = 6,
  MESSAGE = 7,
}

type CreateRoomData = {
  code: string;
  success?: boolean;
};

type JoinRoomData = {
  code?: string;
  success?: boolean;
};

type UIEventData = CreateRoomData | JoinRoomData | object;

type UIEvent = {
  timestamp: Date;
  type: UIEventType;
  data: UIEventData;
};

enum ContentEventType {
  VIDEO_STREAM_STATE = -2,
  VIDEO_ELEMENT_CHECK = -1,
  ZERO = 0,
  ROOM_STATE = 3,
  PLAY = 4,
  PAUSE = 5,
  SEEK = 6,
}

type VideoElementCheckData = {
  hasVideoElement: boolean;
};

type StreamState = {
  paused: boolean;
  currentTime: number;
  playbackRate: number;
};

type VideoStreamStateData = {
  streamState: StreamState;
  url: string;
};

interface RoomStateData{
  url: string;
  streamState: StreamState;
  streamElement: object | null;
  users: string[];
};

type ContentEventData =
  | VideoElementCheckData
  | VideoStreamStateData
  | object;

type ContentEvent = {
  timestamp: Date;
  type: ContentEventType;
  data: ContentEventData;
};

export {
  type StreamState,
  type RoomStateData,
  type UIEvent,
  UIEventType,
  type ContentEvent,
  ContentEventType,
  type ServerEvent,
  ServerEventType,
};
