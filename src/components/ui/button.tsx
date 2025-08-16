import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, MotionProps } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 transition-smooth relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "button-gradient text-white font-semibold shadow-md hover:shadow-lg",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg",
        outline:
          "border border-white/20 bg-transparent hover:bg-white/10 hover:border-white/40 backdrop-blur-sm",
        secondary:
          "glass text-foreground hover:bg-white/10 backdrop-blur-xl border border-white/10",
        ghost: "hover:bg-white/10 text-muted-foreground hover:text-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline bg-transparent",
        glass: "glass text-foreground glass-hover border border-white/10",
        glassElevated: "glass-elevated text-foreground glass-hover border border-white/20",
        gradient: "button-gradient text-white font-semibold",
        gradientOutline: "bg-transparent border-2 border-transparent bg-gradient-to-r from-primary to-purple-600 bg-clip-padding hover:shadow-glow",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-lg",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10 rounded-lg",
        iconSm: "h-8 w-8 rounded-lg",
        iconLg: "h-12 w-12 rounded-xl",
      },
      animation: {
        none: "",
        subtle: "hover:scale-105 active:scale-95",
        bounce: "hover:scale-105 hover:-translate-y-1 active:scale-95 active:translate-y-0",
        glow: "hover:animate-pulse-glow",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "subtle",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  motion?: boolean
  motionProps?: MotionProps
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    asChild = false, 
    motion = true,
    motionProps = {},
    loading = false,
    loadingText = "Loading...",
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : motion && !asChild ? motion.button : "button"
    const isDisabled = disabled || loading
    
    const defaultMotionProps = motion && !asChild ? {
      whileHover: animation !== 'none' ? { scale: 1.02, y: -1 } : undefined,
      whileTap: animation !== 'none' ? { scale: 0.98, y: 0 } : undefined,
      transition: { type: "spring", stiffness: 400, damping: 25 },
      ...motionProps
    } : {}
    
    const content = loading ? (
      <>
        <motion.div
          className="w-4 h-4 mr-2 border-2 border-white/20 border-t-current rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        {loadingText}
      </>
    ) : (
      <>
        {leftIcon && (
          <span className="mr-2 -ml-1">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="ml-2 -mr-1">
            {rightIcon}
          </span>
        )}
      </>
    )
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={isDisabled}
        {...(motion && !asChild ? defaultMotionProps : {})}
        {...props}
      >
        {/* Enhanced button effects */}
        {(variant === 'default' || variant === 'gradient') && (
          <>
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
          </>
        )}
        
        {/* Glass effect overlay for glass variants */}
        {(variant === 'glass' || variant === 'glassElevated') && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 hover:opacity-100 transition-opacity rounded-inherit" />
        )}
        
        <span className="relative z-10 flex items-center justify-center">
          {content}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

// Enhanced button variants for common use cases
const GradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} ref={ref} variant="gradient" />
)
GradientButton.displayName = "GradientButton"

const GlassButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} ref={ref} variant="glass" />
)
GlassButton.displayName = "GlassButton"

const GlassElevatedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button {...props} ref={ref} variant="glassElevated" />
)
GlassElevatedButton.displayName = "GlassElevatedButton"

export { 
  Button, 
  buttonVariants, 
  GradientButton, 
  GlassButton, 
  GlassElevatedButton 
}
