'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

// Sample website mockups with their vibes
const websites = [
  {
    title: 'Urban Flow',
    image: '/urban-flow.png', // Will use gradients instead of images for now
    description: 'Modern, sleek e-commerce with a city-inspired layout',
    gradient: 'from-indigo-900 via-blue-800 to-blue-900',
  },
  {
    title: 'Serene Tech',
    image: '/serene-tech.png',
    description: 'Minimalist SaaS dashboard with calming interface',
    gradient: 'from-teal-900 via-emerald-800 to-teal-900',
  },
  {
    title: 'Playful Innovation',
    image: '/playful-innovation.png',
    description: 'Creative agency portfolio with whimsical elements',
    gradient: 'from-fuchsia-900 via-purple-800 to-fuchsia-900',
  },
  {
    title: 'Luxe Retreat',
    image: '/luxe-retreat.png',
    description: 'High-end hospitality site with elegant animations',
    gradient: 'from-amber-900 via-yellow-800 to-amber-900',
  },
  {
    title: 'Tech Forward',
    image: '/tech-forward.png',
    description: 'Startup landing page with cutting-edge visuals',
    gradient: 'from-cyan-900 via-sky-800 to-cyan-900',
  },
];

export default function VisualShowcase() {
  const sectionRef = useRef(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px 0px' });
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToNext = () => {
    setActiveIndex((prev) => (prev + 1) % websites.length);

    if (carouselRef.current) {
      const itemWidth = carouselRef.current.scrollWidth / websites.length;
      carouselRef.current.scrollTo({
        left: itemWidth * ((activeIndex + 1) % websites.length),
        behavior: 'smooth',
      });
    }
  };

  const scrollToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + websites.length) % websites.length);

    if (carouselRef.current) {
      const itemWidth = carouselRef.current.scrollWidth / websites.length;
      carouselRef.current.scrollTo({
        left: itemWidth * ((activeIndex - 1 + websites.length) % websites.length),
        behavior: 'smooth',
      });
    }
  };

  const handleDotClick = (index: number) => {
    setActiveIndex(index);

    if (carouselRef.current) {
      const itemWidth = carouselRef.current.scrollWidth / websites.length;
      carouselRef.current.scrollTo({
        left: itemWidth * index,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-4 py-20 md:py-32">
      {/* Background decorative elements */}
      <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-[#4F3A75] opacity-5 blur-[100px]"></div>
      <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-[#7A3F6D] opacity-5 blur-[100px]"></div>

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center md:mb-24"
        >
          <h2 className="mb-6 text-3xl font-bold md:text-5xl">See the Vibe in Action</h2>
          <p className="mx-auto max-w-2xl text-lg text-[#EAEAEA]/70">
            Websites woven with ZapDev. Simply describe your vibe, and watch as it transforms into a
            stunning, functional website.
          </p>
        </motion.div>

        <div className="relative">
          {/* Navigation arrows */}
          <button
            onClick={scrollToPrev}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#1E1E24] bg-[#121215]/80 backdrop-blur-sm transition-colors hover:bg-[#1A1A1E] md:h-12 md:w-12"
            aria-label="Previous website"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            onClick={scrollToNext}
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#1E1E24] bg-[#121215]/80 backdrop-blur-sm transition-colors hover:bg-[#1A1A1E] md:h-12 md:w-12"
            aria-label="Next website"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          {/* Carousel container */}
          <div
            ref={carouselRef}
            className="scrollbar-none flex snap-x snap-mandatory overflow-x-scroll scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {websites.map((site, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: isInView ? 1 : 0,
                  scale: isInView ? 1 : 0.9,
                }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="min-w-full flex-shrink-0 snap-center px-12 md:px-20"
              >
                <div className="relative h-[500px] overflow-hidden rounded-2xl border border-[#1E1E24] bg-[#121215] shadow-xl md:h-[600px]">
                  {/* Website mockup */}
                  <div className={`h-full bg-gradient-to-br ${site.gradient}`}>
                    <div className="relative mx-auto mt-[4%] h-[92%] w-[95%] overflow-hidden rounded-t-lg bg-[#121215]">
                      {/* Browser Navigation */}
                      <div className="flex h-8 items-center space-x-2 bg-[#1A1A1E] px-3">
                        <div className="flex space-x-1.5">
                          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70"></div>
                          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70"></div>
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70"></div>
                        </div>
                        <div className="mx-4 h-5 flex-1 rounded-md bg-[#121215]"></div>
                      </div>

                      {/* Website Content - Simplified representation */}
                      <div className="h-full bg-[#0D0D10] p-4">
                        <div className="mb-4 h-16 rounded bg-gradient-to-r from-[#121215] to-[#1A1A1E]"></div>
                        <div className="grid h-[calc(100%-5rem)] grid-cols-12 gap-4">
                          <div className="col-span-8 h-full rounded bg-gradient-to-br from-[#121215] to-[#1A1A1E]"></div>
                          <div className="col-span-4 space-y-4">
                            <div className="h-1/3 rounded bg-gradient-to-r from-[#121215] to-[#1A1A1E]"></div>
                            <div className="h-1/3 rounded bg-gradient-to-r from-[#121215] to-[#1A1A1E]"></div>
                            <div className="h-1/3 rounded bg-gradient-to-r from-[#121215] to-[#1A1A1E]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Website info tag */}
                  <div className="absolute bottom-6 left-6 max-w-xs rounded-lg border border-[#1E1E24] bg-[#121215]/90 px-4 py-3 backdrop-blur-md">
                    <div className="mb-1 text-sm font-semibold">Vibe: {site.title}</div>
                    <div className="text-xs text-[#EAEAEA]/70">{site.description}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Dot indicators */}
          <div className="mt-8 flex justify-center space-x-2">
            {websites.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`h-3 w-3 rounded-full transition-all ${
                  activeIndex === index ? 'w-6 bg-[#4F3A75]' : 'bg-[#1E1E24] hover:bg-[#4F3A75]/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
