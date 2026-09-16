import * as React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline';
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-console-brand",
        {
          "border-transparent bg-console-elevated text-console-text": variant === "default",
          "border-console-success/20 bg-console-success/10 text-console-success": variant === "success",
          "border-console-warning/20 bg-console-warning/10 text-console-warning": variant === "warning",
          "border-console-error/20 bg-console-error/10 text-console-error": variant === "error",
          "text-console-secondary border-console-border": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
