import * as React from"react"
import { cn } from"../../utils/cn"

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?:"default"|"destructive"|"outline"|"secondary"|"ghost"|"link";
 size?:"default"|"sm"|"lg"|"icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant ="default", size ="default", ...props }, ref) => {
 return (
 <button
 ref={ref}
 className={cn(
"inline-flex items-center justify-center whitespace-nowrap -xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
 {
"bg-blue-600 hover:bg-blue-500 text-white /25": variant ==="default",
"bg-red-600/80 hover:bg-red-600 text-white /20": variant ==="destructive",
"bg-[#1C1C1E] hover:bg-[#1C1C1E] text-white": variant ==="outline",
"bg-[#1C1C1E] text-white hover:bg-[#1C1C1E]": variant ==="secondary",
"hover:bg-[#1C1C1E] text-white hover:text-white": variant ==="ghost",
"text-white underline-offset-4 hover:underline": variant ==="link",
"h-10 px-4 py-2": size ==="default",
"h-8 px-3 text-xs": size ==="sm",
"h-11 px-8 text-base": size ==="lg",
"h-9 w-9": size ==="icon",
 },
 className
 )}
 {...props}
 />
 )
 }
)
Button.displayName ="Button"

export { Button }
