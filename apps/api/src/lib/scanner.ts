import OpenAI from "openai"

export type Warning = {
  variable: string
  severity: "high" | "medium" | "low"
  issue: string
  recommendation: string
}

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

const SYSTEM_PROMPT = `You are a security auditor specializing in environment file (.env) security.
Analyze the provided .env file content and identify security vulnerabilities.

Detection categories:
- Weak or placeholder values (e.g. password, 123456, changeme, secret, test, admin, example)
- Live production API keys (e.g. sk-live- Stripe keys, real AWS keys, real GitHub tokens)
- Short or predictable secrets (JWT_SECRET, ENCRYPTION_KEY, SESSION_SECRET under 32 characters)
- Insecure flags enabled (DEBUG=true, DISABLE_AUTH=true, SKIP_SSL_VERIFICATION=true, ALLOW_ALL_ORIGINS=true)
- Private keys or certificates embedded directly in the file
- Over-privileged database connections (using root or admin users)
- Secrets that should be managed externally (OAuth tokens, webhook secrets)

Call the report_security_warnings function with all issues found.
If no issues are found, call it with an empty warnings array.`

const TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "report_security_warnings",
    description: "Report all security warnings found in the .env file",
    parameters: {
      type: "object",
      properties: {
        warnings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              variable: { type: "string", description: "The variable name (e.g. JWT_SECRET)" },
              severity: { type: "string", enum: ["high", "medium", "low"] },
              issue: { type: "string", description: "What is wrong with this value" },
              recommendation: { type: "string", description: "How to fix it" },
            },
            required: ["variable", "severity", "issue", "recommendation"],
          },
        },
      },
      required: ["warnings"],
    },
  },
}

export async function scanEnvContent(content: string): Promise<Warning[]> {
  const response = await client.chat.completions.create({
    model: process.env.LLM_MODEL ?? "llama-3.3-70b-versatile",
    max_tokens: 2048,
    tools: [TOOL],
    tool_choice: { type: "function", function: { name: "report_security_warnings" } },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Analyze this .env file for security issues:\n\n${content}` },
    ],
  })

  const toolCall = response.choices[0]?.message?.tool_calls?.[0]
  if (!toolCall || toolCall.type !== "function") return []

  try {
    const input = JSON.parse(toolCall.function.arguments) as { warnings: Warning[] }
    return Array.isArray(input.warnings) ? input.warnings : []
  } catch {
    return []
  }
}
