import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full text-sm transition-smooth placeholder:text-muted-foreground/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        default: "border border-input bg-background rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        glass: "glass border border-white/20 bg-transparent backdrop-blur-xl focus:border-primary/50 focus:bg-white/5 focus:ring-2 focus:ring-primary/20 rounded-lg",
        glassElevated: "glass-elevated border border-white/30 bg-transparent backdrop-blur-xl focus:border-primary/70 focus:bg-white/10 focus:ring-2 focus:ring-primary/30 rounded-lg",
        gradient: "bg-transparent border-2 border-transparent bg-gradient-to-r from-primary/20 to-blue-600/20 focus:from-primary/40 focus:to-blue-600/40 rounded-lg",
        minimal: "bg-transparent border border-white/20 focus:border-primary rounded-lg",
      },
      size: {
        default: "min-h-[80px] px-3 py-2",
        sm: "min-h-[60px] px-2 py-1 text-xs",
        lg: "min-h-[120px] px-4 py-3 text-base",
        xl: "min-h-[160px] px-5 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  motion?: boolean
  error?: boolean
  success?: boolean
  autoResize?: boolean
  maxHeight?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant,
    size,
    motion = false,
    error = false,
    success = false,
    autoResize = false,
    maxHeight = 300,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    
    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current
        textarea.style.height = 'auto'
        const scrollHeight = Math.min(textarea.scrollHeight, maxHeight)
        textarea.style.height = `${scrollHeight}px`
      }
    }, [props.value, autoResize, maxHeight])
    
    // Merge refs
    React.useImperativeHandle(ref, () => textareaRef.current!, [textareaRef])
    
    const textareaElement = (
      <div className="relative group">
        {/* Background glow effect */}
        {(variant === 'glass' || variant === 'glassElevated') && isFocused && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-lg blur opacity-50 animate-pulse" />
        )}
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            className={cn(
              textareaVariants({ variant, size }),
              {
                "border-destructive focus:border-destructive focus:ring-destructive/20": error,
                "border-green-500 focus:border-green-500 focus:ring-green-500/20": success,
                "resize-none overflow-hidden": autoResize,
              },
              className
            )}
            style={{ 
              maxHeight: autoResize ? `${maxHeight}px` : undefined,
              overflowY: autoResize ? 'hidden' : 'auto'
            }}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            onChange={(e) => {
              if (autoResize) {
                e.target.style.height = 'auto'
                const scrollHeight = Math.min(e.target.scrollHeight, maxHeight)
                e.target.style.height = `${scrollHeight}px`
              }
              props.onChange?.(e)
            }}
            {...props}
          />
          
          {/* Character count indicator */}
          {props.maxLength && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {(props.value?.toString().length || 0)}/{props.maxLength}
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
          {textareaElement}
        </motion.div>
      )
    }
    
    return textareaElement
  }
)
Textarea.displayName = "Textarea"

// Enhanced textarea variants for common use cases
const GlassTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => <Textarea {...props} ref={ref} variant="glass" />
)
GlassTextarea.displayName = "GlassTextarea"

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => <Textarea {...props} ref={ref} autoResize />
)
AutoResizeTextarea.displayName = "AutoResizeTextarea"

const GlassAutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => <Textarea {...props} ref={ref} variant="glass" autoResize />
)
GlassAutoResizeTextarea.displayName = "GlassAutoResizeTextarea"

export { 
  Textarea, 
  textareaVariants, 
  GlassTextarea, 
  AutoResizeTextarea, 
  GlassAutoResizeTextarea 
}
