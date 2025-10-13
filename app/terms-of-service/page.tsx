/**
 * Terms of Service Page for LexChronos
 * Comprehensive terms of service for legal case management system
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | LexChronos Legal Management',
  description: 'Terms of Service for LexChronos Legal Case Management System - Legal agreement governing the use of our platform.',
  robots: 'index, follow'
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600">LexChronos Legal Case Management System</p>
            <p className="text-sm text-gray-500 mt-2">Effective Date: January 20, 2025</p>
          </div>

          {/* Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8 overflow-x-auto">
              <a href="#acceptance" className="whitespace-nowrap py-2 px-1 border-b-2 border-blue-500 text-sm font-medium text-blue-600">
                Agreement
              </a>
              <a href="#services" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                Services
              </a>
              <a href="#user-obligations" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                Obligations
              </a>
              <a href="#professional-responsibility" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                Ethics
              </a>
              <a href="#payment-terms" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                Payment
              </a>
              <a href="#limitation" className="whitespace-nowrap py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700">
                Liability
              </a>
            </nav>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            
            {/* Acceptance of Terms */}
            <section id="acceptance" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Legal Professional Agreement:</strong> These Terms of Service constitute a binding legal agreement between you, 
                  as a legal professional or law firm, and LexChronos regarding your use of our legal case management platform.
                </p>
              </div>

              <p className="text-gray-700 mb-4">
                By accessing or using LexChronos (&quot;the Service&quot;, &quot;the Platform&quot;, &quot;our Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). 
                If you disagree with any part of these Terms, you may not access the Service.
              </p>

              <p className="text-gray-700 mb-4">
                These Terms apply to all users of the Service, including but not limited to attorneys, paralegals, law firm administrators, 
                and other legal professionals (&quot;Users&quot;, &quot;you&quot;, or &quot;your&quot;).
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Capacity and Authority</h3>
              <p className="text-gray-700 mb-4">
                By using LexChronos, you represent and warrant that:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>You are a licensed legal professional in good standing or authorized to practice law</li>
                <li>You have the authority to bind your organization to these Terms</li>
                <li>Your use of the Service complies with applicable legal professional responsibility rules</li>
                <li>You are at least 18 years of age</li>
              </ul>
            </section>

            {/* Description of Services */}
            <section id="services" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description of Services</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Core Features</h3>
              <p className="text-gray-700 mb-4">LexChronos provides the following legal case management services:</p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Case and matter management</li>
                <li>Document storage and organization</li>
                <li>Calendar and deadline management</li>
                <li>Time tracking and billing</li>
                <li>Client communication tools</li>
                <li>Court date and hearing management</li>
                <li>Legal research and note-taking</li>
                <li>Reporting and analytics</li>
                <li>Team collaboration features</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Levels</h3>
              <p className="text-gray-700 mb-4">We offer multiple subscription tiers with different features and capacity limits:</p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li><strong>Basic:</strong> Essential case management for small practices</li>
                <li><strong>Professional:</strong> Advanced features for growing firms</li>
                <li><strong>Enterprise:</strong> Full-featured solution for large organizations</li>
                <li><strong>Custom:</strong> Tailored solutions for specific needs</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Availability</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>We strive for 99.9% uptime availability</li>
                <li>Planned maintenance will be announced in advance</li>
                <li>Emergency maintenance may occur without notice</li>
                <li>Service interruptions do not extend subscription periods</li>
              </ul>
            </section>

            {/* User Obligations */}
            <section id="user-obligations" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Obligations and Acceptable Use</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Responsibilities</h3>
              <p className="text-gray-700 mb-4">You are responsible for:</p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Providing accurate and up-to-date account information</li>
                <li>Ensuring your organization&apos;s users comply with these Terms</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Acceptable Use Policy</h3>
              <p className="text-gray-700 mb-4">You agree NOT to use LexChronos to:</p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Violate any applicable laws, regulations, or legal professional rules</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful, offensive, or illegal content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use the Service for any unlawful purpose</li>
                <li>Share access credentials with unauthorized persons</li>
                <li>Reverse engineer or attempt to extract source code</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Integrity and Backup</h3>
              <p className="text-gray-700 mb-4">
                While we maintain robust backup systems, you acknowledge that:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>You are responsible for maintaining your own backup copies of critical data</li>
                <li>We are not liable for data loss due to user error or system failures</li>
                <li>Regular data exports are recommended as part of your data management practices</li>
              </ul>
            </section>

            {/* Professional Responsibility */}
            <section id="professional-responsibility" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Professional Responsibility and Ethics</h2>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Professional Ethics Compliance:</strong> LexChronos is designed to help legal professionals comply with 
                  professional responsibility rules, but ultimate compliance responsibility rests with you.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Competence and Technology</h3>
              <p className="text-gray-700 mb-4">
                Consistent with ABA Model Rule 1.1 (Competence), you acknowledge that:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>You must maintain competence in relevant technology</li>
                <li>You are responsible for understanding LexChronos features and limitations</li>
                <li>You must ensure proper training for all users in your organization</li>
                <li>Technology cannot replace professional judgment and legal expertise</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Client Confidentiality</h3>
              <p className="text-gray-700 mb-4">
                In accordance with professional confidentiality requirements:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>You must obtain appropriate client consent before using cloud-based services</li>
                <li>You are responsible for assessing whether LexChronos meets your confidentiality obligations</li>
                <li>You must configure access controls appropriately within your organization</li>
                <li>Privileged communications remain subject to attorney-client privilege</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Conflicts of Interest</h3>
              <p className="text-gray-700 mb-4">
                You acknowledge that:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>LexChronos provides tools to help identify potential conflicts</li>
                <li>You remain responsible for conflicts checking and resolution</li>
                <li>Technology tools supplement but do not replace professional analysis</li>
                <li>You must maintain independent conflict checking procedures</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Client Data and Trust Accounting</h3>
              <p className="text-gray-700 mb-4">
                For any financial tracking features:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>You remain responsible for compliance with trust account regulations</li>
                <li>LexChronos is not a substitute for proper trust accounting practices</li>
                <li>You must maintain appropriate segregation of client and firm funds</li>
                <li>Regular reconciliation and audit practices remain your responsibility</li>
              </ul>
            </section>

            {/* Payment Terms */}
            <section id="payment-terms" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Terms and Billing</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Subscription Fees</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>Prices are subject to change with 30 days&apos; notice</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>Taxes are additional and your responsibility</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Payment Processing</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Payments are processed through Stripe, our secure payment partner</li>
                <li>Valid payment method required for all paid subscriptions</li>
                <li>Automatic renewal unless cancelled before renewal date</li>
                <li>Failed payments may result in service suspension</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Late Payment and Suspension</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Accounts may be suspended for non-payment after 7 days</li>
                <li>Data access may be restricted during suspension</li>
                <li>Accounts may be terminated after 30 days of non-payment</li>
                <li>Reactivation fees may apply for suspended accounts</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Cancellation and Refunds</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>You may cancel your subscription at any time</li>
                <li>Service continues until the end of the current billing period</li>
                <li>No refunds for partial months or unused portions</li>
                <li>Data export available for 30 days after cancellation</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section id="intellectual-property" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property Rights</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Our Intellectual Property</h3>
              <p className="text-gray-700 mb-4">
                LexChronos, including all software, content, trademarks, and related intellectual property, 
                is owned by us or our licensors. You receive only a limited, non-exclusive license to use the Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Your Content and Data</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>You retain all rights to your legal work product and client data</li>
                <li>You grant us a limited license to process your data to provide the Service</li>
                <li>We do not claim ownership of your legal work or client information</li>
                <li>You may export your data at any time</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Feedback and Suggestions</h3>
              <p className="text-gray-700 mb-4">
                Any feedback, suggestions, or improvements you provide may be used by us without restriction or compensation.
              </p>
            </section>

            {/* Privacy and Security */}
            <section id="privacy-security" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy and Data Security</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Privacy Policy</h3>
              <p className="text-gray-700 mb-4">
                Your privacy is governed by our <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-500">Privacy Policy</Link>, 
                which is incorporated into these Terms by reference.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Security Measures</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Industry-standard encryption for data transmission and storage</li>
                <li>Regular security audits and penetration testing</li>
                <li>Employee background checks and security training</li>
                <li>Secure data centers with physical access controls</li>
                <li>Incident response and notification procedures</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Data Breaches</h3>
              <p className="text-gray-700 mb-4">
                In the event of a data security incident, we will:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Promptly investigate and contain the incident</li>
                <li>Notify affected users as soon as reasonably possible</li>
                <li>Cooperate with law enforcement and regulatory authorities</li>
                <li>Provide assistance in assessing client notification requirements</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section id="limitation" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimers and Limitation of Liability</h2>

              <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Important Legal Notice:</strong> Please read this section carefully as it limits our liability 
                  and affects your legal rights.
                </p>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Disclaimer</h3>
              <p className="text-gray-700 mb-4 uppercase font-semibold">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A 
                PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Services Disclaimer</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>LexChronos is a technology platform, not a law firm or legal service provider</li>
                <li>We do not provide legal advice or legal services</li>
                <li>The platform does not replace professional legal judgment</li>
                <li>You remain responsible for all legal work product and client service</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
              <p className="text-gray-700 mb-4 uppercase font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY ARISING OUT OF OR RELATED TO 
                THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SERVICE IN THE 
                TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>

              <p className="text-gray-700 mb-4 uppercase font-semibold">
                WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
                DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Professional Liability</h3>
              <p className="text-gray-700 mb-4">
                We are not liable for:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Legal malpractice or professional negligence claims</li>
                <li>Missed deadlines or calendar failures (always maintain independent systems)</li>
                <li>Conflicts of interest not identified by the system</li>
                <li>Loss of clients or legal opportunities</li>
                <li>Regulatory sanctions or disciplinary actions</li>
              </ul>
            </section>

            {/* Indemnification */}
            <section id="indemnification" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify, defend, and hold harmless LexChronos and its officers, directors, employees, 
                and agents from and against any claims, liabilities, damages, losses, costs, expenses, or fees 
                (including reasonable attorneys&apos; fees) arising from:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your professional services or legal work</li>
                <li>Any content you submit to the Service</li>
              </ul>
            </section>

            {/* Termination */}
            <section id="termination" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Termination by You</h3>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time by canceling your subscription through the platform settings 
                or by contacting our support team.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Termination by Us</h3>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your account for:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Violation of these Terms</li>
                <li>Non-payment of fees</li>
                <li>Fraudulent or illegal activity</li>
                <li>Abuse of the Service or other users</li>
                <li>Professional discipline or loss of license to practice law</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Effect of Termination</h3>
              <ul className="list-disc pl-6 mb-6 text-gray-700">
                <li>Access to the Service will be terminated</li>
                <li>Data export available for 30 days after termination</li>
                <li>All unpaid fees become immediately due</li>
                <li>Confidentiality obligations survive termination</li>
              </ul>
            </section>

            {/* Dispute Resolution */}
            <section id="dispute-resolution" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Informal Resolution</h3>
              <p className="text-gray-700 mb-4">
                Before filing any formal claim, you agree to contact us to seek a resolution of any dispute. 
                Most disputes can be resolved informally.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Binding Arbitration</h3>
              <p className="text-gray-700 mb-4">
                Any unresolved dispute shall be resolved through binding arbitration in accordance with the 
                Commercial Arbitration Rules of the American Arbitration Association. The arbitration shall take place 
                in [Your State/Location].
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Class Action Waiver</h3>
              <p className="text-gray-700 mb-4">
                You agree to resolve disputes individually and waive any right to participate in class action lawsuits.
              </p>
            </section>

            {/* General Provisions */}
            <section id="general" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">General Provisions</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Governing Law</h3>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of [Your State], without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Entire Agreement</h3>
              <p className="text-gray-700 mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and LexChronos 
                regarding the Service.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Modifications</h3>
              <p className="text-gray-700 mb-4">
                We may modify these Terms at any time. Material changes will be communicated through the platform 
                or by email. Continued use of the Service constitutes acceptance of modified Terms.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Severability</h3>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Assignment</h3>
              <p className="text-gray-700 mb-4">
                You may not assign these Terms without our written consent. We may assign these Terms in connection 
                with a merger, acquisition, or sale of assets.
              </p>
            </section>

            {/* Contact Information */}
            <section id="contact" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal and Contract Questions</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Email</h4>
                    <p className="text-gray-700">legal@lexchronos.com</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Support</h4>
                    <p className="text-gray-700">support@lexchronos.com</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Mail</h4>
                    <p className="text-gray-700">
                      LexChronos Legal Team<br/>
                      [Your Business Address]<br/>
                      [City, State ZIP Code]
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Business Hours</h4>
                    <p className="text-gray-700">
                      Monday - Friday<br/>
                      9:00 AM - 6:00 PM EST
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
                These Terms of Service are effective as of January 20, 2025
              </p>
              <div className="flex justify-center space-x-6">
                <Link href="/privacy-policy" className="text-sm text-blue-600 hover:text-blue-500">
                  Privacy Policy
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