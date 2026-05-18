export * from "./schemas/auth"

export type Role = "OWNER" | "MEMBER"
export type Severity = "high" | "medium" | "low"

export interface ScanWarning {
  variable: string
  issue: string
  severity: Severity
  recommendation: string
}

export interface ScanSummary {
  high: number
  medium: number
  low: number
  total: number
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
