import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full text-sm transition-smooth file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-input bg-background rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        glass: "glass border border-white/20 bg-transparent backdrop-blur-xl focus:border-primary/50 focus:bg-white/5 focus:ring-2 focus:ring-primary/20 rounded-lg",
        glassElevated: "glass-elevated border border-white/30 bg-transparent backdrop-blur-xl focus:border-primary/70 focus:bg-white/10 focus:ring-2 focus:ring-primary/30 rounded-lg",
        gradient: "bg-transparent border-2 border-transparent bg-gradient-to-r from-primary/20 to-blue-600/20 focus:from-primary/40 focus:to-blue-600/40 rounded-lg",
        minimal: "bg-transparent border-0 border-b-2 border-white/20 focus:border-primary rounded-none px-0",
      },
      size: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3 text-base",
        xl: "h-14 px-5 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  motion?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  loading?: boolean
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant,
    size,
    motion = false,
    leftIcon,
    rightIcon,
    loading = false,
    error = false,
    success = false,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(e)
    }
    
    const inputElement = (
      <div className="relative group">
        {/* Background glow effect */}
        {(variant === 'glass' || variant === 'glassElevated') && isFocused && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-lg blur opacity-50 animate-pulse" />
        )}
        
        <div className="relative flex items-center">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 z-10 text-muted-foreground group-focus-within:text-primary transition-colors">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              inputVariants({ variant, size }),
              {
                "border-destructive focus:border-destructive focus:ring-destructive/20": error,
                "border-green-500 focus:border-green-500 focus:ring-green-500/20": success,
                "pl-10": leftIcon,
                "pr-10": rightIcon || loading,
              },
              className
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            onChange={handleChange}
            {...props}
          />
          
          {/* Right icon or loading spinner */}
          {(rightIcon || loading) && (
            <div className="absolute right-3 z-10 text-muted-foreground">
              {loading ? (
                <motion.div
                  className="w-4 h-4 border-2 border-muted-foreground/20 border-t-primary rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        
        {/* Enhanced focus indicator for glass variants */}
        {(variant === 'glass' || variant === 'glassElevated') && (
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/5 to-blue-600/5 opacity-0 pointer-events-none"
            animate={{ opacity: isFocused ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    )
    
    if (motion) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileFocus={{ scale: 1.01 }}
        >
          {inputElement}
        </motion.div>
      )
    }
    
    return inputElement
  }
)
Input.displayName = "Input"

// Enhanced input variants for common use cases
const GlassInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <Input {...props} ref={ref} variant="glass" />
)
GlassInput.displayName = "GlassInput"

const GradientInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <Input {...props} ref={ref} variant="gradient" />
)
GradientInput.displayName = "GradientInput"

const MinimalInput = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <Input {...props} ref={ref} variant="minimal" />
)
MinimalInput.displayName = "MinimalInput"

export { Input, inputVariants, GlassInput, GradientInput, MinimalInput }
