import { z } from "zod"

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or less"),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
