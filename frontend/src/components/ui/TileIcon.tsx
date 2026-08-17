import React from "react";
import { cn } from "../../utils/cn";
import { LucideIcon } from "lucide-react";

interface TileIconProps {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
}

export function TileIcon({ icon: Icon, className, iconClassName }: TileIconProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-white rounded-[8px] p-2 shadow-sm shrink-0",
        className
      )}
    >
      <Icon className={cn("w-5 h-5 text-black", iconClassName)} strokeWidth={2.5} />
    </div>
  );
}
