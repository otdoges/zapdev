'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const testimonials = [
  {
    quote:
      'ZapDev completely transformed how I approach web design. I described the dreamy, ethereal feel I wanted, and within minutes I had a stunning site that perfectly matched my vision.',
    name: 'Alex Chen',
    role: 'Digital Artist & Entrepreneur',
    avatarGradient: 'from-purple-500 to-pink-500',
  },
  {
    quote:
      'As a developer, I was skeptical at first, but the code ZapDev generates is clean, well-structured, and exactly what I would have written myself—just way faster.',
    name: 'Morgan Wilson',
    role: 'Lead Frontend Developer',
    avatarGradient: 'from-blue-500 to-cyan-500',
  },
  {
    quote:
      'Our agency has cut design-to-development time by 70% using ZapDev. The ability to quickly iterate on vibe-based concepts has been game-changing for client presentations.',
    name: 'Jamie Rodriguez',
    role: 'Creative Director',
    avatarGradient: 'from-amber-500 to-orange-500',
  },
];

export default function Testimonials() {
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
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">Loved by Innovators</h2>
          <p className="mx-auto max-w-2xl text-lg text-[#EAEAEA]/70">
            Join thousands of creators and developers who are building the future with ZapDev.
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 0.2 * index }}
              className="relative rounded-2xl border border-[#1E1E24] bg-[#121215] p-8"
            >
              {/* Quote mark */}
              <div className="absolute -left-2 -top-5 font-serif text-[80px] leading-none text-[#4F3A75]/20">
                "
              </div>

              <div className="relative">
                <p className="relative z-10 mb-8 text-[#EAEAEA]">"{testimonial.quote}"</p>

                <div className="flex items-center">
                  {/* Avatar with gradient */}
                  <div
                    className={`h-12 w-12 rounded-full bg-gradient-to-br ${testimonial.avatarGradient} flex items-center justify-center text-lg font-medium text-white`}
                  >
                    {testimonial.name.charAt(0)}
                  </div>

                  <div className="ml-3">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-[#EAEAEA]/70">{testimonial.role}</div>
                  </div>
                </div>
              </div>

              {/* Subtle glow behind the card */}
              <div className="absolute inset-0 -z-10 translate-y-2 scale-[0.97] transform rounded-2xl bg-[#4F3A75]/5 blur-lg"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
