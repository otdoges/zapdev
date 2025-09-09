'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles, Crown, X } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (plan: string) => void;
}

export default function PricingModal({ isOpen, onClose, onUpgrade }: PricingModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="w-full max-w-5xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border bg-background text-foreground">
            <div className="flex items-center justify-between p-6 pb-0">
              <div>
                <h2 className="text-2xl font-bold">Upgrade your plan</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  You've reached the Free plan limit. Unlock more with Pro.
                </p>
              </div>
              <button
                aria-label="Close pricing"
                onClick={onClose}
                className="rounded-md p-2 hover:bg-accent hover:text-accent-foreground transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free */}
                <Card className="transition hover:shadow-md hover:scale-[1.01]">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Free</CardTitle>
                        <CardDescription>Everything you need to get started.</CardDescription>
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold">$0</span>
                      <span className="text-xs text-muted-foreground">No credit card required</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2" role="list">
                      {['Up to 5 chats', 'Basic templates', 'Standard sandbox time', 'Community support'].map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5" aria-hidden="true" />
                          <span className="text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5">
                      <Button
                        variant="outline"
                        className="w-full"
                        aria-label="Get started with Free"
                        onClick={() => onUpgrade('free')}
                      >
                        Get started
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Pro */}
                <Card className="relative transition hover:shadow-md hover:scale-[1.01] ring-1 ring-primary/20">
                  <span className="absolute top-3 right-3 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Most popular
                  </span>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-primary/10 p-2">
                        <Crown className="h-6 w-6 text-primary" aria-hidden="true" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Pro</CardTitle>
                        <CardDescription>Build without limits with advanced AI.</CardDescription>
                      </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-bold">$20</span>
                      <span className="text-xs text-muted-foreground">per month, cancel anytime</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2" role="list">
                      {['Unlimited chats', 'Advanced AI models', 'Extended sandbox time', 'Priority support'].map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5" aria-hidden="true" />
                          <span className="text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5">
                      <Button
                        className="w-full"
                        variant="orange"
                        aria-label="Upgrade to Pro"
                        onClick={() => onUpgrade('pro')}
                      >
                        Upgrade to Pro
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
