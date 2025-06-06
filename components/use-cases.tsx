"use client"

import { motion } from "framer-motion"
import { Briefcase, Building2, Rocket, Laptop, Clock, Users, LineChart, Sparkles } from "lucide-react"

export default function UseCases() {
  const cases = [
    {
      icon: <Briefcase className="w-6 h-6" />,
      title: "For Freelancers",
      description: "Multiply your output and take on more clients without sacrificing quality or working longer hours.",
      benefits: [
        {
          icon: <Clock className="w-5 h-5 text-[#A0527C]" />,
          text: "Deliver projects in days instead of weeks"
        },
        {
          icon: <Laptop className="w-5 h-5 text-[#A0527C]" />,
          text: "Focus on high-value creative work while AI handles coding"
        },
        {
          icon: <Sparkles className="w-5 h-5 text-[#A0527C]" />,
          text: "Offer stunning designs even without a design background"
        }
      ]
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: "For Agencies",
      description: "Scale your operations and improve margins while delivering consistent quality across all projects.",
      benefits: [
        {
          icon: <Users className="w-5 h-5 text-[#7C62B0]" />,
          text: "Standardize output across your entire team"
        },
        {
          icon: <LineChart className="w-5 h-5 text-[#7C62B0]" />,
          text: "Reduce costs while increasing client satisfaction"
        },
        {
          icon: <Clock className="w-5 h-5 text-[#7C62B0]" />,
          text: "Prototype rapidly to win more client pitches"
        }
      ]
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "For Startups",
      description: "Move fast and iterate quickly without needing to build a large development team from day one.",
      benefits: [
        {
          icon: <LineChart className="w-5 h-5 text-[#6C52A0]" />,
          text: "Launch your MVP in days not months"
        },
        {
          icon: <Users className="w-5 h-5 text-[#6C52A0]" />,
          text: "Create a professional web presence with limited resources"
        },
        {
          icon: <Sparkles className="w-5 h-5 text-[#6C52A0]" />,
          text: "Easily iterate based on user feedback"
        }
      ]
    }
  ]

  return (
    <section id="use-cases" className="py-24 px-4 bg-[#0D0D10]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            <span className="text-gradient">Perfect For Everyone</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-[#EAEAEA]/70 max-w-3xl mx-auto"
          >
            See how ZapDev transforms workflows for different professionals
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cases.map((useCase, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-[#0F0F12] border border-[#1E1E24] rounded-xl p-6 h-full flex flex-col"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C52A0]/20 to-[#A0527C]/20 flex items-center justify-center mr-4">
                  {useCase.icon}
                </div>
                <h3 className="text-xl font-bold">{useCase.title}</h3>
              </div>
              
              <p className="text-[#EAEAEA]/70 mb-6">{useCase.description}</p>
              
              <div className="space-y-4 mt-auto">
                {useCase.benefits.map((benefit, benefitIndex) => (
                  <div key={benefitIndex} className="flex items-start">
                    <div className="mt-1 mr-3 flex-shrink-0">
                      {benefit.icon}
                    </div>
                    <p className="text-[#EAEAEA]/90">{benefit.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <a
            href="/chat"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] rounded-full text-white font-medium transition-all duration-300 hover:scale-105"
          >
            Start Your Project
          </a>
        </motion.div>
      </div>
    </section>
  )
} 