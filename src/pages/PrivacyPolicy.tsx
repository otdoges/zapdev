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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-400 bg-clip-text text-transparent mb-4">
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
                  <h3 className="text-lg font-medium text-white mb-2">2.1. Messages and Communications:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Chat messages and conversations you have with our AI platform</li>
                    <li>All messages are stored securely</li>
                    <li>Account registration information (name, email address)</li>
                    <li>Communications with our support team</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">2.2. Analytics Data:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Usage patterns and platform interactions (anonymized)</li>
                    <li>Performance metrics to improve service quality</li>
                    <li>Basic device and browser information</li>
                    <li>Session duration and feature usage statistics</li>
                  </ul>
                  <p className="text-sm text-gray-400 mt-2">
                    <strong>Important:</strong> We collect analytics to improve our service, but we do not sell your data to third parties.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">2.3. Authentication Information:</h3>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>OAuth provider information when you choose to authenticate</li>
                    <li>Session tokens and authentication credentials (secured)</li>
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
                    <li>We use industry-standard security measures</li>
                    <li>Access to your data is strictly limited to authorized personnel</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. INFORMATION SHARING AND DISCLOSURE</h2>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">Our Data Commitment</h3>
                <p className="text-gray-300">
                  <strong>We do not sell your personal information or data to third parties.</strong> Your privacy is fundamental to our service, and we are committed to protecting your messages and personal information.
                </p>
              </div>
              <p className="mb-4">We may share your information only in these strictly limited circumstances:</p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white">5.1. With Your Explicit Consent:</h3>
                  <p>Only when you explicitly authorize us to share specific information for a particular purpose.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">5.2. Essential Service Providers:</h3>
                  <p>With trusted third-party providers who assist in operating our platform (secure hosting, payment processing) under strict confidentiality agreements. These providers cannot access your messages.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">5.3. Analytics Partners:</h3>
                  <p>Anonymized usage analytics may be shared with analytics services to help improve our platform. No personal messages or identifiable information is included.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">5.4. Legal Requirements:</h3>
                  <p>Only when required by valid legal process, court order, or to protect our users' safety and security.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">5.5. Business Transfers:</h3>
                  <p>In the unlikely event of a merger or acquisition, with appropriate privacy protections and user notification.</p>
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
                <a href="mailto:privacy@zapdev.ai" className="text-blue-400 hover:text-blue-300 transition-colors">
                  privacy@zapdev.ai
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. SECURITY MEASURES</h2>
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-green-300 mb-2">Message Security</h3>
                <p className="text-gray-300">
                  All messages and conversations are stored securely with access controls and protection measures to ensure unauthorized access cannot occur.
                </p>
              </div>
              <p className="mb-3">We implement comprehensive security measures including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Secure data storage</strong> for all messages and sensitive data</li>
                <li>Secure transmission (TLS/SSL) and protected storage</li>
                <li>Regular security audits and penetration testing</li>
                <li>Multi-factor authentication and access controls</li>
                <li>24/7 monitoring and incident response procedures</li>
                <li>Regular security training for our development team</li>
                <li>Secure data centers with physical access controls</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. ANALYTICS AND TRACKING</h2>
              <p className="mb-3">We use cookies and analytics technologies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain your secure login session</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze usage patterns to improve our AI platform</li>
                <li>Monitor performance and identify technical issues</li>
                <li>Understand which features are most valuable to users</li>
              </ul>
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-4">
                <p className="text-gray-300">
                  <strong>Analytics Transparency:</strong> We collect analytics to make ZapDev better for everyone, but we never sell this data or use it for advertising. All analytics data is anonymized and aggregated.
                </p>
              </div>
              <p className="mt-4">You can control cookie settings through your browser preferences, though some features may require certain cookies to function properly.</p>
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
                <a href="mailto:support@zapdev.link" className="text-blue-400 hover:text-blue-300 transition-colors">
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