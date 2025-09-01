'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<
  HTMLInputElement,
  SwitchProps
>(({ className, checked, onCheckedChange, onChange, ...props }, ref) => (
  <input
    type="checkbox"
    className={cn(
      "toggle toggle-primary",
      className
    )}
    checked={checked}
    onChange={(e) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    }}
    {...props}
    ref={ref}
  />
))
Switch.displayName = "Switch"

export { Switch }