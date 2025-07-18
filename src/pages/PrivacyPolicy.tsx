import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="prose prose-invert max-w-none"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-400 text-lg">Last updated: 7/18/2025</p>
          </div>

          <div className="space-y-8 text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. INTRODUCTION</h2>
              <p>
                ZapDev ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered development platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. INFORMATION WE COLLECT</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">2.1. Information You Provide Directly:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Account registration information (name, email address)</li>
                    <li>Profile information you choose to provide</li>
                    <li>Code and content you create or upload</li>
                    <li>Communications with our support team</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">2.2. Information Collected Automatically:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Usage data and analytics</li>
                    <li>Device and browser information</li>
                    <li>IP addresses and location data</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">2.3. Information from Third Parties:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>OAuth provider information (GitHub, Google) when you choose to authenticate</li>
                    <li>Analytics and performance monitoring data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. HOW WE USE YOUR INFORMATION</h2>
              <p className="mb-3">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve our services</li>
                <li>Process your requests and transactions</li>
                <li>Send important service updates and notifications</li>
                <li>Provide customer support</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Ensure platform security and prevent abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. AI MODEL TRAINING AND CODE PROCESSING</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">4.1. Code Privacy Commitment:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>We do NOT train our AI models on your private code or projects</li>
                    <li>Your code is processed only to provide the requested services</li>
                    <li>Code generation requests are sent to third-party AI providers with privacy protections</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">4.2. Data Hosting:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>All services are hosted in secure data centers in the United States</li>
                    <li>We use industry-standard encryption and security measures</li>
                    <li>Access to your data is strictly limited to authorized personnel</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. INFORMATION SHARING AND DISCLOSURE</h2>
              <p className="mb-4">We do not sell your personal information. We may share your information only in these limited circumstances:</p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white">5.1. With Your Consent:</h3>
                  <p>When you explicitly authorize us to share specific information.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">5.2. Service Providers:</h3>
                  <p>With trusted third-party providers who assist in operating our platform (hosting, analytics, payment processing) under strict confidentiality agreements.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">5.3. AI Service Providers:</h3>
                  <p>Code generation requests may be sent to third-party AI providers (OpenAI, Anthropic, etc.) with privacy protections in place.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">5.4. Legal Requirements:</h3>
                  <p>When required by law, court order, or to protect our rights and safety.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">5.5. Business Transfers:</h3>
                  <p>In connection with mergers, acquisitions, or asset sales, with appropriate privacy protections.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. DATA RETENTION</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account information:</strong> Retained while your account is active and for a reasonable period after deletion</li>
                <li><strong>Usage logs:</strong> Typically retained for 12 months for security and analytics purposes</li>
                <li><strong>Code and projects:</strong> Retained according to your account settings and deletion requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. YOUR PRIVACY RIGHTS</h2>
              <p className="mb-3">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your personal information</li>
                <li>Export your data</li>
                <li>Opt-out of certain data processing</li>
                <li>Withdraw consent where applicable</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at{" "}
                <a href="mailto:privacy@zapdev.ai" className="text-purple-400 hover:text-purple-300 transition-colors">
                  privacy@zapdev.ai
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. SECURITY MEASURES</h2>
              <p className="mb-3">We implement comprehensive security measures including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication requirements</li>
                <li>Incident response procedures</li>
                <li>Regular security training for our team</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. COOKIES AND TRACKING TECHNOLOGIES</h2>
              <p className="mb-3">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze usage patterns</li>
                <li>Improve our services</li>
              </ul>
              <p className="mt-4">You can control cookie settings through your browser preferences.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. THIRD-PARTY SERVICES</h2>
              <p>
                Our platform integrates with third-party services (GitHub, Google, payment processors). Please review their privacy policies as they govern their data practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. INTERNATIONAL DATA TRANSFERS</h2>
              <p>
                If you access our service from outside the United States, your information may be transferred to and processed in the US. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. CHILDREN'S PRIVACY</h2>
              <p>
                Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. CALIFORNIA PRIVACY RIGHTS</h2>
              <p>
                California residents have additional rights under the CCPA, including the right to know what personal information is collected and how it's used. Contact us for more information about exercising these rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. CHANGES TO THIS PRIVACY POLICY</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notifications. Your continued use constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. CONTACT INFORMATION</h2>
              <p>
                For privacy-related questions or to exercise your rights, contact us at:
              </p>
              <p className="mt-2">
                Email:{" "}
                <a href="mailto:support@zapdev.link" className="text-purple-400 hover:text-purple-300 transition-colors">
                  support@zapdev.link
                </a>
              </p>
              <p className="mt-4">
                We are committed to protecting your privacy and will respond to your inquiries promptly.
              </p>
            </section>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy; 