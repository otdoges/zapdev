"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SignupQuiz() {
  const user = useUser();
  const router = useRouter();
  const profile = useQuery(api.users.getProfile, user ? {} : "skip");
  const setPreferredMode = useMutation(api.users.setPreferredMode);
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"web" | "background" | null>(null);
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (user && profile !== undefined) {
      // If profile exists but preferredMode is not set (or undefined/null if new schema field), show quiz
      // Note: "undefined" means loading for Convex, so we check strict non-undefined
      if (profile === null || !profile.preferredMode) {
        setIsOpen(true);
      }
    }
  }, [user, profile]);

  const handleComplete = async () => {
    if (!mode) return;

    try {
      await setPreferredMode({
        mode,
        quizAnswers: { reason },
      });

      setIsOpen(false);

      if (mode === "background") {
        router.push("/agents");
      } else {
        router.push("/projects");
      }
    } catch (error) {
      console.error("Failed to set preferred mode", error);
      toast.error("Could not save your preference. Please try again.");
    }
  };

  if (!user) return null;

  const handleSkip = () => {
    // Default to "web" mode when skipping
    setMode("web");
    handleComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Welcome to ZapDev</DialogTitle>
          <DialogDescription>
            Let's customize your experience. What are you here to do?
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 1 && (
            <RadioGroup value={mode || ""} onValueChange={(v) => setMode(v as "web" | "background")}>
              <div className="flex items-center space-x-2 mb-4 p-4 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => setMode("web")}>
                <RadioGroupItem value="web" id="web" />
                <div className="flex flex-col">
                  <Label htmlFor="web" className="font-bold cursor-pointer">Web Generation</Label>
                  <span className="text-sm text-muted-foreground">Build and deploy web apps with AI</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent" onClick={() => setMode("background")}>
                <RadioGroupItem value="background" id="background" />
                <div className="flex flex-col">
                  <Label htmlFor="background" className="font-bold cursor-pointer">Background Agents (10x SWE)</Label>
                  <span className="text-sm text-muted-foreground">Run long-lived autonomous coding tasks</span>
                </div>
              </div>
            </RadioGroup>
          )}

          {step === 2 && mode === "background" && (
            <div className="space-y-4">
              <Label>What kind of tasks do you want to automate?</Label>
              <RadioGroup value={reason} onValueChange={setReason}>
                 <div className="flex items-center space-x-2"><RadioGroupItem value="migrations" id="r1"/><Label htmlFor="r1">Large-scale migrations</Label></div>
                 <div className="flex items-center space-x-2"><RadioGroupItem value="maintenance" id="r2"/><Label htmlFor="r2">Maintenance & bug fixes</Label></div>
                 <div className="flex items-center space-x-2"><RadioGroupItem value="features" id="r3"/><Label htmlFor="r3">Complex feature implementation</Label></div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>
          {step === 1 ? (
            <Button onClick={() => mode === "background" ? setStep(2) : handleComplete()} disabled={!mode}>
              {mode === "background" ? "Next" : "Get Started"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleComplete} disabled={!reason}>
                Finish
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
