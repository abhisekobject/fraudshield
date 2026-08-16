import * as React from "react"
import { cn } from "../../utils/cn"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-slate-300",
        {
          "border-[#444] bg-[#2a2a2a] text-slate-200 hover:bg-[#333]": variant === "default",
          "border-[#333] bg-[#1a1a1a] text-slate-300 hover:bg-[#222]": variant === "secondary",
          "border-red-900 bg-[#2a0808] text-red-400": variant === "destructive",
          "border-emerald-900 bg-[#082a18] text-emerald-400": variant === "success",
          "border-amber-900 bg-[#2a1e08] text-amber-400": variant === "warning",
          "text-slate-300 border-[#444]": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
