"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/projects-list";
import { StructuredData } from "@/components/seo/structured-data";

// Client-side wrapper for handling search params
function PageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const subscription = searchParams?.get("subscription");
    
    if (subscription === "success") {
      // Clean up URL
      router.replace("/", { scroll: false });
      
      // Show success toast
      toast.success("Upgrade Successful!", {
        description: "You have successfully upgraded to Pro. Enjoy your new limits!",
        duration: 6000,
      });

      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-6 py-[16vh] 2xl:py-48">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="ZapDev"
            width={50}
            height={50}
            className="hidden md:block"
          />
        </div>

        {/* Main H1: Outcome-Focused with Specific Metric */}
        <h1 className="text-2xl md:text-5xl font-bold text-center max-w-3xl mx-auto">
          Ship Your Web App Today—Not Next Quarter
        </h1>

        {/* Social Proof Section - Visible Above Fold */}
        <div className="flex flex-col items-center gap-2 justify-center">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm font-semibold">
              <span className="text-yellow-500">★★★★★</span> 4.8/5 from 2,350+ developers
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Average time to first deployment: 8 minutes</p>
        </div>

        <p className="text-lg md:text-xl text-muted-foreground text-center">
          The AI development platform for rapid application development. Stop wasting weeks on boilerplate—build production-ready web apps in minutes, not months.
        </p>

        <div className="max-w-3xl mx-auto w-full">
          <ProjectForm />
        </div>
      </section>

      {/* H2: How It Works - LSI Keyword Section */}
      <section className="space-y-8 py-16 border-t">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Full-Stack Code Generation in 3 Steps
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="text-2xl font-bold text-blue-600">1</div>
            <h3 className="font-semibold text-lg">Describe Your App</h3>
            <p className="text-muted-foreground">
              Tell our AI development platform what you want to build. Describe your app's features and functionality naturally.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-blue-600">2</div>
            <h3 className="font-semibold text-lg">AI Code Generation</h3>
            <p className="text-muted-foreground">
              Our AI code generation tool instantly creates production-ready, full-stack code for your chosen framework.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-blue-600">3</div>
            <h3 className="font-semibold text-lg">Ship Immediately</h3>
            <p className="text-muted-foreground">
              Deploy your low-code application with one click. Preview, test, and iterate in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* H2: Why Developers Choose ZapDev - LSI Keywords */}
      <section className="space-y-8 py-16 border-t">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Boost Developer Productivity by 10x
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="text-xl font-bold text-green-600 flex-shrink-0">✓</div>
              <div>
                <h4 className="font-semibold">AI-Powered Low-Code Platform</h4>
                <p className="text-sm text-muted-foreground">
                  Rapid application development without sacrificing code quality.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-xl font-bold text-green-600 flex-shrink-0">✓</div>
              <div>
                <h4 className="font-semibold">Multi-Framework Support</h4>
                <p className="text-sm text-muted-foreground">
                  React, Vue, Angular, Svelte, and Next.js in one platform.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-xl font-bold text-green-600 flex-shrink-0">✓</div>
              <div>
                <h4 className="font-semibold">Production-Ready Code</h4>
                <p className="text-sm text-muted-foreground">
                  No more boilerplate. Deploy to production with confidence.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="text-xl font-bold text-green-600 flex-shrink-0">✓</div>
              <div>
                <h4 className="font-semibold">Real-Time Preview & Iteration</h4>
                <p className="text-sm text-muted-foreground">
                  See changes instantly. Build and test in seconds.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-xl font-bold text-green-600 flex-shrink-0">✓</div>
              <div>
                <h4 className="font-semibold">Integrated Full-Stack Generator</h4>
                <p className="text-sm text-muted-foreground">
                  Backend, frontend, and database—all generated together.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-xl font-bold text-green-600 flex-shrink-0">✓</div>
              <div>
                <h4 className="font-semibold">Pay Per Generation</h4>
                <p className="text-sm text-muted-foreground">
                  Flexible pricing. Free tier to get started immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* H2: Loss Aversion / Pain Point Section */}
      <section className="space-y-8 py-16 border-t bg-slate-50 dark:bg-slate-900 -mx-4 px-4 md:rounded-lg">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Stop Wasting Weeks on Boilerplate
        </h2>
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-lg text-muted-foreground mb-8">
            Traditional development forces you to spend days on repetitive setup. With ZapDev's rapid application development platform, you focus on what makes your app unique.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-red-600">Traditional Development</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Weeks of setup and configuration</li>
                <li>• Repetitive boilerplate code</li>
                <li>• Multiple deployments for debugging</li>
                <li>• High learning curve per framework</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">With ZapDev</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 8 minutes to first deployment</li>
                <li>• AI-generated, production-ready code</li>
                <li>• Real-time preview and iteration</li>
                <li>• Deploy any framework instantly</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ProjectsList />
    </div>
  );
}

export default PageContent;


