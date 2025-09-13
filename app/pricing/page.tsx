import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background-base dark:bg-dark-background-base transition-colors duration-300">
      {/* Header spacing */}
      <div className="h-20" />
      
      <div className="container mx-auto px-16 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-accent-black dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Select the perfect plan to power your AI development with ZapDev
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <PricingTable />
        </div>
      </div>
    </div>
  )
}