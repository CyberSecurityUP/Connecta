import { z } from "zod";

import { LIMITS } from "../constants/limits";

export const createChannelSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(LIMITS.MAX_CHANNEL_NAME_LENGTH)
    .regex(
      /^[a-z0-9][a-z0-9-]*$/,
      "Channel name must start with a letter or number and contain only lowercase letters, numbers, and hyphens",
    ),
  type: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  topic: z.string().max(LIMITS.MAX_CHANNEL_TOPIC_LENGTH).optional(),
  description: z.string().max(LIMITS.MAX_CHANNEL_DESCRIPTION_LENGTH).optional(),
});

export const updateChannelSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(LIMITS.MAX_CHANNEL_NAME_LENGTH)
    .regex(/^[a-z0-9][a-z0-9-]*$/)
    .optional(),
  topic: z.string().max(LIMITS.MAX_CHANNEL_TOPIC_LENGTH).optional(),
  description: z.string().max(LIMITS.MAX_CHANNEL_DESCRIPTION_LENGTH).optional(),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
