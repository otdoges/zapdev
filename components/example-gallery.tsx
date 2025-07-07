'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

interface Example {
  id: string;
  category: string;
  prompt: string;
  description: string;
  features: string[];
  preview: string;
  code: string;
  tags: string[];
}

const examples: Example[] = [
  {
    id: 'saas-pricing',
    category: 'SaaS',
    prompt: 'A SaaS pricing page with testimonials',
    description: 'Modern pricing page with three tiers, feature comparison, testimonials carousel, and FAQ section',
    features: [
      'Responsive 3-tier pricing layout',
      'Testimonials with star ratings',
      'Feature comparison table',
      'FAQ accordion section',
      'Gradient buttons with hover effects'
    ],
    preview: '🎯',
    code: `// Complete pricing page with testimonials
const PricingPage = () => {
  const plans = [
    { name: 'Starter', price: '$9', features: ['10 Projects', 'Basic Support'] },
    { name: 'Pro', price: '$29', features: ['100 Projects', 'Priority Support', 'Analytics'] },
    { name: 'Enterprise', price: '$99', features: ['Unlimited', '24/7 Support', 'Custom Integration'] }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <PricingHeader />
      <PricingCards plans={plans} />
      <TestimonialsSection />
      <FAQSection />
    </div>
  );
};`,
    tags: ['Pricing', 'SaaS', 'Testimonials', 'FAQ']
  },
  {
    id: 'dashboard',
    category: 'Dashboard',
    prompt: 'A sleek analytics dashboard with charts',
    description: 'Data-rich dashboard with interactive charts, KPI cards, sidebar navigation, and real-time metrics',
    features: [
      'Interactive chart components',
      'KPI metric cards with trends',
      'Responsive sidebar navigation',
      'Data table with sorting',
      'Real-time update indicators'
    ],
    preview: '📊',
    code: `// Analytics dashboard with charts
const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <MetricCard title="Revenue" value="$45,231" trend="+12%" />
          <MetricCard title="Users" value="1,234" trend="+5%" />
          <MetricCard title="Orders" value="856" trend="+8%" />
          <MetricCard title="Growth" value="23%" trend="+15%" />
        </div>
        <ChartsSection />
        <DataTable />
      </main>
    </div>
  );
};`,
    tags: ['Dashboard', 'Analytics', 'Charts', 'Admin']
  },
  {
    id: 'ecommerce',
    category: 'E-commerce',
    prompt: 'An e-commerce product page with reviews',
    description: 'Complete product page with image gallery, variant selection, reviews, and related products',
    features: [
      'Product image gallery with zoom',
      'Variant selection (size, color)',
      'Customer reviews with ratings',
      'Related products carousel',
      'Add to cart functionality'
    ],
    preview: '🛍️',
    code: `// E-commerce product page
const ProductPage = ({ product }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-12">
        <ProductGallery images={product.images} />
        <div className="space-y-6">
          <ProductInfo product={product} />
          <VariantSelector variants={product.variants} />
          <AddToCartButton />
        </div>
      </div>
      <ReviewsSection reviews={product.reviews} />
      <RelatedProducts />
    </div>
  );
};`,
    tags: ['E-commerce', 'Product', 'Reviews', 'Shopping']
  },
  {
    id: 'landing',
    category: 'Landing Page',
    prompt: 'A tech startup landing page with hero video',
    description: 'Modern landing page with video hero, feature highlights, team section, and contact form',
    features: [
      'Hero section with video background',
      'Feature cards with icons',
      'Team member profiles',
      'Contact form with validation',
      'Newsletter signup'
    ],
    preview: '🚀',
    code: `// Tech startup landing page
const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection videoUrl="/hero-video.mp4" />
      <FeaturesSection />
      <AboutSection />
      <TeamSection />
      <ContactSection />
      <Footer />
    </div>
  );
};`,
    tags: ['Landing', 'Startup', 'Video', 'Contact']
  },
  {
    id: 'blog',
    category: 'Content',
    prompt: 'A modern blog layout with categories',
    description: 'Clean blog layout with article cards, category filters, search, and pagination',
    features: [
      'Article cards with featured images',
      'Category filtering system',
      'Search functionality',
      'Pagination controls',
      'Author profiles'
    ],
    preview: '📝',
    code: `// Modern blog layout
const BlogPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <BlogHeader />
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <SearchWidget />
          <CategoryFilter />
          <RecentPosts />
        </aside>
        <main className="lg:col-span-3">
          <ArticleGrid articles={articles} />
          <Pagination />
        </main>
      </div>
    </div>
  );
};`,
    tags: ['Blog', 'Content', 'Search', 'Categories']
  },
  {
    id: 'portfolio',
    category: 'Portfolio',
    prompt: 'A creative portfolio with project showcases',
    description: 'Designer portfolio with project gallery, skill showcase, contact form, and testimonials',
    features: [
      'Project gallery with filters',
      'Skill progress indicators',
      'Testimonials slider',
      'Contact form integration',
      'Smooth scroll animations'
    ],
    preview: '🎨',
    code: `// Creative portfolio site
const Portfolio = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <ProjectGallery projects={projects} />
      <SkillsSection />
      <TestimonialsSlider />
      <ContactForm />
    </div>
  );
};`,
    tags: ['Portfolio', 'Creative', 'Gallery', 'Design']
  }
];

const categories = ['All', ...Array.from(new Set(examples.map(ex => ex.category)))];

export default function ExampleGallery() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);
  const router = useRouter();

  const filteredExamples = selectedCategory === 'All' 
    ? examples 
    : examples.filter(ex => ex.category === selectedCategory);

  return (
    <section id="examples" className="py-20 bg-[#0D0D10]">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            See What You Can <span className="text-gradient">Build</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Real examples of production-ready components generated from simple prompts. 
            Each example shows the prompt, generated UI, and clean React/Tailwind code.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`
                  ${selectedCategory === category 
                    ? 'bg-gradient-to-r from-[#6C52A0] to-[#A0527C] text-white' 
                    : 'border-[#2A2A32] text-gray-300 hover:border-[#6C52A0] hover:text-white bg-transparent'
                  }
                `}
              >
                {category}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Examples Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          layout
        >
          <AnimatePresence>
            {filteredExamples.map((example, index) => (
              <motion.div
                key={example.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#1E1E24] rounded-xl border border-[#2A2A32] overflow-hidden hover:border-[#6C52A0] transition-all cursor-pointer group"
                onClick={() => setSelectedExample(example)}
              >
                {/* Preview */}
                <div className="h-48 bg-gradient-to-br from-[#6C52A0]/20 to-[#A0527C]/20 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                  {example.preview}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2 py-1 bg-[#6C52A0]/20 text-[#A0527C] rounded-full">
                      {example.category}
                    </span>
                    <div className="flex gap-1">
                      {example.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-[#2A2A32] text-gray-400 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#A0527C] transition-colors">
                    "{example.prompt}"
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {example.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {example.features.length} features
                    </span>
                    <Button size="sm" variant="ghost" className="text-[#A0527C] hover:text-white">
                      View Details →
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Example Modal */}
        <AnimatePresence>
          {selectedExample && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedExample(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#1E1E24] rounded-xl border border-[#2A2A32] max-w-4xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-[#2A2A32] flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">"{selectedExample.prompt}"</h3>
                    <span className="text-sm text-[#A0527C]">{selectedExample.category}</span>
                  </div>
                  <Button 
                    onClick={() => setSelectedExample(null)}
                    variant="ghost" 
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Description</h4>
                    <p className="text-gray-300">{selectedExample.description}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Key Features</h4>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {selectedExample.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-300 text-sm">
                          <span className="text-[#A0527C] mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-3">Generated Code Preview</h4>
                    <div className="bg-[#0D0D10] rounded-lg p-4 border border-[#2A2A32] overflow-x-auto">
                      <pre className="text-sm text-green-400">
                        <code>{selectedExample.code}</code>
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button 
                      onClick={() => router.push('/#playground')}
                      className="flex-1 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C]"
                    >
                      Try This Prompt
                    </Button>
                    <Button 
                      onClick={() => router.push('/auth')}
                      variant="outline"
                      className="flex-1 border-[#2A2A32] text-gray-300 hover:border-[#6C52A0] hover:text-white"
                    >
                      Get Full Access
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-[#6C52A0]/10 to-[#A0527C]/10 rounded-2xl border border-[#6C52A0]/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Build Your Own?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join thousands of developers who are building faster with ZapDev. 
              Turn your ideas into production-ready code in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/#playground')}
                className="bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] px-8 py-3"
              >
                Try the Demo
              </Button>
              <Button 
                onClick={() => router.push('/auth')}
                variant="outline"
                className="border-[#2A2A32] text-gray-300 hover:border-[#6C52A0] hover:text-white px-8 py-3"
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 