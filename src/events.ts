type ServerEvent = {
  sourceID: string;
  timestamp: string;
  type: ServerEventType;
  data: ServerEventData;
};

enum ServerEventType {
  ZERO,
  USER_JOIN,
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
  timestamp: string;
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

type VideoStreamStateData = {
  paused: boolean;
  currentTime: number;
  playbackRate: number;
  url: string;
};

type RoomStateData = {
  streamState: {
    paused: boolean;
    currentTime: number;
    playbackRate: number;
  };
  url: string;
  streamElement: object | null;
  users?: string[];
};

type ContentEventData =
  | VideoElementCheckData
  | VideoStreamStateData
  | RoomStateData
  | object;

type ContentEvent = {
  timestamp: string;
  type: ContentEventType;
  data: ContentEventData;
};

export {
  type UIEvent,
  UIEventType,
  type ContentEvent,
  ContentEventType,
  type ServerEvent,
  ServerEventType,
};
