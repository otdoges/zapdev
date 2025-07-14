import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureTab } from "./FeatureTab";
import { FeatureContent } from "./FeatureContent";
import { features } from "@/config/features";

export const FeaturesSection = () => {
  return (
    <section className="container px-4 py-24 relative">
      {/* Gradient blur element */}
      <div 
        className="absolute bottom-0 left-0 w-full h-full rounded-full"
        style={{
          background: '#377AFB',
          opacity: 0.1,
          boxShadow: '300px 300px 300px',
          filter: 'blur(150px)',
          zIndex: 1
        }}
      />
      
      {/* Header Section */}
      <div className="max-w-2xl mb-20 relative z-10">
        <h2 className="text-5xl md:text-6xl font-normal mb-6 tracking-tight text-left">
          AI-Powered Website
          <br />
          <span className="text-gradient font-medium">Building Platform</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-400 text-left">
          Experience professional website creation with AI-powered tools and templates designed for tech founders and startups.
        </p>
      </div>

      <Tabs defaultValue={features[0].title} className="w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left side - Tab triggers */}
          <div className="md:col-span-5 space-y-3">
            <TabsList className="flex flex-col w-full bg-transparent h-auto p-0 space-y-3">
              {features.map((feature) => (
                <TabsTrigger
                  key={feature.title}
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
              ))}
            </TabsList>
          </div>

          {/* Right side - Tab content with images */}
          <div className="md:col-span-7">
            {features.map((feature) => (
              <TabsContent
                key={feature.title}
                value={feature.title}
                className="mt-0 h-full"
              >
                <FeatureContent
                  image={feature.image}
                  title={feature.title}
                />
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </section>
  );
};
