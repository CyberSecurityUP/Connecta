export const LIMITS = {
  // Messages
  MAX_MESSAGE_LENGTH: 40000,
  MAX_ATTACHMENTS_PER_MESSAGE: 10,
  MESSAGES_PER_PAGE: 50,

  // Channels
  MAX_CHANNEL_NAME_LENGTH: 80,
  MAX_CHANNEL_TOPIC_LENGTH: 250,
  MAX_CHANNEL_DESCRIPTION_LENGTH: 1000,

  // Workspaces
  MAX_WORKSPACE_NAME_LENGTH: 50,
  MAX_WORKSPACE_DESCRIPTION_LENGTH: 500,

  // Users
  MAX_DISPLAY_NAME_LENGTH: 80,
  MAX_BIO_LENGTH: 500,
  MAX_CUSTOM_STATUS_LENGTH: 100,

  // Files
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_FILE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/zip",
    "application/json",
  ],

  // Search
  MIN_SEARCH_QUERY_LENGTH: 2,
  SEARCH_RESULTS_PER_PAGE: 20,

  // Invitations
  INVITATION_EXPIRY_DAYS: 7,
  MAX_INVITATIONS_PER_BATCH: 20,

  // DMs
  MAX_GROUP_DM_PARTICIPANTS: 8,
} as const;
