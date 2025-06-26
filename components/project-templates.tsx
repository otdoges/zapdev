"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Layout, 
  Globe, 
  BarChart3, 
  FileText, 
  Smartphone,
  ShoppingCart,
  Users,
  Briefcase,
  Code,
  Zap,
  Check,
  ArrowRight,
  Star,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedTime: string
  icon: React.ReactNode
  features: string[]
  techStack: string[]
  preview: string
  instructions: string
  popularity: number
}

interface ProjectTemplatesProps {
  onSelectTemplate?: (template: ProjectTemplate) => void
  onCustomRequest?: () => void
  className?: string
}

const templates: ProjectTemplate[] = [
  {
    id: 'react-app',
    name: 'React Web App',
    description: 'Modern React application with TypeScript, routing, and state management',
    category: 'Web Application',
    difficulty: 'Intermediate',
    estimatedTime: '15-30 min',
    icon: <Code className="w-6 h-6" />,
    features: [
      'React 18 with TypeScript',
      'React Router for navigation',
      'Zustand for state management',
      'Tailwind CSS styling',
      'Component library',
      'Error boundaries'
    ],
    techStack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand'],
    preview: 'Interactive single-page application with modern UI components',
    instructions: 'Build a modern React application with TypeScript. Include routing, state management, and a clean component structure. Use Tailwind CSS for styling and implement responsive design.',
    popularity: 95
  },
  {
    id: 'landing-page',
    name: 'Landing Page',
    description: 'Professional landing page with hero section, features, and CTA',
    category: 'Marketing',
    difficulty: 'Beginner',
    estimatedTime: '10-20 min',
    icon: <Globe className="w-6 h-6" />,
    features: [
      'Hero section with CTA',
      'Features showcase',
      'Testimonials section',
      'Contact form',
      'Responsive design',
      'SEO optimized'
    ],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    preview: 'Beautiful landing page with sections for product showcase',
    instructions: 'Create a professional landing page with hero section, features grid, testimonials, and contact form. Include smooth animations and responsive design.',
    popularity: 88
  },
  {
    id: 'dashboard',
    name: 'Admin Dashboard',
    description: 'Full-featured admin dashboard with charts, tables, and analytics',
    category: 'Business',
    difficulty: 'Advanced',
    estimatedTime: '30-45 min',
    icon: <BarChart3 className="w-6 h-6" />,
    features: [
      'Interactive charts',
      'Data tables with sorting',
      'User management',
      'Analytics widgets',
      'Dark/light theme',
      'Sidebar navigation'
    ],
    techStack: ['React', 'TypeScript', 'Chart.js', 'Tailwind CSS', 'React Query'],
    preview: 'Complete admin interface with data visualization and management tools',
    instructions: 'Build a comprehensive admin dashboard with charts, data tables, user management, and analytics. Include sidebar navigation and theme switching.',
    popularity: 92
  },
  {
    id: 'blog',
    name: 'Blog Platform',
    description: 'Content management system with post creation and reading experience',
    category: 'Content',
    difficulty: 'Intermediate',
    estimatedTime: '20-35 min',
    icon: <FileText className="w-6 h-6" />,
    features: [
      'Post creation/editing',
      'Rich text editor',
      'Categories and tags',
      'Search functionality',
      'Comment system',
      'SEO-friendly URLs'
    ],
    techStack: ['React', 'TypeScript', 'MDX', 'Tailwind CSS', 'React Hook Form'],
    preview: 'Modern blog with content management and reading experience',
    instructions: 'Create a blog platform with post creation, rich text editing, categories, search, and a clean reading experience. Include content management features.',
    popularity: 78
  },
  {
    id: 'mobile-app',
    name: 'Mobile-First App',
    description: 'PWA-ready mobile application with native-like experience',
    category: 'Mobile',
    difficulty: 'Intermediate',
    estimatedTime: '25-40 min',
    icon: <Smartphone className="w-6 h-6" />,
    features: [
      'PWA capabilities',
      'Offline support',
      'Touch gestures',
      'Mobile navigation',
      'App-like interface',
      'Push notifications'
    ],
    techStack: ['React', 'TypeScript', 'PWA', 'Tailwind CSS', 'Workbox'],
    preview: 'Mobile-optimized app with native-like user experience',
    instructions: 'Build a mobile-first application with PWA capabilities, offline support, touch gestures, and mobile-optimized navigation.',
    popularity: 73
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Store',
    description: 'Online store with product catalog, cart, and checkout',
    category: 'E-commerce',
    difficulty: 'Advanced',
    estimatedTime: '35-50 min',
    icon: <ShoppingCart className="w-6 h-6" />,
    features: [
      'Product catalog',
      'Shopping cart',
      'Checkout process',
      'Payment integration',
      'User accounts',
      'Order management'
    ],
    techStack: ['React', 'TypeScript', 'Stripe', 'Tailwind CSS', 'Zustand'],
    preview: 'Complete e-commerce solution with payment processing',
    instructions: 'Create an e-commerce store with product listings, shopping cart, checkout flow, and payment integration. Include user accounts and order management.',
    popularity: 85
  },
  {
    id: 'portfolio',
    name: 'Portfolio Site',
    description: 'Personal portfolio website showcasing projects and skills',
    category: 'Personal',
    difficulty: 'Beginner',
    estimatedTime: '15-25 min',
    icon: <Briefcase className="w-6 h-6" />,
    features: [
      'Project showcase',
      'Skills section',
      'About me page',
      'Contact form',
      'Responsive design',
      'Dark mode'
    ],
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
    preview: 'Professional portfolio with project galleries and contact info',
    instructions: 'Build a personal portfolio website with project showcase, skills section, about page, and contact form. Include smooth animations and professional design.',
    popularity: 67
  },
  {
    id: 'social-app',
    name: 'Social Media App',
    description: 'Social platform with posts, feeds, and user interactions',
    category: 'Social',
    difficulty: 'Advanced',
    estimatedTime: '40-60 min',
    icon: <Users className="w-6 h-6" />,
    features: [
      'User profiles',
      'Post creation/sharing',
      'News feed',
      'Like/comment system',
      'Follow/unfollow',
      'Real-time updates'
    ],
    techStack: ['React', 'TypeScript', 'WebSocket', 'Tailwind CSS', 'React Query'],
    preview: 'Social media platform with user interactions and real-time features',
    instructions: 'Create a social media app with user profiles, post creation, news feed, and interaction features. Include real-time updates and social features.',
    popularity: 81
  }
]

const categories = ['All', 'Web Application', 'Marketing', 'Business', 'Content', 'Mobile', 'E-commerce', 'Personal', 'Social']
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced']

export default function ProjectTemplates({
  onSelectTemplate,
  onCustomRequest,
  className
}: ProjectTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)

  // Filter templates based on selected filters
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'All' || template.difficulty === selectedDifficulty
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && matchesDifficulty && matchesSearch
  })

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-500/20'
      case 'Intermediate': return 'text-yellow-400 bg-yellow-500/20'
      case 'Advanced': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Web Application': return <Code className="w-4 h-4" />
      case 'Marketing': return <Globe className="w-4 h-4" />
      case 'Business': return <BarChart3 className="w-4 h-4" />
      case 'Content': return <FileText className="w-4 h-4" />
      case 'Mobile': return <Smartphone className="w-4 h-4" />
      case 'E-commerce': return <ShoppingCart className="w-4 h-4" />
      case 'Personal': return <Briefcase className="w-4 h-4" />
      case 'Social': return <Users className="w-4 h-4" />
      default: return <Layout className="w-4 h-4" />
    }
  }

  return (
    <div className={cn("bg-gray-900 rounded-lg border border-gray-700", className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Layout className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-white text-2xl font-bold">Project Templates</h2>
              <p className="text-gray-400">Choose from our curated templates or start from scratch</p>
            </div>
          </div>
          
          <button
            onClick={onCustomRequest}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Custom Request
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category and Difficulty Filters */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1",
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    )}
                  >
                    {category !== 'All' && getCategoryIcon(category)}
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-2 block">Difficulty</label>
              <div className="flex gap-2">
                {difficulties.map(difficulty => (
                  <button
                    key={difficulty}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-all",
                      selectedDifficulty === difficulty
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    )}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTemplates.map(template => (
              <motion.div
                key={template.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                onHoverStart={() => setHoveredTemplate(template.id)}
                onHoverEnd={() => setHoveredTemplate(null)}
                className="bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
                onClick={() => onSelectTemplate?.(template)}
              >
                {/* Template Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        {template.icon}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold group-hover:text-blue-300 transition-colors">
                          {template.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs", getDifficultyColor(template.difficulty))}>
                            {template.difficulty}
                          </span>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs">{template.popularity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Clock className="w-3 h-3" />
                      {template.estimatedTime}
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Template Content */}
                <div className="p-4">
                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2 text-sm">Key Features</h4>
                    <div className="space-y-1">
                      {template.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                      {template.features.length > 3 && (
                        <div className="text-xs text-blue-400">
                          +{template.features.length - 3} more features
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tech Stack */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2 text-sm">Tech Stack</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.techStack.slice(0, 4).map(tech => (
                        <span key={tech} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          {tech}
                        </span>
                      ))}
                      {template.techStack.length > 4 && (
                        <span className="px-2 py-1 bg-gray-700 text-blue-400 text-xs rounded">
                          +{template.techStack.length - 4}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <motion.div
                    initial={false}
                    animate={{ 
                      opacity: hoveredTemplate === template.id ? 1 : 0.7,
                      x: hoveredTemplate === template.id ? 4 : 0
                    }}
                    className="flex items-center gap-2 text-blue-400 text-sm font-medium"
                  >
                    <span>Use this template</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No Results */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Layout className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">No templates found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSelectedCategory('All')
                setSelectedDifficulty('All')
                setSearchTerm('')
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 