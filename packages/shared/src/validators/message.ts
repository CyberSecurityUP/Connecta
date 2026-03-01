import { z } from "zod";

import { LIMITS } from "../constants/limits";

export const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(LIMITS.MAX_MESSAGE_LENGTH),
  parentId: z.string().optional(),
  attachmentIds: z
    .array(z.string())
    .max(LIMITS.MAX_ATTACHMENTS_PER_MESSAGE)
    .optional(),
});

export const updateMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(LIMITS.MAX_MESSAGE_LENGTH),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
