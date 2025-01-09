import React from "react"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    disabled={disabled}
    className={`h-4 w-4 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
