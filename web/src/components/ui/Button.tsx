import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-[6px] text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-console-brand disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            "bg-console-card text-console-text hover:bg-console-hover active:bg-console-border border border-console-border shadow-sm": variant === "default",
            "bg-console-brand text-console-bg hover:bg-console-brandHover active:bg-cyan-600 border border-transparent shadow-sm": variant === "primary",
            "bg-transparent text-console-error hover:bg-console-error/10 active:bg-console-error/20 border border-console-error/20": variant === "danger",
            "border border-console-border bg-transparent hover:bg-console-hover active:bg-console-border text-console-text": variant === "outline",
            "hover:bg-console-hover active:bg-console-border hover:text-console-text text-console-secondary": variant === "ghost",
            "h-8 px-4": size === "default",
            "h-7 px-3 text-[12px]": size === "sm",
            "h-9 px-8": size === "lg",
            "h-8 w-8": size === "icon",
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
