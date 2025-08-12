import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureTab } from "./FeatureTab";
import { FeatureContent } from "./FeatureContent";
import { features } from "@/config/features";

export const FeaturesSection = () => {
  return (
    <motion.section 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8 }}
      className="container mx-auto px-4 py-24 relative"
    >
      {/* Centered glow */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 20%, rgba(55, 122, 251, 0.18) 0%, rgba(55, 122, 251, 0) 70%)'
        }}
      />
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-2xl mb-20 relative z-10"
      >
        <motion.h2 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-6xl font-normal mb-6 tracking-tight text-left"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="block"
          >
            AI-Powered Website
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-gradient font-medium block"
          >
            Building Platform
          </motion.span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-lg md:text-xl text-gray-400 text-left"
        >
          Experience professional website creation with AI-powered tools and templates designed for tech founders and startups.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Tabs defaultValue={features[0].title} className="w-full relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            {/* Left side - Tab triggers */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="md:col-span-5 space-y-3"
            >
              <TabsList className="flex flex-col w-full bg-transparent h-auto p-0 space-y-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="w-full"
                  >
                    <TabsTrigger
                      value={feature.title}
                      className="w-full data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                    >
                      <FeatureTab
                        title={feature.title}
                        description={feature.description}
                        icon={feature.icon}
                        isActive={false}
                      />
                    </TabsTrigger>
                  </motion.div>
                ))}
              </TabsList>
            </motion.div>

            {/* Right side - Tab content with images */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="md:col-span-7"
            >
              {features.map((feature, index) => (
                <TabsContent
                  key={feature.title}
                  value={feature.title}
                  className="mt-0 h-full"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <FeatureContent
                      image={feature.image}
                      title={feature.title}
                    />
                  </motion.div>
                </TabsContent>
              ))}
            </motion.div>
          </div>
        </Tabs>
      </motion.div>
    </motion.section>
  );
};
