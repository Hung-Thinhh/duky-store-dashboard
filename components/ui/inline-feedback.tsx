"use client"

import * as React from "react"
import { IconX } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

type InlineFeedbackProps = {
  message: string | null
  tone?: "info" | "success" | "error"
  className?: string
}

const toneClassNames = {
  info: "border-stone-200 bg-white text-stone-700 shadow-stone-900/10",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-900/10",
  error: "border-red-200 bg-red-50 text-red-700 shadow-red-900/10",
}

export function InlineFeedback({
  message,
  tone = "info",
  className,
}: InlineFeedbackProps) {
  const [isVisible, setIsVisible] = React.useState(Boolean(message))

  React.useEffect(() => {
    if (!message) {
      setIsVisible(false)
      return
    }

    setIsVisible(true)
    const timeout = window.setTimeout(() => {
      setIsVisible(false)
    }, 3200)

    return () => window.clearTimeout(timeout)
  }, [message, tone])

  if (!message || !isVisible) return null

  return (
    <div className="pointer-events-none fixed top-5 right-5 z-[120] w-[min(420px,calc(100vw-32px))]">
      <div
        className={cn(
          "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur",
          toneClassNames[tone],
          className
        )}
        role="status"
        aria-live="polite"
      >
        <span className="min-w-0 flex-1 leading-6">{message}</span>
        <button
          type="button"
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-current/70 transition hover:bg-white/70 hover:text-current"
          aria-label="Đóng thông báo"
          onClick={() => setIsVisible(false)}
        >
          <IconX className="size-4" />
        </button>
      </div>
    </div>
  )
}
