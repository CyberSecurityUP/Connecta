import { z } from "zod";

import { LIMITS } from "../constants/limits";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(LIMITS.MAX_WORKSPACE_NAME_LENGTH),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(LIMITS.MAX_WORKSPACE_DESCRIPTION_LENGTH).optional(),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(LIMITS.MAX_WORKSPACE_NAME_LENGTH)
    .optional(),
  description: z.string().max(LIMITS.MAX_WORKSPACE_DESCRIPTION_LENGTH).optional(),
});

export const inviteMembersSchema = z.object({
  emails: z
    .array(z.string().email())
    .min(1, "At least one email is required")
    .max(LIMITS.MAX_INVITATIONS_PER_BATCH),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]).default("MEMBER"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type InviteMembersInput = z.infer<typeof inviteMembersSchema>;
