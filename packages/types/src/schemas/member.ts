import { z } from "zod"

export const inviteMemberSchema = z.object({
  email: z.email("Invalid email address"),
})

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>
