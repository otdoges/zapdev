"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TosPrivacyDialogProps {
  type: 'tos' | 'privacy'
  children: React.ReactNode
}

export function TosPrivacyDialog({ type, children }: TosPrivacyDialogProps) {
  const content = type === 'tos' 
    ? {
        title: "Terms of Service",
        content: "Your code is our code."
      }
    : {
        title: "Privacy Policy",
        content: "ALL models hosted in the USA we dont train models BASED On your code."
      }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mt-4 max-h-[300px]">
          <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
            {content.content}
          </div>
        </ScrollArea>
        <div className="flex justify-end mt-4">
          <Button variant="outline" className="text-sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 