import * as React from"react"
import { cn } from"../../utils/cn"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
 variant?:"default"|"secondary"|"outline"|"low"|"medium"|"high"|"critical";
}

function Badge({ className, variant ="default", ...props }: BadgeProps) {
 return (
 <div
 className={cn(
"inline-flex items-center -full px-3 py-1 text-xs font-semibold transition-all focus:outline-none",
 {
"bg-blue-600/30 text-white": variant ==="default",
"bg-[#1C1C1E] text-white hover:bg-[#1C1C1E]": variant ==="secondary",
"text-emerald-400 bg-emerald-500/15": variant ==="low",
"text-amber-400 bg-amber-500/15": variant ==="medium",
"text-orange-400 bg-orange-500/15": variant ==="high",
"text-red-400 bg-red-500/15": variant ==="critical",
"text-white bg-[#1C1C1E] hover:bg-[#1C1C1E]": variant ==="outline",
 },
 className
 )}
 {...props}
 />
 )
}

export { Badge }
