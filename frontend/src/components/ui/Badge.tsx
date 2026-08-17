import * as React from "react"
import { cn } from "../../utils/cn"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "low" | "medium" | "high" | "critical";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-[3px] border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-accent-interactive",
        {
          "border-transparent bg-ink text-surface hover:bg-ink/80": variant === "default",
          "border-transparent bg-surface text-ink hover:bg-black/5": variant === "secondary",
          "border-risk-low text-risk-low bg-risk-low-bg": variant === "low",
          "border-risk-medium text-risk-medium bg-risk-medium-bg": variant === "medium",
          "border-risk-high text-risk-high bg-risk-high-bg": variant === "high",
          "border-risk-critical text-risk-critical bg-risk-critical-bg": variant === "critical",
          "text-ink border-hairline bg-transparent": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
