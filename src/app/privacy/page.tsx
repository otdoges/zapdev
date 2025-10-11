import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | ZapDev",
  description: "Privacy Policy for ZapDev platform",
};

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to ZapDev (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or the &quot;Service&quot;). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered development platform.
          </p>
          <p>
            By using ZapDev, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with this Privacy Policy, please do not use the Service.
          </p>
          <p>
            <strong>Important:</strong> We do not sell your personal data to third parties. We use your data only to provide, maintain, and improve our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-2">2.1 Information You Provide to Us</h3>
          <p>We collect information that you voluntarily provide when using the Service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account Information:</strong> Name, email address, username, and password when you create an account
            </li>
            <li>
              <strong>Profile Information:</strong> Any additional information you add to your profile, such as profile pictures or bio
            </li>
            <li>
              <strong>Payment Information:</strong> Billing details and payment card information (processed securely through our payment processor; we do not store full card details)
            </li>
            <li>
              <strong>Messages and Conversations:</strong> All messages you send to our AI agents, including project descriptions, code requests, and conversational exchanges
            </li>
            <li>
              <strong>Project Content:</strong> Code, files, project configurations, and other content you create or upload using the Service
            </li>
            <li>
              <strong>Support Communications:</strong> Information you provide when contacting our support team
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Information Automatically Collected</h3>
          <p>We automatically collect certain information when you use the Service:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Usage Data:</strong> Information about how you interact with the Service, including features used, actions taken, time spent, and frequency of use
            </li>
            <li>
              <strong>Device Information:</strong> Device type, operating system, browser type and version, unique device identifiers, and mobile network information
            </li>
            <li>
              <strong>Log Data:</strong> IP address, access times, pages viewed, page response times, and referring/exit pages
            </li>
            <li>
              <strong>Analytics Data:</strong> We use analytics services (including Sentry for error tracking) to collect information about Service usage, performance metrics, and error reports
            </li>
            <li>
              <strong>Cookies and Tracking Technologies:</strong> Cookies, web beacons, and similar technologies to track activity and store certain information (see Section 9 for details)
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Information from Third Parties</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Authentication Providers:</strong> If you sign in using a third-party authentication provider (e.g., Clerk), we receive information from that provider such as your name, email address, and profile information
            </li>
            <li>
              <strong>AI Service Providers:</strong> Information about API usage and requests sent to third-party AI providers
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          
          <h3 className="text-xl font-semibold mb-2">3.1 Providing and Maintaining the Service</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>To create and manage your account</li>
            <li>To process your messages and generate AI responses</li>
            <li>To store and display your projects, code, and conversation history</li>
            <li>To provide customer support and respond to your inquiries</li>
            <li>To process payments and manage subscriptions</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Improving and Optimizing the Service</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>To analyze usage patterns and understand how users interact with the Service</li>
            <li>To identify and fix technical issues, bugs, and errors</li>
            <li>To develop new features and improve existing functionality</li>
            <li>To optimize performance and user experience</li>
            <li>To train and improve our AI models and algorithms</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">3.3 Security and Compliance</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>To detect, prevent, and respond to fraud, abuse, and security threats</li>
            <li>To enforce our Terms of Service and other policies</li>
            <li>To comply with legal obligations and respond to legal requests</li>
            <li>To protect the rights, property, and safety of ZapDev, our users, and the public</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">3.4 Communications</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>To send you service-related notifications, updates, and security alerts</li>
            <li>To notify you about changes to the Service or our policies</li>
            <li>To send you marketing communications (with your consent, where required)</li>
            <li>To respond to your comments, questions, and requests</li>
          </ul>

          <p className="mt-4 font-semibold">
            We do NOT sell your personal information to third parties for monetary or other valuable consideration.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Message and Conversation Storage</h2>
          <p>
            We store all messages and conversations you have with our AI agents in our database. This is essential for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Providing you with conversation history and context across sessions</li>
            <li>Enabling continuity in your projects and development workflow</li>
            <li>Allowing you to review and reference previous interactions</li>
            <li>Improving our AI models and service quality</li>
          </ul>
          <p className="mt-4">
            Your messages are stored securely and are only accessible to you and authorized ZapDev personnel for support and improvement purposes. We implement appropriate technical and organizational measures to protect your messages from unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Analytics and Performance Monitoring</h2>
          <p>
            We use analytics and performance monitoring tools to understand how our Service is used and to improve user experience:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Error Tracking:</strong> We use Sentry to monitor application errors, performance issues, and crashes. This helps us identify and fix problems quickly.
            </li>
            <li>
              <strong>Usage Analytics:</strong> We track how users interact with features, pages visited, actions taken, and time spent to optimize the user experience.
            </li>
            <li>
              <strong>Performance Metrics:</strong> We collect data on page load times, API response times, and other performance indicators.
            </li>
          </ul>
          <p className="mt-4">
            All analytics data is used exclusively for improving our Service and is never sold to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. How We Share Your Information</h2>
          <p>
            We may share your information in the following circumstances:
          </p>

          <h3 className="text-xl font-semibold mb-2">6.1 Service Providers</h3>
          <p>
            We share information with third-party service providers who perform services on our behalf, including:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Cloud hosting and infrastructure providers (e.g., Vercel, database providers)</li>
            <li>AI model providers for code generation and assistance</li>
            <li>Authentication and identity verification services (e.g., Clerk)</li>
            <li>Payment processors for billing and subscriptions</li>
            <li>Analytics and monitoring services (e.g., Sentry)</li>
            <li>Email and communication service providers</li>
          </ul>
          <p className="mt-2">
            These service providers are contractually obligated to use your information only to provide services to us and are prohibited from using your information for their own purposes.
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">6.2 Legal Requirements</h3>
          <p>
            We may disclose your information if required by law or if we believe in good faith that such disclosure is necessary to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Comply with legal obligations, court orders, or government requests</li>
            <li>Enforce our Terms of Service or other agreements</li>
            <li>Protect the rights, property, or safety of ZapDev, our users, or others</li>
            <li>Investigate and prevent fraud, security threats, or illegal activities</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">6.3 Business Transfers</h3>
          <p>
            If ZapDev is involved in a merger, acquisition, sale of assets, or bankruptcy, your information may be transferred as part of that transaction. We will notify you of any such change and any choices you may have regarding your information.
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">6.4 With Your Consent</h3>
          <p>
            We may share your information for any other purpose with your explicit consent.
          </p>

          <p className="mt-4 font-semibold">
            We do NOT sell, rent, or trade your personal information to third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your information from unauthorized access, disclosure, alteration, and destruction. These measures include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of data in transit using SSL/TLS protocols</li>
            <li>Encryption of sensitive data at rest</li>
            <li>Secure authentication and access control mechanisms</li>
            <li>Regular security assessments and vulnerability testing</li>
            <li>Access restrictions and role-based permissions for our personnel</li>
            <li>Monitoring and logging of system activities</li>
            <li>Regular backups and disaster recovery procedures</li>
          </ul>
          <p className="mt-4">
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
          <p>
            We retain your information for as long as necessary to provide the Service and fulfill the purposes described in this Privacy Policy. Specifically:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Account Information:</strong> Retained while your account is active and for a reasonable period thereafter for legal and business purposes
            </li>
            <li>
              <strong>Messages and Projects:</strong> Retained while your account is active to provide conversation history and project continuity
            </li>
            <li>
              <strong>Usage and Analytics Data:</strong> Typically retained for up to 2 years for analysis and improvement purposes
            </li>
            <li>
              <strong>Payment Information:</strong> Retained as required for tax, accounting, and legal purposes
            </li>
            <li>
              <strong>Legal Data:</strong> Retained as required by applicable laws and regulations
            </li>
          </ul>
          <p className="mt-4">
            When you delete your account, we will delete or anonymize your personal information within a reasonable timeframe, except where we are required or permitted by law to retain it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our Service and store certain information. Cookies are small data files stored on your device.
          </p>

          <h3 className="text-xl font-semibold mb-2">9.1 Types of Cookies We Use</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Essential Cookies:</strong> Required for the Service to function properly (e.g., authentication, session management)
            </li>
            <li>
              <strong>Functional Cookies:</strong> Enable enhanced functionality and personalization (e.g., theme preferences, language settings)
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how users interact with the Service to improve user experience
            </li>
            <li>
              <strong>Performance Cookies:</strong> Collect information about how the Service performs and identify areas for improvement
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">9.2 Managing Cookies</h3>
          <p>
            Most web browsers allow you to control cookies through their settings. You can set your browser to refuse cookies or alert you when cookies are being sent. However, if you disable cookies, some parts of the Service may not function properly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Your Privacy Rights</h2>
          <p>
            Depending on your location and applicable laws, you may have certain rights regarding your personal information:
          </p>

          <h3 className="text-xl font-semibold mb-2">10.1 General Rights</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Access:</strong> Request access to the personal information we hold about you
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or incomplete information
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal information
            </li>
            <li>
              <strong>Portability:</strong> Request a copy of your information in a structured, commonly used format
            </li>
            <li>
              <strong>Objection:</strong> Object to certain processing of your information
            </li>
            <li>
              <strong>Restriction:</strong> Request restriction of processing in certain circumstances
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">10.2 European Union (GDPR) Rights</h3>
          <p>
            If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to withdraw consent at any time</li>
            <li>Right to lodge a complaint with a supervisory authority</li>
            <li>Right to object to processing based on legitimate interests</li>
            <li>Right not to be subject to automated decision-making, including profiling</li>
          </ul>
          <p className="mt-2">
            <strong>Legal Basis for Processing (GDPR):</strong> We process your information based on:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contract performance (to provide the Service you requested)</li>
            <li>Legitimate interests (to improve and secure the Service)</li>
            <li>Your consent (where required)</li>
            <li>Legal obligations (to comply with applicable laws)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">10.3 California Privacy Rights (CCPA/CPRA)</h3>
          <p>
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Right to know what personal information we collect, use, disclose, and sell</li>
            <li>Right to request deletion of your personal information</li>
            <li>Right to opt-out of the sale or sharing of your personal information</li>
            <li>Right to correct inaccurate personal information</li>
            <li>Right to limit use and disclosure of sensitive personal information</li>
            <li>Right to non-discrimination for exercising your privacy rights</li>
          </ul>
          <p className="mt-4 font-semibold">
            Note: We do not sell your personal information as defined by the CCPA.
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">10.4 How to Exercise Your Rights</h3>
          <p>
            To exercise any of these rights, please contact us at privacy@zapdev.com. We will respond to your request within the timeframe required by applicable law (typically 30 days).
          </p>
          <p>
            We may need to verify your identity before processing your request. You can also manage many aspects of your information through your account settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that are different from the laws of your country.
          </p>
          <p>
            When we transfer your information internationally, we take appropriate safeguards to ensure your information remains protected in accordance with this Privacy Policy and applicable data protection laws. These safeguards may include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Standard Contractual Clauses approved by the European Commission</li>
            <li>Adequacy decisions by relevant authorities</li>
            <li>Other appropriate transfer mechanisms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Children&apos;s Privacy</h2>
          <p>
            Our Service is not intended for children under the age of 13 (or 16 in the EEA). We do not knowingly collect personal information from children under these ages. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will take steps to delete such information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Third-Party Links and Services</h2>
          <p>
            The Service may contain links to third-party websites, services, or applications that are not operated by us. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party services you access through our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">14. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of any material changes by:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Posting the updated Privacy Policy on this page with a new &quot;Last Updated&quot; date</li>
            <li>Sending you an email notification (for significant changes)</li>
            <li>Displaying a prominent notice on the Service</li>
          </ul>
          <p className="mt-4">
            Your continued use of the Service after any changes indicates your acceptance of the updated Privacy Policy. We encourage you to review this Privacy Policy periodically.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">15. Contact Us</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
          </p>
          <div className="mt-4 space-y-2">
            <p><strong>Email:</strong> privacy@zapdev.link</p>
            <p><strong>Support Email:</strong> support@zapdev.link</p>
            <p><strong>Website:</strong> https://zapdev.link</p>
          </div>
          <p className="mt-4">
            For GDPR-related inquiries, you may also contact our Data Protection Officer at: dpo@zapdev.link
          </p>
        </section>

        <section className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-semibold mb-4">Summary of Key Points</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We collect information you provide, usage data, and information from third-party services</li>
            <li>We store your messages and conversations to provide history and improve our service</li>
            <li>We use analytics to improve the Service but do NOT sell your personal data</li>
            <li>We share information only with service providers, for legal compliance, or with your consent</li>
            <li>We implement strong security measures to protect your information</li>
            <li>You have rights to access, correct, delete, and control your personal information</li>
            <li>We comply with GDPR, CCPA, and other applicable privacy laws</li>
            <li>You can contact us at privacy@zapdev.link for any privacy-related questions</li>
          </ul>
        </section>

        <section className="mt-8 p-6 bg-muted rounded-lg">
          <p className="text-sm">
            <strong>Your Privacy Matters:</strong> We are committed to transparency and protecting your privacy. If you have any questions or concerns about how we handle your information, please don&apos;t hesitate to contact us.
          </p>
        </section>
      </div>
    </div>
  );
}
