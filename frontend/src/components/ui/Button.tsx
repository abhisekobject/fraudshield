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
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200": variant === "default",
            "bg-red-500 text-white shadow-sm hover:bg-red-600": variant === "destructive",
            "border border-[#333] bg-transparent shadow-sm hover:bg-[#1a1a1a] hover:text-white text-slate-300": variant === "outline",
            "bg-[#1a1a1a] text-white shadow-sm hover:bg-[#222]": variant === "secondary",
            "hover:bg-[#1a1a1a] text-slate-300 hover:text-white": variant === "ghost",
            "text-slate-300 underline-offset-4 hover:underline": variant === "link",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
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
