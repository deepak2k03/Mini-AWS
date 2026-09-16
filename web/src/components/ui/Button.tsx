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
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-slate-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 shadow-sm": variant === "default",
            "bg-cyan-500 text-slate-950 hover:bg-cyan-400 border border-cyan-500 shadow-sm": variant === "primary",
            "bg-transparent text-red-400 hover:bg-red-950/30 border border-red-900/50": variant === "danger",
            "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300": variant === "outline",
            "hover:bg-slate-800/80 hover:text-slate-100 text-slate-400": variant === "ghost",
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
