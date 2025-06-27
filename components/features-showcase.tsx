'use client';

import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const features = [
  {
    title: 'Intuitive Vibe Engine',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <path d="M12 17h.01"></path>
      </svg>
    ),
    description:
      'Our core AI understands nuance, translating abstract feelings into concrete design elements.',
  },
  {
    title: 'Multi-Framework Generation',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    ),
    description:
      "Export production-ready code for today's most loved frameworks - Svelte, Astro, Next.js, and more.",
  },
  {
    title: 'Real-Time Visual Editor',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
    description: 'See your changes live. Drag, drop, and style with instant visual feedback.',
  },
  {
    title: 'AI-Assisted UI Cloning',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="8" y="8" width="12" height="12" rx="2"></rect>
        <path d="M4 16V4a2 2 0 0 1 2-2h12"></path>
      </svg>
    ),
    description:
      'Upload an image or URL, and ZapDev intelligently recreates its structure and style.',
  },
  {
    title: 'Seamless Figma Import',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 2H9a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3Z"></path>
        <path d="M14 11h.01"></path>
      </svg>
    ),
    description: 'Bring your Figma designs to life in ZapDev with remarkable fidelity.',
  },
  {
    title: 'Intelligent Page Generation',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"></path>
        <line x1="9" y1="9" x2="10" y2="9"></line>
        <line x1="9" y1="13" x2="15" y2="13"></line>
        <line x1="9" y1="17" x2="15" y2="17"></line>
      </svg>
    ),
    description: 'Create new pages or sections based on your existing vibe or new prompts.',
  },
  {
    title: 'AI-Powered Improvement Engine',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"></path>
        <path d="M10 2c1 .5 2 2 2 5"></path>
      </svg>
    ),
    description: 'Let ZapDev analyze and suggest enhancements for UX, aesthetics, and performance.',
  },
  {
    title: 'Dynamic Component Library',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="7" height="7" x="3" y="3" rx="1"></rect>
        <rect width="7" height="7" x="14" y="3" rx="1"></rect>
        <rect width="7" height="7" x="14" y="14" rx="1"></rect>
        <rect width="7" height="7" x="3" y="14" rx="1"></rect>
      </svg>
    ),
    description:
      'Access a rich library of pre-built, vibe-matched components that are fully customizable.',
  },
  {
    title: 'Developer-First Mode',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    ),
    description: 'Full code access, custom script integration, and version control friendly.',
  },
  {
    title: 'One-Click Deployment',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 2 11 13"></path>
        <path d="M22 2 15 22 11 13 2 9 22 2z"></path>
      </svg>
    ),
    description: 'Go live in minutes. ZapDev handles the complexities of hosting and deployment.',
  },
  {
    title: 'Collaborative Workspaces',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    description: 'Design and build together in real-time with your team.',
  },
];

export default function FeaturesShowcase() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px 0px' });

  const handleFeatureHover = (index: number) => {
    setActiveFeature(index);
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-4 py-20 md:py-32">
      {/* Background glow */}
      <div className="absolute left-1/2 top-1/2 h-[50%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F3A75] opacity-5 blur-[120px]" />

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center md:mb-24"
        >
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">
            Packed with Features to Elevate Your Creations
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#EAEAEA]/70">
            Everything you need to bring your web vision to life, all in one powerful platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              onMouseEnter={() => handleFeatureHover(index)}
              onMouseLeave={() => setActiveFeature(null)}
              className={`relative rounded-xl border bg-[#121215] p-6 transition-all duration-300 ${
                activeFeature === index
                  ? 'border-[#4F3A75] shadow-[0_0_30px_rgba(79,58,117,0.2)]'
                  : 'border-[#1E1E24] hover:border-[#4F3A75]/40'
              }`}
            >
              <div
                className={`mb-4 flex items-center text-[#EAEAEA] ${
                  activeFeature === index ? 'text-[#A0527C]' : ''
                }`}
              >
                {feature.icon}
                <h3 className="ml-3 font-bold">{feature.title}</h3>
              </div>
              <p className="text-[#EAEAEA]/70">{feature.description}</p>

              {/* Hover effect glow */}
              {activeFeature === index && (
                <div className="absolute inset-0 -z-10 rounded-xl bg-[#4F3A75]/5 blur-sm" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
