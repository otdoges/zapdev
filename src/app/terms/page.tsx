import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | ZapDev",
  description: "Terms of Service for ZapDev platform",
};

export default function TermsOfService() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using ZapDev (&quot;Service&quot;, &quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
          </p>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p>
            ZapDev is an AI-powered development platform that enables users to create web applications through conversational AI agents. The Service includes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>AI-powered code generation and development assistance</li>
            <li>Real-time application development in sandboxed environments</li>
            <li>Project management and file storage</li>
            <li>Message history and conversation persistence</li>
            <li>Live preview and code visualization tools</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <h3 className="text-xl font-semibold mb-2">3.1 Account Creation</h3>
          <p>
            To use certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Account Security</h3>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Account Termination</h3>
          <p>
            We reserve the right to suspend or terminate your account at any time for any reason, including but not limited to violation of these Terms, fraudulent activity, or abuse of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use Policy</h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violate any applicable laws, regulations, or third-party rights</li>
            <li>Generate, store, or distribute malicious code, malware, or viruses</li>
            <li>Engage in any activity that could harm, disable, or impair the Service</li>
            <li>Attempt to gain unauthorized access to any part of the Service or other users&apos; accounts</li>
            <li>Use the Service to harass, abuse, or harm others</li>
            <li>Generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable</li>
            <li>Scrape, crawl, or use automated means to access the Service without permission</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Resell, sublicense, or redistribute the Service without authorization</li>
            <li>Interfere with or circumvent any security features or usage limits</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Subscription and Payment Terms</h2>
          <h3 className="text-xl font-semibold mb-2">5.1 Subscription Plans</h3>
          <p>
            ZapDev offers both free and paid subscription plans. The features, usage limits, and pricing for each plan are described on our pricing page.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">5.2 Billing</h3>
          <p>
            Paid subscriptions are billed on a recurring basis (monthly or annually) according to your selected plan. By subscribing to a paid plan, you authorize us to charge your payment method on each billing cycle.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">5.3 Cancellation and Refunds</h3>
          <p>
            You may cancel your subscription at any time through your account settings. Cancellations take effect at the end of the current billing period. We do not provide refunds for partial subscription periods, except as required by law.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">5.4 Price Changes</h3>
          <p>
            We reserve the right to modify our pricing at any time. Price changes will be communicated at least 30 days in advance and will not affect your current billing period.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property Rights</h2>
          <h3 className="text-xl font-semibold mb-2">6.1 Your Content</h3>
          <p>
            You retain all intellectual property rights to the code, projects, and content you create using the Service (&quot;Your Content&quot;). By using the Service, you grant us a limited, worldwide, non-exclusive license to host, store, and display Your Content solely for the purpose of providing the Service.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">6.2 Our Intellectual Property</h3>
          <p>
            The Service, including its design, features, functionality, and underlying technology, is owned by ZapDev and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or create derivative works based on the Service without our express written permission.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">6.3 AI-Generated Content</h3>
          <p>
            Code and content generated by AI through the Service is provided to you for your use. However, you acknowledge that AI-generated content may not be unique and similar content may be generated for other users. You are responsible for reviewing and validating all AI-generated content before use.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Data Usage and Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to our collection and use of your data as described in the Privacy Policy.
          </p>
          <p>
            We collect and store messages, project data, and usage information to provide and improve the Service. We use analytics to understand how users interact with the platform, but we do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
          <p>
            The Service integrates with third-party services, including AI providers, authentication services, and infrastructure providers. Your use of these third-party services is subject to their respective terms and privacy policies. We are not responsible for the practices or content of third-party services.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Service Availability and Limitations</h2>
          <h3 className="text-xl font-semibold mb-2">9.1 Service Availability</h3>
          <p>
            We strive to provide reliable and uninterrupted service, but we do not guarantee that the Service will be available at all times. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">9.2 Usage Limits</h3>
          <p>
            We may impose usage limits based on your subscription plan, including limits on API calls, compute resources, storage, and message volume. Exceeding these limits may result in service restrictions or additional charges.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">9.3 Beta Features</h3>
          <p>
            We may offer beta or experimental features that are provided &quot;as is&quot; without warranties. These features may be modified or discontinued at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Disclaimers and Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
          </p>
          <p>
            WE DO NOT WARRANT THAT:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>The Service will meet your requirements or expectations</li>
            <li>The Service will be uninterrupted, timely, secure, or error-free</li>
            <li>The results obtained from using the Service will be accurate or reliable</li>
            <li>Any errors in the Service will be corrected</li>
            <li>AI-generated code will be free from bugs, vulnerabilities, or other defects</li>
          </ul>
          <p className="mt-4">
            You acknowledge that AI-generated code requires human review and validation before deployment in production environments.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL ZAPDEV, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
          </p>
          <p>
            OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
          </p>
          <p>
            Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities, so some of the above limitations may not apply to you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless ZapDev and its officers, directors, employees, and agents from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys&apos; fees) arising from:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Your Content or any content you generate using the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
          <h3 className="text-xl font-semibold mb-2">13.1 Informal Resolution</h3>
          <p>
            If you have any dispute with us, you agree to first contact us and attempt to resolve the dispute informally by sending a written notice describing the dispute and your proposed resolution.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">13.2 Arbitration</h3>
          <p>
            If we cannot resolve a dispute informally, any disputes arising out of or related to these Terms or the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except as otherwise provided herein. The arbitration shall be conducted in English.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">13.3 Class Action Waiver</h3>
          <p>
            You agree that any arbitration or proceeding shall be limited to the dispute between you and ZapDev individually. To the full extent permitted by law, no arbitration or proceeding shall be joined with any other, no dispute shall be arbitrated on a class-action basis, and you waive any right to participate in a class action against us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Export Controls</h2>
          <p>
            The Service may be subject to export control laws and regulations. You agree not to export, re-export, or transfer the Service or any related technology to any country, individual, or entity to which such export is restricted or prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">15. General Provisions</h2>
          <h3 className="text-xl font-semibold mb-2">15.1 Governing Law</h3>
          <p>
            These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">15.2 Entire Agreement</h3>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and ZapDev regarding the Service and supersede all prior agreements and understandings.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">15.3 Severability</h3>
          <p>
            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">15.4 Waiver</h3>
          <p>
            No waiver of any provision of these Terms shall be deemed a further or continuing waiver of such provision or any other provision.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">15.5 Assignment</h3>
          <p>
            You may not assign or transfer these Terms or your rights under these Terms without our prior written consent. We may assign these Terms without restriction.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">15.6 Survival</h3>
          <p>
            Sections that by their nature should survive termination shall survive, including but not limited to intellectual property provisions, disclaimers, limitations of liability, and dispute resolution provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p className="mt-4">
            <strong>Email:</strong> support@zapdev.link<br />
            <strong>Website:</strong> https://zapdev.link
          </p>
        </section>

        <section className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            By using ZapDev, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </section>
      </div>
    </div>
  );
}
