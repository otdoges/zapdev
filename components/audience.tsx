'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from './ui/button';
import { CrossBrowserButton } from './ui/cross-browser-button';

export default function Audience() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px 0px' });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0E] px-4 py-20 md:py-32">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-[#4F3A75] to-transparent opacity-30" />
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-[#4F3A75] to-transparent opacity-30" />

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center md:mb-24"
        >
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">
            Whether You're a Creator or a Coder, ZapDev Empowers You
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#EAEAEA]/70">
            A powerful platform that adapts to your skillset and workflow.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
          {/* For Non-Technical Creators */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-2xl border border-[#1E1E24] bg-gradient-to-br from-[#121215] to-[#17171c] p-8 md:p-10"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#4F3A75]/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"></path>
                <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
                <path d="M12 2v2"></path>
                <path d="M12 22v-2"></path>
                <path d="m17 20.66-1-1.73"></path>
                <path d="M11 10.27 7 3.34"></path>
                <path d="m20.66 17-1.73-1"></path>
                <path d="m3.34 7 1.73 1"></path>
                <path d="M22 12h-2"></path>
                <path d="M2 12h2"></path>
                <path d="m20.66 7-1.73 1"></path>
                <path d="m3.34 17 1.73-1"></path>
                <path d="m17 3.34-1 1.73"></path>
                <path d="m7 20.66-1-1.73"></path>
              </svg>
            </div>

            <h3 className="mb-4 text-2xl font-bold md:text-3xl">
              Dream It, Vibe It, Build It. No Code Needed.
            </h3>

            <p className="mb-6 text-lg text-[#EAEAEA]/70">
              Entrepreneurs, artists, marketers, hobbyists – bring your unique vision to the web
              without writing a single line of code. ZapDev makes professional web design accessible
              to everyone.
            </p>

            <ul className="mb-8 space-y-3">
              {[
                'Explain your vision in simple words',
                'Choose from suggested designs',
                'Customize with visual controls',
                'Publish without technical knowledge',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F3A75]/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <CrossBrowserButton 
              className="cross-browser-button gradient-button-primary w-full rounded-full px-8 py-6 md:w-auto"
              motionProps={{
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 }
              }}
            >
              Start Creating Without Code
            </CrossBrowserButton>

            <div className="relative mt-10">
              <div className="rounded-xl border border-[#1E1E24] bg-[#191920] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500/70"></div>
                  <div className="h-2 w-2 rounded-full bg-yellow-500/70"></div>
                  <div className="h-2 w-2 rounded-full bg-green-500/70"></div>
                  <div className="text-xs text-[#EAEAEA]/40">Visual Editor</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1 h-32 rounded bg-[#111115]"></div>
                  <div className="col-span-2 h-32 rounded bg-[#111115]"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* For Developers */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="rounded-2xl border border-[#1E1E24] bg-gradient-to-br from-[#121215] to-[#17171c] p-8 md:p-10"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#7A3F6D]/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m8 18-6-6 6-6"></path>
                <path d="m16 6 6 6-6 6"></path>
                <path d="m10 4 4 16"></path>
              </svg>
            </div>

            <h3 className="mb-4 text-2xl font-bold md:text-3xl">
              Accelerate Your Workflow. Elevate Your Craft.
            </h3>

            <p className="mb-6 text-lg text-[#EAEAEA]/70">
              Stop wrestling with boilerplate. Generate clean, maintainable Svelte or Astro code as
              a starting point or for entire projects. Focus on complex logic while ZapDev handles
              the UI scaffolding and vibe.
            </p>

            <ul className="mb-8 space-y-3">
              {[
                'Generate production-ready code',
                'Full access to source files',
                'Optimized for modern frameworks',
                'Component-based architecture',
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7A3F6D]/30">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <CrossBrowserButton 
              className="cross-browser-button gradient-button-primary w-full rounded-full px-8 py-6 md:w-auto"
              motionProps={{
                whileHover: { scale: 1.02 },
                whileTap: { scale: 0.98 }
              }}
            >
              Explore Developer Features
            </CrossBrowserButton>

            <div className="relative mt-10">
              <div className="rounded-xl border border-[#1E1E24] bg-[#191920] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500/70"></div>
                  <div className="h-2 w-2 rounded-full bg-yellow-500/70"></div>
                  <div className="h-2 w-2 rounded-full bg-green-500/70"></div>
                  <div className="text-xs text-[#EAEAEA]/40">Code Editor</div>
                </div>
                <div className="rounded bg-[#111115] p-3 font-mono text-xs leading-relaxed text-[#EAEAEA]/70">
                  <span className="text-blue-400">import</span>{' '}
                  <span className="text-[#EAEAEA]">&#123; useState &#125;</span>{' '}
                  <span className="text-blue-400">from</span>{' '}
                  <span className="text-green-300">'react'</span>;<br />
                  <br />
                  <span className="text-purple-400">function</span>{' '}
                  <span className="text-yellow-300">Component</span>() &#123;
                  <br />
                  &nbsp;&nbsp;<span className="text-blue-400">const</span> [
                  <span className="text-[#EAEAEA]">state, setState</span>] ={' '}
                  <span className="text-yellow-300">useState</span>(
                  <span className="text-orange-300">false</span>);
                  <br />
                  &nbsp;&nbsp;<span className="text-blue-400">return</span> (<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span className="text-red-400">div</span>&gt;...&lt;/
                  <span className="text-red-400">div</span>&gt;
                  <br />
                  &nbsp;&nbsp;);
                  <br />
                  &#125;
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
