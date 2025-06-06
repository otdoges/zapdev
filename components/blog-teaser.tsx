"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export default function BlogTeaser() {
  const articles = [
    {
      title: "Building Lightning-Fast Websites with Astro and ZapDev",
      excerpt: "Learn how Astro's partial hydration combined with ZapDev's AI-powered generation creates the perfect stack for performance-focused websites.",
      image: "/images/blog/astro-zapdev.jpg",
      category: "Frameworks",
      readTime: "6 min read",
      slug: "/blog/astro-zapdev"
    },
    {
      title: "The Psychology of Color in Web Design: Crafting Emotional User Experiences",
      excerpt: "Discover how ZapDev's emotion-based color palettes leverage psychological principles to create more engaging and effective websites.",
      image: "/images/blog/color-psychology.jpg",
      category: "Design",
      readTime: "8 min read",
      slug: "/blog/color-psychology"
    },
    {
      title: "From Concept to Launch in 24 Hours: A ZapDev Success Story",
      excerpt: "See how a startup founder used ZapDev to go from initial idea to fully-functional landing page in less than a day, securing their first investors.",
      image: "/images/blog/startup-launch.jpg",
      category: "Case Study",
      readTime: "5 min read",
      slug: "/blog/startup-success"
    }
  ]

  // Fallback image styling
  const imageFallbackStyle = "bg-gradient-to-br from-[#6C52A0]/20 to-[#A0527C]/20 flex items-center justify-center"

  return (
    <section id="blog" className="py-24 px-4 bg-[#0D0D10]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              <span className="text-gradient">Resources & Insights</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-[#EAEAEA]/70 max-w-2xl"
            >
              Dive deeper into web development trends, framework comparisons, and design best practices
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a 
              href="/blog" 
              className="inline-flex items-center text-[#A0527C] hover:text-[#B0627C] font-medium transition-colors"
            >
              View all articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-[#0F0F12] border border-[#1E1E24] rounded-xl overflow-hidden flex flex-col h-full"
            >
              <div className="h-48 relative">
                {/* This would normally be a proper next/image component with actual images */}
                {/* For this example, we're using a fallback gradient */}
                <div className={`w-full h-full ${imageFallbackStyle}`}>
                  <span className="text-[#EAEAEA]/30 text-sm">Featured Image</span>
                </div>
                <div className="absolute top-4 left-4 bg-[#6C52A0] px-3 py-1 rounded-full text-xs font-medium">
                  {article.category}
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col">
                <div className="text-sm text-[#EAEAEA]/60 mb-2">{article.readTime}</div>
                <h3 className="text-xl font-bold mb-3">{article.title}</h3>
                <p className="text-[#EAEAEA]/70 mb-4 flex-grow">{article.excerpt}</p>
                <a 
                  href={article.slug}
                  className="inline-flex items-center text-[#A0527C] hover:text-[#B0627C] font-medium transition-colors mt-auto"
                >
                  Read more
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-block p-8 rounded-xl bg-[#0F0F12] border border-[#1E1E24]">
            <h3 className="text-2xl font-bold mb-3">Subscribe to Our Newsletter</h3>
            <p className="text-[#EAEAEA]/70 max-w-lg mx-auto mb-6">
              Get the latest web development tips, design inspiration, and ZapDev updates delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-3 rounded-lg bg-[#1A1A1E] border border-[#2A2A30] focus:outline-none focus:ring-2 focus:ring-[#6C52A0] text-white"
                required
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] rounded-lg text-white font-medium transition-all duration-300"
              >
                Subscribe
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 