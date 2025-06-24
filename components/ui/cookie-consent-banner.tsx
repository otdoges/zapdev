"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Cookie, Shield, Settings, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

interface CookiePreferences {
  essential: boolean // Always true, cannot be disabled
  analytics: boolean
  preferences: boolean
}

const COOKIE_CONSENT_KEY = 'zapdev-cookie-consent'
const COOKIE_PREFERENCES_KEY = 'zapdev-cookie-preferences'

export function CookieConsentBanner() {
  const [showToast, setShowToast] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    preferences: true
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if user has already given consent
    const hasConsent = localStorage.getItem(COOKIE_CONSENT_KEY)
    const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY)
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences))
    }
    
    // Show toast if no consent given
    if (!hasConsent) {
      // Delay showing toast slightly for better UX
      const timer = setTimeout(() => setShowToast(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      preferences: true
    }
    
    savePreferences(allAccepted)
    setShowToast(false)
  }

  const acceptEssentialOnly = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      preferences: false
    }
    
    savePreferences(essentialOnly)
    setShowToast(false)
  }

  const saveCustomPreferences = () => {
    savePreferences(preferences)
    setShowDetails(false)
    setShowToast(false)
  }

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true')
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs))
    setPreferences(prefs)
    
    // Apply preferences
    if (!prefs.analytics) {
      // Disable analytics if user opted out
      if (typeof window !== 'undefined' && (window as any).posthog) {
        (window as any).posthog.opt_out_capturing()
      }
    }
  }

  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY)
    localStorage.removeItem(COOKIE_PREFERENCES_KEY)
    setShowToast(true)
  }

  if (!mounted) return null

  return (
    <>
      {/* Cookie Consent Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            <div className="bg-gray-900/95 backdrop-blur-lg border border-gray-700/50 rounded-lg shadow-2xl overflow-hidden">
              {/* Toast Header */}
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-amber-400" />
                  <h3 className="font-semibold text-white text-sm">Cookie Consent</h3>
                </div>
                <button
                  onClick={() => setShowToast(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Toast Content */}
              <div className="px-4 pb-4">
                <p className="text-xs text-gray-300 mb-3 leading-relaxed">
                  We use <span className="font-medium text-white">essential cookies</span> for authentication. 
                  Optional analytics help improve your experience.
                </p>
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={acceptAll}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs"
                      size="sm"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Accept All
                    </Button>
                    
                    <Button
                      onClick={acceptEssentialOnly}
                      variant="outline"
                      className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 h-8 text-xs"
                      size="sm"
                    >
                      Essential Only
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => setShowDetails(true)}
                    variant="ghost"
                    className="w-full text-gray-400 hover:text-white hover:bg-gray-800/50 h-7 text-xs"
                    size="sm"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Customize Settings
                  </Button>
                </div>
              </div>
              
              {/* Toast Accent Border */}
              <div className="h-1 bg-gradient-to-r from-violet-600 to-amber-400"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Preferences Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-amber-400" />
              Cookie Preferences
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-sm text-gray-300">
              <p>
                Manage your cookie preferences below. Essential cookies cannot be disabled as they're 
                required for basic site functionality and security.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Essential Cookies */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">Essential Cookies</h4>
                    <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                      <Shield className="w-3 h-3 mr-1" />
                      Required
                    </Badge>
                  </div>
                  <Switch checked={true} disabled className="opacity-50" />
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  These cookies are necessary for authentication, security, and basic site functionality.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Examples:</strong> Login sessions, security tokens, site preferences
                </div>
              </div>

              {/* UI Preferences */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">UI Preferences</h4>
                    <Badge variant="outline" className="border-blue-600/30 text-blue-400">
                      Optional
                    </Badge>
                  </div>
                  <Switch 
                    checked={preferences.preferences} 
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, preferences: checked }))
                    }
                  />
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Remember your interface preferences like sidebar state and theme settings.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Examples:</strong> Sidebar open/closed state, layout preferences
                </div>
              </div>

              {/* Analytics */}
              <div className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">Analytics & Performance</h4>
                    <Badge variant="outline" className="border-blue-600/30 text-blue-400">
                      Optional
                    </Badge>
                  </div>
                  <Switch 
                    checked={preferences.analytics} 
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, analytics: checked }))
                    }
                  />
                </div>
                <p className="text-sm text-gray-400 mb-2">
                  Help us understand how you use our platform to improve your experience.
                </p>
                <div className="text-xs text-gray-500">
                  <strong>Note:</strong> Analytics are only active if PostHog is configured
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <Button 
                onClick={saveCustomPreferences} 
                className="bg-violet-600 hover:bg-violet-700"
              >
                Save Preferences
              </Button>
              <Button 
                onClick={() => setShowDetails(false)} 
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debug/Reset Button (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={resetConsent}
          className="fixed bottom-4 left-4 z-40 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-50 hover:opacity-100"
          title="Reset cookie consent (dev only)"
        >
          Reset Cookies
        </button>
      )}
    </>
  )
} 