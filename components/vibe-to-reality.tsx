'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

const steps = [
  {
    title: 'Express Your Vibe',
    icon: (
      <div className="primary-gradient flex h-16 w-16 items-center justify-center rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </div>
    ),
    description:
      'Tell ZapDev the mood, style, and purpose. Use natural language, keywords, or even upload inspiration.',
  },
  {
    title: 'AI-Powered Creation',
    icon: (
      <div className="primary-gradient flex h-16 w-16 items-center justify-center rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v6.5"></path>
          <path d="M17.7 7.3 15 10"></path>
          <path d="M22 12h-6.5"></path>
          <path d="M17.7 16.7 15 14"></path>
          <path d="M12 22v-6.5"></path>
          <path d="M7.3 16.7 10 14"></path>
          <path d="M2 12h6.5"></path>
          <path d="M7.3 7.3 10 10"></path>
          <circle cx="12" cy="12" r="2"></circle>
        </svg>
      </div>
    ),
    description:
      'Our intelligent engine interprets your vibe, designs UI, and generates clean, optimized code for Svelte, Astro, and beyond.',
  },
  {
    title: 'Refine & Launch',
    icon: (
      <div className="primary-gradient flex h-16 w-16 items-center justify-center rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 3c.7 0 1.4.3 1.9.8.5.5.8 1.2.8 1.9v7c0 .7-.3 1.4-.8 1.9-.5.5-1.2.8-1.9.8h-3l-6 4v-4H6c-.7 0-1.4-.3-1.9-.8-.5-.5-.8-1.2-.8-1.9V5.7c0-.7.3-1.4.8-1.9.5-.5 1.2-.8 1.9-.8h12Z"></path>
          <path d="m10.5 9 8 8"></path>
          <path d="M9 12.25 6 12"></path>
          <path d="M14 7.5 18 9"></path>
        </svg>
      </div>
    ),
    description:
      'Visually tweak every detail, import from Figma, or dive into the code. Deploy with one click.',
  },
];

export default function VibeToReality() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px 0px' });

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[#0A0A0E] px-4 py-20 md:py-32">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-[#4F3A75] to-transparent opacity-30" />
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-[#4F3A75] to-transparent opacity-30" />

      {/* Background decorative elements */}
      <div className="absolute -left-24 top-20 h-48 w-48 rounded-full bg-[#4F3A75] opacity-5 blur-3xl"></div>
      <div className="absolute -right-24 bottom-20 h-64 w-64 rounded-full bg-[#7A3F6D] opacity-5 blur-3xl"></div>

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center md:mb-24"
        >
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">
            How ZapDev Magically Builds Your Site
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#EAEAEA]/70">
            Transform your vibe into reality in minutes with our AI-powered platform. Just tell us
            what you want, and we'll handle the rest.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 0.2 * index }}
              className="relative rounded-2xl border border-[#1E1E24] bg-[#121215] p-8 transition-colors hover:border-[#4F3A75]/50"
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 transform">{step.icon}</div>

              <h3 className="mb-4 mt-8 text-center text-xl font-bold">{step.title}</h3>
              <p className="text-center text-[#EAEAEA]/70">{step.description}</p>

              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden translate-x-full transform md:block">
                  <svg
                    width="32"
                    height="20"
                    viewBox="0 0 32 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M31.0607 10.0607C31.6464 9.47487 31.6464 8.52513 31.0607 7.93934L21.5147 -1.60658C20.9289 -2.19237 19.9792 -2.19237 19.3934 -1.60658C18.8076 -1.02079 18.8076 -0.0710172 19.3934 0.514773L27.8787 9L19.3934 17.4852C18.8076 18.071 18.8076 19.0208 19.3934 19.6066C19.9792 20.1924 20.9289 20.1924 21.5147 19.6066L31.0607 10.0607ZM-1.31134e-07 10.5L30 10.5L30 7.5L1.31134e-07 7.5L-1.31134e-07 10.5Z"
                      fill="#4F3A75"
                      fillOpacity="0.3"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
