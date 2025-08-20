/**
 * Privacy Policy Page for LexChronos
 * Comprehensive privacy policy for legal case management system
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | LexChronos Legal Management',
  description: 'Privacy Policy for LexChronos Legal Case Management System - How we collect, use, and protect your legal data.',
  robots: 'index, follow'
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600">LexChronos Legal Case Management System</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: January 20, 2025</p>
          </div>

          {/* Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8 overflow-x-auto">
              <a href="#overview" className="whitespace-nowrap py-2 px-1 border-b-2 border-blue-500 text-sm font-medium text-blue-600">
                Overview
              </a>
              <a href="#information-collected" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                Information Collected
              </a>
              <a href="#how-we-use" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                How We Use Data
              </a>
              <a href="#data-security" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                Data Security
              </a>
              <a href="#your-rights" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                Your Rights
              </a>
              <a href="#contact" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                Contact Us
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            
            {/* Overview */}
            <section id="overview" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      <strong>Legal Professional Privacy Notice:</strong> LexChronos is designed specifically for legal professionals and law firms. 
                      We understand the critical importance of attorney-client privilege, confidentiality, and compliance with legal industry regulations.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4">
                LexChronos (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy and the confidentiality of your legal work. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our legal case management system.
              </p>
              
              <p className="text-gray-700 mb-4">
                <strong>Attorney-Client Privilege:</strong> We recognize that information stored in LexChronos may be subject to attorney-client privilege. 
                We maintain strict confidentiality and do not access, review, or disclose privileged communications except as required by law or with explicit authorization.
              </p>

              <p className="text-gray-700">
                By using LexChronos, you agree to the terms outlined in this Privacy Policy. If you disagree with any part of this policy, 
                please do not use our services.
              </p>
            </section>

            {/* Information We Collect */}
            <section id="information-collected" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Account Information</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Personal details (name, email address, phone number)</li>
                <li>Professional information (bar number, law firm affiliation, title)</li>
                <li>Authentication credentials (encrypted passwords)</li>
                <li>Organization details (law firm name, address, billing information)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Legal Case Data</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Case information (case numbers, titles, descriptions, status)</li>
                <li>Client information (names, contact details, case-related data)</li>
                <li>Legal documents and files</li>
                <li>Timeline events and case notes</li>
                <li>Court dates, deadlines, and calendar information</li>
                <li>Billing entries and time tracking data</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Usage and Technical Data</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Login times and session data</li>
                <li>Feature usage patterns</li>
                <li>IP addresses and device information</li>
                <li>Browser type and version</li>
                <li>Performance metrics and error logs</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Payment Information</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Billing address and payment method details</li>
                <li>Subscription and invoice information</li>
                <li>Payment processing is handled by Stripe (PCI DSS compliant)</li>
                <li>We do not store complete credit card numbers</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section id="how-we-use" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Case Management</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Provide legal case management services</li>
                <li>Store and organize legal documents securely</li>
                <li>Send notifications about deadlines and court dates</li>
                <li>Generate reports and analytics for your practice</li>
                <li>Facilitate collaboration within your organization</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Operations</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Process payments and manage subscriptions</li>
                <li>Provide customer support and technical assistance</li>
                <li>Send service-related communications</li>
                <li>Monitor system performance and security</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Product Improvement</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Analyze usage patterns to improve features</li>
                <li>Develop new legal technology solutions</li>
                <li>Enhance security and performance</li>
                <li>Conduct user experience research</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> We never use your legal case data for marketing purposes or share it with third parties 
                  for commercial gain. Your legal work remains confidential and is used solely to provide our services.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section id="data-security" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security and Protection</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Encryption and Storage</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>End-to-end encryption for all data transmission (TLS 1.3)</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Secure cloud infrastructure (AWS/Google Cloud)</li>
                <li>Regular security audits and penetration testing</li>
                <li>ISO 27001 and SOC 2 Type II compliance</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Access Controls</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Multi-factor authentication (MFA) support</li>
                <li>Role-based access permissions</li>
                <li>Regular access reviews and deprovisioning</li>
                <li>Audit trails for all data access</li>
                <li>Employee background checks and security training</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Centers and Backup</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Data centers in secure, certified facilities</li>
                <li>Automated daily backups with 99.9% uptime guarantee</li>
                <li>Geographic redundancy and disaster recovery</li>
                <li>24/7 monitoring and incident response</li>
              </ul>

              <div className="bg-green-50 border-l-4 border-green-400 p-6 mb-6">
                <p className="text-sm text-green-800">
                  <strong>Legal Industry Compliance:</strong> Our security measures meet or exceed requirements for legal professional responsibility rules, 
                  including ABA Model Rule 1.6 (Confidentiality of Information) and state bar technology guidelines.
                </p>
              </div>
            </section>

            {/* Data Sharing and Disclosure */}
            <section id="data-sharing" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing and Disclosure</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">We Do NOT Share Your Legal Data</h3>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or otherwise transfer your legal case information to third parties. Your confidential legal work remains private.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Limited Disclosure Scenarios</h3>
              <p className="text-gray-700 mb-2">We may disclose information only in these specific circumstances:</p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>With your explicit written consent</li>
                <li>To trusted service providers who assist in operations (under strict confidentiality agreements)</li>
                <li>When required by valid legal process (court orders, subpoenas)</li>
                <li>To protect legal rights or prevent harm</li>
                <li>In connection with a merger or acquisition (with prior notice)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Providers</h3>
              <p className="text-gray-700 mb-2">Trusted partners who help us provide services:</p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Cloud infrastructure providers (AWS, Google Cloud)</li>
                <li>Payment processors (Stripe)</li>
                <li>Email service providers</li>
                <li>Analytics and monitoring tools</li>
                <li>All providers are bound by strict confidentiality agreements</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section id="your-rights" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights and Choices</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Access and Control</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li><strong>Access:</strong> View and download your data at any time</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in common formats</li>
                <li><strong>Restriction:</strong> Limit how we use your information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Communication Preferences</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Opt out of marketing communications</li>
                <li>Control notification preferences</li>
                <li>Manage email frequency settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Management</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Cancel your subscription at any time</li>
                <li>Delete your account and all associated data</li>
                <li>Transfer data to another service</li>
              </ul>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>GDPR and CCPA Compliance:</strong> If you are located in the EU or California, you have additional rights under 
                  GDPR and CCPA regulations. Contact us to exercise these rights.
                </p>
              </div>
            </section>

            {/* Retention and Deletion */}
            <section id="retention" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention and Deletion</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Retention Periods</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li><strong>Active accounts:</strong> Data retained while account is active</li>
                <li><strong>Closed accounts:</strong> 30-day grace period for reactivation</li>
                <li><strong>Legal requirements:</strong> Some data retained as required by law</li>
                <li><strong>Backup systems:</strong> Up to 90 days in backup systems</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Deletion</h3>
              <p className="text-gray-700 mb-4">
                When data is deleted, we use industry-standard secure deletion methods to ensure data cannot be recovered. 
                This includes overwriting data multiple times and destroying physical storage media when replaced.
              </p>
            </section>

            {/* Children's Privacy */}
            <section id="children" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-700 mb-4">
                LexChronos is designed for legal professionals and is not intended for use by individuals under 18 years of age. 
                We do not knowingly collect personal information from children under 18.
              </p>
            </section>

            {/* International Users */}
            <section id="international" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">International Users</h2>
              <p className="text-gray-700 mb-4">
                LexChronos is operated from the United States. If you are accessing our services from outside the US, 
                your information may be transferred to, stored, and processed in the US where our servers are located.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">EU Users</h3>
              <p className="text-gray-700 mb-4">
                For European Union users, we comply with GDPR requirements and provide appropriate safeguards for data transfers. 
                We use Standard Contractual Clauses approved by the European Commission.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section id="changes" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. 
                We will notify you of significant changes by:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Posting the updated policy on our website</li>
                <li>Sending email notifications to account holders</li>
                <li>Displaying prominent notices in the application</li>
              </ul>
              
              <p className="text-gray-700">
                Your continued use of LexChronos after changes become effective constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Contact Information */}
            <section id="contact" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Questions and Requests</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Email</h4>
                    <p className="text-gray-700">privacy@lexchronos.com</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Data Protection Officer</h4>
                    <p className="text-gray-700">dpo@lexchronos.com</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Mail</h4>
                    <p className="text-gray-700">
                      LexChronos Privacy Team<br/>
                      [Your Business Address]<br/>
                      [City, State ZIP Code]
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Response Time</h4>
                    <p className="text-gray-700">
                      We respond to privacy requests within 30 days (or sooner as required by applicable law)
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">
                This Privacy Policy was last updated on January 20, 2025
              </p>
              <div className="flex justify-center space-x-6">
                <Link href="/terms-of-service" className="text-sm text-blue-600 hover:text-blue-500">
                  Terms of Service
                </Link>
                <Link href="/security" className="text-sm text-blue-600 hover:text-blue-500">
                  Security
                </Link>
                <Link href="/contact" className="text-sm text-blue-600 hover:text-blue-500">
                  Contact Us
                </Link>
                <Link href="/" className="text-sm text-blue-600 hover:text-blue-500">
                  Back to LexChronos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}