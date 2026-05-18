import { cn } from "@/lib/utils"

type InlineFeedbackProps = {
  message: string | null
  tone?: "info" | "success" | "error"
  className?: string
}

const toneClassNames = {
  info: "border-border bg-card text-muted-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  error: "border-destructive/20 bg-destructive/10 text-destructive",
}

export function InlineFeedback({ message, tone = "info", className }: InlineFeedbackProps) {
  if (!message) return null

  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", toneClassNames[tone], className)}>
      {message}
    </div>
  )
}
