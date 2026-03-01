// ===========================
// CLIENT -> SERVER events
// ===========================
export enum ClientEvent {
  // Room management
  WORKSPACE_JOIN = "workspace:join",
  WORKSPACE_LEAVE = "workspace:leave",
  CHANNEL_JOIN = "channel:join",
  CHANNEL_LEAVE = "channel:leave",
  CONVERSATION_JOIN = "conversation:join",
  CONVERSATION_LEAVE = "conversation:leave",

  // Messaging
  MESSAGE_SEND = "message:send",
  MESSAGE_EDIT = "message:edit",
  MESSAGE_DELETE = "message:delete",

  // Reactions
  REACTION_ADD = "reaction:add",
  REACTION_REMOVE = "reaction:remove",

  // Typing
  TYPING_START = "typing:start",
  TYPING_STOP = "typing:stop",

  // Presence
  PRESENCE_UPDATE = "presence:update",
  PRESENCE_HEARTBEAT = "presence:heartbeat",

  // Read receipts
  CHANNEL_MARK_READ = "channel:mark_read",
  CONVERSATION_MARK_READ = "conversation:mark_read",
}

// ===========================
// SERVER -> CLIENT events
// ===========================
export enum ServerEvent {
  // Messages
  MESSAGE_NEW = "message:new",
  MESSAGE_UPDATED = "message:updated",
  MESSAGE_DELETED = "message:deleted",

  // Threads
  THREAD_NEW_REPLY = "thread:new_reply",

  // Reactions
  REACTION_ADDED = "reaction:added",
  REACTION_REMOVED = "reaction:removed",

  // Typing
  TYPING_START = "typing:start",
  TYPING_STOP = "typing:stop",

  // Presence
  PRESENCE_CHANGED = "presence:changed",
  PRESENCE_BULK = "presence:bulk",

  // Channels
  CHANNEL_CREATED = "channel:created",
  CHANNEL_UPDATED = "channel:updated",
  CHANNEL_ARCHIVED = "channel:archived",
  CHANNEL_MEMBER_JOINED = "channel:member_joined",
  CHANNEL_MEMBER_LEFT = "channel:member_left",

  // Conversations / DMs
  CONVERSATION_CREATED = "conversation:created",
  CONVERSATION_UPDATED = "conversation:updated",

  // Notifications
  NOTIFICATION_NEW = "notification:new",
  NOTIFICATION_UNREAD_COUNT = "notification:unread_count",

  // System
  ERROR = "error",
}
