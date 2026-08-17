import * as React from "react"
import { cn } from "../../utils/cn"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[4px] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-interactive disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-accent text-surface border border-accent/50 hover:bg-accent-interactive": variant === "default",
            "bg-risk-critical text-surface border border-risk-critical/50 hover:opacity-90": variant === "destructive",
            "border border-hairline bg-transparent hover:bg-black/5 text-ink": variant === "outline",
            "bg-surface text-ink border border-hairline hover:bg-black/5": variant === "secondary",
            "hover:bg-black/5 text-ink": variant === "ghost",
            "text-accent-interactive underline-offset-4 hover:underline": variant === "link",
            "h-9 px-4 py-2": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
