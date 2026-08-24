"use client";

import React, { useEffect, useState } from "react";
import { Shield, ArrowLeft, ScrollText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { BottomNav } from "@/components/ui/BottomNav";

export default function PrivacyPolicyPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20 pb-24">
      <style dangerouslySetInnerHTML={{__html:`
        .privacy-content h2 { font-size: 1.5rem; font-weight: 700; color: white; margin-top: 2rem; margin-bottom: 1rem; }
        .privacy-content h3 { font-size: 1.25rem; font-weight: 700; color: white; margin-top: 2rem; margin-bottom: 0.75rem; }
        .privacy-content h4 { font-size: 1.125rem; font-weight: 600; color: #e5e7eb; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .privacy-content p { color: #d1d5db; line-height: 1.75; margin-bottom: 1rem; }
        .privacy-content ul { list-style-type: disc; padding-left: 1.5rem; color: #d1d5db; margin-bottom: 1rem; line-height: 1.75; }
        .privacy-content ol { list-style-type: decimal; padding-left: 1.5rem; color: #d1d5db; margin-bottom: 1rem; line-height: 1.75; }
        .privacy-content li { margin-bottom: 0.25rem; }
        .privacy-content strong { color: white; font-weight: 600; }
        `}} />
      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-white" />
            <span className="font-bold tracking-tight text-white">FraudShield</span>
          </div>
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-16">
        
        {/* Header section */}
        <div className="mb-16 space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
            <ScrollText className="w-3.5 h-3.5" />
            Legal Documentation
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Privacy Policy &<br/>Terms of Service
          </h1>
          <div className="flex items-center gap-6 text-sm font-mono text-gray-500 pt-2">
            <div className="flex flex-col">
              <span className="text-gray-400">Effective Date</span>
              <span className="text-white mt-1">24 August 2026</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400">Last Updated</span>
              <span className="text-white mt-1">24 August 2026</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="privacy-content max-w-none text-gray-300 leading-relaxed space-y-4 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-150">
          
          <p className="text-lg text-gray-200">
            FraudShield is an explainable fraud-intelligence and transaction-risk analysis platform designed to help identify potentially suspicious payment behavior, unusual device activity, abnormal transaction patterns, social-engineering indicators, and voice-phishing or coercive interaction signals.
          </p>
          <p>
            This Privacy Policy and Terms of Service ("Policy", "Terms", or "Agreement") explains how information may be processed when you use FraudShield, how the platform is intended to protect user privacy, how risk analysis operates, and the conditions under which you may use the service.
          </p>
          <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5 my-8 flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
            <p className="m-0 text-gray-200">
              FraudShield is designed around the principle that fraud prevention should provide useful intelligence without unnecessarily exposing, collecting, or retaining personal information. By accessing or using FraudShield, you acknowledge that you have read and understood this Policy and agree to the applicable terms described below. If you do not agree with these Terms, you should not use FraudShield.
            </p>
          </div>

          {/* Part I */}
          <div className="mt-16 mb-8 pb-4 border-b border-white/10">
            <h2 className="text-3xl text-white m-0">PART I — PRIVACY POLICY</h2>
          </div>

          <h3>1. Our Privacy Principles</h3>
          <p>FraudShield is designed according to the following privacy principles:</p>
          
          <h4>1.1 Data minimization</h4>
          <p>FraudShield is intended to process only information reasonably necessary for transaction-risk analysis, fraud detection, security monitoring, system operation, testing, and authorized investigation. We do not intend to collect personal information merely because it is technically possible to do so.</p>
          
          <h4>1.2 Purpose limitation</h4>
          <p>Information processed by FraudShield should be used for legitimate purposes associated with:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <li>fraud detection</li>
            <li>transaction-risk assessment</li>
            <li>suspicious activity analysis</li>
            <li>device and recipient risk analysis</li>
            <li>social-engineering detection</li>
            <li>voice-phishing analysis</li>
            <li>security monitoring</li>
            <li>system testing and demonstration</li>
            <li>investigation of risk events</li>
            <li>improving system reliability</li>
            <li>evaluating false positives and false negatives</li>
            <li>maintaining system security and integrity</li>
          </ul>
          <p>Information should not be repurposed for unrelated activities without an appropriate legal or operational basis.</p>

          <h4>1.3 Explainability</h4>
          <p>FraudShield is designed to provide understandable explanations for risk assessments rather than presenting an unexplained risk score alone. Where supported by the system, risk decisions may incorporate multiple signals, including: transaction characteristics, historical transaction behavior, device characteristics, recipient familiarity, transaction velocity, anomalous transaction amounts, rule-based signals, machine-learning signals, and natural-language or social-engineering signals. The purpose of presenting these signals is to help users and authorized reviewers understand why a transaction or interaction may have been considered suspicious.</p>

          <h4>1.4 Human oversight</h4>
          <p>FraudShield is designed as a decision-support and risk-intelligence system. A risk score or warning should not automatically be interpreted as proof that a person has committed fraud. Where FraudShield is deployed in an environment involving human analysts or authorized institutions, risk assessments should be subject to appropriate human review and organizational procedures.</p>

          <h4>1.5 Privacy by design</h4>
          <p>Privacy and security considerations should be incorporated into the design of FraudShield rather than treated solely as an afterthought.</p>

          <hr className="border-white/10 my-10" />

          <h3>2. Information FraudShield May Process</h3>
          <p>Depending on how FraudShield is configured and used, the platform may process several categories of information. The exact information processed depends on the deployment, integration, configuration, and functionality being used.</p>
          
          <h4>2.1 Transaction information</h4>
          <p>A transaction analysis may contain information such as transaction amount, transaction status, transaction timestamp, user or account identifier, device identifier, recipient identifier, transaction history, transaction frequency, transaction velocity, transaction-related risk signals, risk score, risk level, risk reasons, or evaluation/model version.</p>
          <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 my-6">
            <p className="text-red-300 m-0 text-sm font-medium">
              FraudShield does not require that real financial credentials be entered into a demonstration environment. Users should never enter passwords, PINs, OTPs, CVVs, private keys, banking credentials, authentication secrets, or other confidential credentials into a FraudShield demonstration interface unless an authorized production deployment explicitly requires such information.
            </p>
          </div>

          <h3>3. Device Information</h3>
          <p>FraudShield may process device-related information necessary for identifying unusual device behavior. Examples may include device identifiers, device fingerprints, trusted/untrusted device status, first-seen information, last-seen information, device-to-user relationships, and device-to-transaction relationships. Device information may contribute to risk analysis when, for example, a transaction originates from a previously unknown or untrusted device. FraudShield should use the minimum device information reasonably necessary for the intended security purpose.</p>

          <h3>4. Recipient Information</h3>
          <p>FraudShield may process information relating to transaction recipients, including recipient identifiers, whether a recipient is known or trusted, recipient transaction history, recipient transaction count, recipient first-seen information, and recipient-related risk signals. Recipient information may be used to determine whether a transaction involves an unfamiliar or unusual recipient.</p>

          <h3>5. Interaction and Textual Information</h3>
          <p>Where the FraudShield interaction-analysis functionality is used, the user may provide textual interaction information for analysis. This may include conversation transcripts, descriptions of interactions, payment-related instructions, social-engineering indicators, urgency or coercion indicators, authority-impersonation indicators, and other contextual information supplied for analysis. Such information may be processed by the natural-language-processing components of FraudShield where applicable. Users should avoid submitting unnecessary personal information or confidential information into interaction-analysis fields.</p>

          <h3>6. Voice-Phishing and Social-Engineering Analysis</h3>
          <p>FraudShield is designed to identify signals associated with social engineering and voice-phishing scenarios. These may include indicators such as unusual urgency, coercive language, impersonation, requests for sensitive information, instructions to transfer funds, threats or fear-based persuasion, manipulation, and unusual payment instructions. The presence of one or more indicators does not establish that fraud has occurred. FraudShield provides risk intelligence and should not be treated as an infallible determination of intent.</p>

          <h3>7. Risk and Analytical Information</h3>
          <p>FraudShield may generate analytical information derived from submitted or observed transaction and interaction data. This may include risk scores, risk levels, rule matches, risk reasons, anomaly indicators, behavioral signals, device signals, recipient signals, machine-learning outputs, natural-language-processing outputs, combined or fused risk assessments, evaluation versions, analyst feedback, and investigation-related information. These outputs are analytical assessments and may contain uncertainty.</p>

          <h3>8. Analyst and Review Information</h3>
          <p>Where analyst-review functionality is enabled, FraudShield may process information associated with authorized review activities. This may include risk-event records, analyst classifications, analyst feedback, review status, investigation information, false-positive classifications, false-negative observations, and timestamps associated with review activity. Analyst information should be accessible only to appropriately authorized users within the relevant deployment.</p>

          <h3>9. Technical and Operational Information</h3>
          <p>FraudShield may process technical information necessary to operate and secure the platform. Depending on deployment configuration, this may include application logs, error information, service health information, API request metadata, timestamps, diagnostic information, system performance information, and security events. Technical logs should be limited to information reasonably necessary for operation, debugging, reliability, and security.</p>

          <h3>10. Demonstration and Testing Data</h3>
          <p>FraudShield may contain demonstration data, synthetic transactions, deterministic test identifiers, simulated devices, simulated recipients, and other information specifically created for testing or demonstration. Such information should not be interpreted as representing real financial activity. Demonstration data may be reset, regenerated, deleted, or replaced as part of the application's testing workflow. Users should not enter real sensitive financial information into a demonstration environment.</p>

          <h3>11. Synthetic Data</h3>
          <p>FraudShield may use synthetic data for development, testing, demonstration, validation, and evaluation. Synthetic data is designed to represent realistic patterns without necessarily representing an actual person, account, or financial transaction. Synthetic data may be used to test transaction anomalies, high transaction velocity, unusual amounts, new-device scenarios, unfamiliar recipients, social-engineering scenarios, multi-signal fraud scenarios, and risk-engine behavior.</p>

          <h3>12. How FraudShield Uses Information</h3>
          <p>Information processed through FraudShield may be used to:</p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <li>Analyze transaction risk.</li>
            <li>Identify unusual transaction behavior.</li>
            <li>Detect suspicious device changes.</li>
            <li>Identify unfamiliar recipients.</li>
            <li>Evaluate transaction velocity.</li>
            <li>Identify anomalous transaction amounts.</li>
            <li>Analyze social-engineering indicators.</li>
            <li>Analyze voice-phishing indicators where applicable.</li>
            <li>Produce explainable risk assessments.</li>
            <li>Generate risk reasons.</li>
            <li>Support authorized analyst investigation.</li>
            <li>Evaluate false positives.</li>
            <li>Improve testing and validation.</li>
            <li>Maintain application reliability.</li>
            <li>Detect technical or security problems.</li>
            <li>Maintain auditability where supported.</li>
            <li>Demonstrate the capabilities of the FraudShield system.</li>
          </ol>

          <h3>13. How FraudShield Makes Risk Assessments</h3>
          <p>FraudShield may combine multiple analytical approaches. Depending on the deployment, these may include:</p>
          <ul>
            <li><strong>Rule-based intelligence:</strong> Predefined rules may identify known suspicious patterns.</li>
            <li><strong>Behavioral analysis:</strong> Transaction behavior may be compared with historical or contextual patterns.</li>
            <li><strong>Machine-learning analysis:</strong> Machine-learning components may identify statistical or behavioral anomalies where such components are available and enabled.</li>
            <li><strong>Natural-language analysis:</strong> Natural-language-processing components may identify social-engineering or coercive communication patterns.</li>
            <li><strong>Risk fusion:</strong> Multiple signals may be combined into a final risk assessment.</li>
          </ul>
          <p>A final risk score represents the output of the configured analytical system at the time of evaluation.</p>

          <h3>14. FraudShield Does Not Guarantee Fraud Detection</h3>
          <p>No fraud-detection system can guarantee that every fraudulent transaction will be detected. FraudShield may produce false positives, produce false negatives, fail to recognize novel attack patterns, produce different assessments when input information changes, produce uncertain or incomplete results, or depend on the quality and completeness of available data. A low-risk result does not guarantee that a transaction is safe. A high-risk result does not prove that fraud has occurred. FraudShield should therefore be used as an intelligence and decision-support layer rather than as an absolute source of truth.</p>

          <h3>15. Data Retention</h3>
          <p>FraudShield follows a data-minimization approach. The period for which information is retained may depend on deployment configuration, operational requirements, security requirements, testing requirements, investigation requirements, applicable organizational policies, or applicable legal obligations. Where raw interaction or transcript storage is not required, the system may be configured to avoid retaining raw interaction content and instead retain only analytical information required for the relevant workflow. Users should not assume that information is automatically deleted immediately after an analysis unless the applicable deployment explicitly provides such functionality.</p>

          <h3>16. Raw Interaction and Transcript Data</h3>
          <p>Interaction or transcript information requires particular care because it may contain sensitive or personally identifiable information. FraudShield is designed to minimize unnecessary retention of raw interaction content. Where the system is configured not to retain raw transcripts, analytical processing may still produce derived information such as risk indicators, detected signals, classifications, scores, and explanations. Users should avoid including unnecessary personally identifiable information in transcripts submitted for analysis.</p>

          <h3>17. Data Security</h3>
          <p>FraudShield is designed with security considerations appropriate to a fraud-intelligence platform. Depending on deployment architecture, safeguards may include controlled database access, application-level validation, restricted administrative access, structured API boundaries, controlled analyst access, error handling, system readiness checks, database integrity controls, separation between application and database layers, and controlled storage of analytical events. However, no software system can guarantee absolute security. Users and deployment operators are responsible for maintaining appropriate security controls around the infrastructure in which FraudShield is deployed.</p>

          <h3>18. No Collection of Authentication Secrets</h3>
          <p>FraudShield's transaction-risk functionality is not intended to collect UPI PINs, banking passwords, OTPs, CVVs, card PINs, private cryptographic keys, authentication tokens, or account recovery codes. Never submit such information into a demonstration or analysis field. If a future production integration requires authentication credentials, such credentials should be handled through the appropriate secure authentication infrastructure rather than ordinary FraudShield analysis fields.</p>

          <h3>19. Third-Party Services</h3>
          <p>FraudShield may be deployed independently or integrated with external infrastructure. Depending on the deployment, third-party services may include hosting providers, database providers, infrastructure providers, monitoring systems, authentication providers, financial institutions, payment infrastructure, and other authorized service providers. Third-party services may have their own privacy policies and terms. FraudShield should not be understood as automatically controlling the privacy practices of third-party services. Where a deployment sends information to a third party, the relevant deployment operator should ensure that appropriate agreements, safeguards, and permissions are in place.</p>

          <h3>20. No Sale of Personal Information</h3>
          <p>FraudShield is not designed to sell personal information. Information processed for fraud detection should not be treated as a commercial advertising dataset. Fraud-related information should not be sold or disclosed to unrelated parties for advertising or unrelated profiling purposes.</p>

          <h3>21. No Advertising Profiling</h3>
          <p>FraudShield is designed as a security and risk-intelligence platform rather than an advertising platform. FraudShield does not use transaction-risk information for behavioral advertising purposes as part of its intended functionality.</p>

          <h3>22. Disclosure of Information</h3>
          <p>Information may be disclosed where reasonably necessary for authorized fraud investigation, authorized security investigation, system operation, technical support, legal compliance, protection of users, prevention of fraud or abuse, protection of the FraudShield platform, responding to lawful requests, and maintaining system integrity. Information should not be disclosed beyond what is reasonably necessary for the relevant purpose.</p>

          <h3>23. Financial and Banking Information</h3>
          <p>FraudShield is intended to support fraud-risk analysis. It is not itself a bank, payment processor, financial institution, or UPI service provider unless separately operated as part of an appropriately authorized financial infrastructure. FraudShield does not independently hold customer funds. FraudShield does not independently execute financial transfers merely because a transaction is analyzed. Any actual financial transaction remains subject to the systems, policies, controls, and authorization requirements of the relevant financial institution or payment service.</p>

          <h3>24. User Responsibility for Submitted Information</h3>
          <p>Users are responsible for ensuring that information submitted to FraudShield is appropriate for the environment in which the platform is being used. Do not knowingly submit passwords, authentication secrets, private keys, OTPs, unnecessary identity documents, unnecessary financial credentials, confidential corporate information, or unrelated personal information. When testing FraudShield, use synthetic or appropriately anonymized information whenever possible.</p>

          <h3>25. Accuracy and Data Quality</h3>
          <p>FraudShield's analytical results depend on the information supplied to the system. Incorrect, incomplete, outdated, manipulated, or misleading input may produce incorrect risk assessments. Users and authorized operators should therefore ensure that important underlying information is reasonably accurate. Where the system provides mechanisms for correcting information or analyst feedback, such mechanisms should be used when errors are identified.</p>

          <h3>26. Children's Privacy</h3>
          <p>FraudShield is not intentionally designed to collect personal information from children. Users should not knowingly submit information belonging to children unless such processing is authorized and appropriate for the specific deployment.</p>

          <h3>27. International and Cross-Border Processing</h3>
          <p>Where FraudShield is deployed across jurisdictions, information may potentially be processed in locations determined by the infrastructure and service configuration. Organizations deploying FraudShield are responsible for determining the appropriate legal and regulatory requirements applicable to their deployment.</p>

          <h3>28. Privacy Requests</h3>
          <p>Depending on the deployment and applicable law, individuals may have rights concerning personal information, which may include rights to request access, request correction, request deletion, request information about processing, object to certain processing, request restriction of processing, or withdraw consent where consent is the applicable basis. Because FraudShield may be deployed by different organizations, the appropriate entity for receiving such requests may be the organization operating the specific FraudShield deployment.</p>

          <h3>29. Changes to This Privacy Policy</h3>
          <p>This Privacy Policy may be updated as FraudShield evolves. Changes may occur because of new functionality, changes in infrastructure, changes in security practices, changes in data processing, legal or regulatory requirements, or changes in deployment architecture. The "Last Updated" date at the beginning of this document should be updated whenever material changes are made.</p>

          {/* Part II */}
          <div className="mt-16 mb-8 pb-4 border-b border-white/10">
            <h2 className="text-3xl text-white m-0">PART II — TERMS OF SERVICE</h2>
          </div>

          <h3>30. Acceptance of Terms</h3>
          <p>By accessing or using FraudShield, you agree to comply with these Terms of Service. If you do not agree with these Terms, you must discontinue use of the platform. These Terms apply to the FraudShield interface, APIs, analytical tools, dashboards, demonstration environments, transaction simulators, interaction-analysis functionality, analyst interfaces, and related services made available through the deployment.</p>

          <h3>31. Permitted Use</h3>
          <p>FraudShield may be used for legitimate purposes including fraud detection, security analysis, transaction-risk evaluation, security research, software development, testing, demonstrations, academic projects, authorized institutional analysis, authorized fraud investigations, system validation, and responsible experimentation.</p>

          <h3>32. Prohibited Use</h3>
          <p>You must not use FraudShield to commit fraud, facilitate financial crime, impersonate another person, obtain unauthorized access to accounts, steal credentials, circumvent security controls, manipulate transaction records, interfere with the operation of financial systems, attack the FraudShield infrastructure, introduce malicious software, attempt unauthorized database access, intentionally corrupt analytical results, abuse analyst functionality, harvest information without authorization, use the system to facilitate phishing, use the system to facilitate social engineering, submit credentials belonging to another person without authorization, use the system for unlawful surveillance, or use the system for unlawful profiling.</p>

          <h3>33. No Unauthorized Access</h3>
          <p>You may not attempt to access another user's information, restricted analyst information, administrative interfaces, databases, internal APIs, infrastructure, secrets, credentials, or system logs unless you are explicitly authorized to do so.</p>

          <h3>34. No Circumvention</h3>
          <p>You may not attempt to bypass authentication controls, authorization controls, rate limits, validation, application security controls, database permissions, analyst permissions, or system restrictions.</p>

          <h3>35. Responsible Security Research</h3>
          <p>Authorized security testing and research may be permitted where explicitly approved by the system owner. Researchers should obtain appropriate authorization, avoid accessing unrelated data, avoid disrupting services, avoid destroying information, minimize collection of personal information, and responsibly disclose security vulnerabilities. Unauthorized security testing may violate these Terms.</p>

          <h3>36. Demonstration Environment</h3>
          <p>FraudShield may include a demonstration or testing environment. Demonstration environments may contain synthetic users, synthetic devices, synthetic recipients, synthetic transactions, simulated interaction data, deterministic test identifiers, and simulated risk events. Such environments are not intended to represent real banking infrastructure. Do not enter real banking credentials or confidential financial secrets into a demonstration environment.</p>

          <h3>37. No Guarantee of Financial Outcome</h3>
          <p>FraudShield does not guarantee that a transaction is legitimate, that a transaction is fraudulent, that money will be recovered, that fraud will be prevented, that a financial institution will approve or reject a transaction, that a risk score will always be correct, or that every attack will be detected. FraudShield provides analytical information and risk intelligence. Users remain responsible for appropriate decisions and actions.</p>

          <h3>38. No Automatic Financial Authorization</h3>
          <p>Unless a separate authorized integration explicitly provides such functionality, FraudShield does not independently authorize or execute financial transactions. A risk assessment should not be interpreted as payment authorization.</p>

          <h3>39. Risk Scores Are Not Proof</h3>
          <p>A risk score is an analytical output. It is not a legal determination, a criminal accusation, proof of fraud, proof of malicious intent, proof of identity, or proof of financial wrongdoing. Risk scores should be interpreted together with the underlying evidence and appropriate human judgment.</p>

          <h3>40. Human Review</h3>
          <p>Where FraudShield is used by an institution or organization, authorized personnel may review risk events. Human reviewers may consider transaction context, device information, recipient information, historical behavior, rule signals, ML signals, NLP signals, and other available evidence. Human reviewers should not treat automated results as infallible.</p>

          <h3>41. False Positives and False Negatives</h3>
          <p>FraudShield may occasionally classify legitimate activity as suspicious (false positive). FraudShield may also fail to identify fraudulent activity (false negative). Users should consider these limitations when relying on system results. Where possible, analyst feedback should be used to identify and understand such cases.</p>

          <h3>42. Responsible AI</h3>
          <p>FraudShield is designed around explainable and human-oriented risk intelligence. The system should not be treated as an autonomous authority over a person's financial behavior. Where machine-learning or natural-language-processing components are used: outputs may contain uncertainty, models may have limitations, model performance may vary, inputs may influence results, and unusual cases may not be correctly classified. Where applicable, authorized humans should remain responsible for consequential decisions.</p>

          <h3>43. System Availability</h3>
          <p>FraudShield may occasionally be unavailable because of maintenance, software updates, database failures, infrastructure failures, network failures, security incidents, configuration changes, or unexpected technical problems. No uninterrupted availability is guaranteed.</p>

          <h3>44. System Modifications</h3>
          <p>FraudShield may be modified, updated, improved, replaced, or temporarily disabled. Changes may include new analytical capabilities, new risk rules, model updates, UI improvements, security improvements, infrastructure changes, API changes, and bug fixes. Material changes may require updates to this Policy or applicable documentation.</p>

          <h3>45. Intellectual Property</h3>
          <p>Unless otherwise stated, the FraudShield software, branding, interface design, documentation, source code, architecture, analytical methodologies, and related materials may be protected by applicable intellectual-property laws. You may not reproduce, redistribute, sell, sublicense, or commercially exploit protected FraudShield materials without appropriate authorization. Nothing in these Terms transfers ownership of FraudShield intellectual property to the user.</p>

          <h3>46. User-Submitted Content</h3>
          <p>Where the platform permits users to submit information for analysis, the user retains whatever rights they already possess in that information, subject to applicable law and the rights necessary for FraudShield to provide the requested functionality. By submitting information, you represent that you have the appropriate authorization to submit and process that information through FraudShield.</p>

          <h3>47. Security of Submitted Information</h3>
          <p>Although FraudShield is designed with security and privacy in mind, no online system can guarantee absolute protection against every possible attack. Users should therefore avoid submitting information that is unnecessary for the intended analysis.</p>

          <h3>48. Third-Party Integrations</h3>
          <p>FraudShield may eventually integrate with external systems such as payment providers, financial institutions, identity systems, authentication systems, monitoring systems, and infrastructure providers. Third-party services may be subject to separate terms and privacy policies. FraudShield is not responsible for the independent policies or practices of third-party services except to the extent required by applicable law.</p>

          <h3>49. Suspension or Termination</h3>
          <p>Access to FraudShield may be suspended or terminated where necessary to prevent abuse, protect users, protect the platform, investigate security incidents, comply with legal obligations, enforce these Terms, or prevent unauthorized access. Where appropriate and reasonably possible, users may be informed of significant access restrictions.</p>

          <h3>50. Disclaimer of Warranties</h3>
          <p>To the maximum extent permitted by applicable law, FraudShield is provided on an "as available" basis. No representation is made that the system will always be available, every fraudulent transaction will be detected, every legitimate transaction will be correctly classified, every analytical result will be accurate, every risk event will be identified, the system will be free from defects, or the system will satisfy every specific operational requirement.</p>

          <h3>51. Limitation of Liability</h3>
          <p>To the maximum extent permitted by applicable law, FraudShield and its operators, developers, contributors, or associated parties should not be held responsible for losses resulting solely from reliance on an automated risk assessment without appropriate human or institutional review. Users and organizations deploying FraudShield are responsible for determining how risk assessments should be incorporated into their operational processes. Nothing in these Terms is intended to exclude liability that cannot legally be excluded.</p>

          <h3>52. Financial Decision Disclaimer</h3>
          <p>FraudShield is not a substitute for a bank's fraud department, a payment network, a regulated financial institution, legal advice, financial advice, professional security investigation, or law-enforcement investigation. The system provides analytical assistance.</p>

          <h3>53. Emergency and High-Risk Situations</h3>
          <p>If a user believes that an account, payment instrument, or financial transaction is actively compromised, the user should contact the relevant financial institution or authorized security provider immediately. FraudShield should not be considered an emergency financial-response service.</p>

          <h3>54. Responsible Use of Fraud Intelligence</h3>
          <p>Fraud intelligence must be used responsibly. Users should not use FraudShield results to harass individuals, discriminate unlawfully, make unsupported accusations, publish private information, retaliate against suspected individuals, conduct unauthorized surveillance, or make consequential decisions without appropriate review. Risk intelligence should be treated as evidence requiring context, not as a definitive judgment about a person.</p>

          <h3>55. Accuracy of User Information</h3>
          <p>Where a user provides information to FraudShield, the user should make reasonable efforts to provide accurate and relevant information. Submitting deliberately misleading information may result in unreliable analysis.</p>

          <h3>56. Changes to the Terms</h3>
          <p>These Terms may be updated as FraudShield evolves. The updated version will become applicable from the effective date indicated in the revised Terms, subject to applicable law.</p>

          <h3>57. Governing Law</h3>
          <p>The interpretation and enforcement of these Terms should be governed by the laws applicable to the entity operating the relevant FraudShield deployment and the jurisdiction in which that deployment is provided, subject to applicable law. For a production deployment, the operator should replace this general clause with the specific governing law and jurisdiction applicable to the organization.</p>

          <h3>58. Contact</h3>
          <p>Questions regarding FraudShield's privacy practices, data processing, security, or these Terms should be directed to the organization operating the relevant FraudShield deployment. For the official FraudShield deployment, the appropriate contact information should be displayed within the application's Privacy, Terms, or Contact section.</p>

          <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl my-8">
            <h3 className="text-orange-400 mt-0">59. Important Notice for Demonstration Users</h3>
            <p className="text-orange-200 mb-0 text-sm">
              If you are using a FraudShield demonstration or hackathon environment: Please use synthetic or non-sensitive information. Do not enter real UPI PINs, OTPs, passwords, card numbers, CVVs, banking credentials, private keys, authentication tokens, confidential documents, or unnecessary personally identifiable information. Demonstration results are intended to demonstrate the FraudShield risk-analysis architecture and should not be interpreted as real banking decisions.
            </p>
          </div>

          <h3>60. FraudShield's Responsible-Intelligence Commitment</h3>
          <p>FraudShield is built around a simple principle: <strong>Security should not require sacrificing explainability or privacy.</strong></p>
          <p>The platform is intended to combine multiple signals—transaction behavior, device context, recipient familiarity, rule-based analysis, machine-learning analysis, and social-engineering intelligence—to help identify potentially suspicious activity. Where possible, FraudShield should explain why an event received a particular risk assessment rather than simply producing an opaque score.</p>
          <p>The objective is not to automatically accuse users or block legitimate activity. The objective is to provide timely, understandable intelligence that helps users and authorized institutions make better-informed security decisions.</p>
          <p className="font-mono text-sm text-emerald-400 font-semibold p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
            Security + Privacy + Explainability + Human Oversight + Responsible AI.
          </p>

          <h3>61. Entire Agreement</h3>
          <p>This Privacy Policy and Terms of Service constitute the general terms governing the use of FraudShield unless a separate written agreement, institutional policy, enterprise agreement, or deployment-specific policy supersedes or supplements them. Where a deployment-specific agreement conflicts with this document, the applicable legally binding agreement may control to the extent permitted by law.</p>

          <h3>62. Acknowledgement</h3>
          <p>By continuing to use FraudShield, you acknowledge that:</p>
          <ul>
            <li>FraudShield provides risk intelligence rather than certainty;</li>
            <li>automated analysis may contain errors;</li>
            <li>risk scores are not proof of fraud;</li>
            <li>human review may be necessary for consequential decisions;</li>
            <li>you should not submit unnecessary sensitive information;</li>
            <li>demonstration environments should use synthetic or non-sensitive information;</li>
            <li>you are responsible for using the platform lawfully and responsibly;</li>
            <li>no security system can guarantee complete protection against fraud;</li>
            <li>the privacy and security practices of a particular FraudShield deployment may depend on its configuration and operator.</li>
          </ul>
          
          <div className="text-center py-10 mt-10 border-t border-white/10">
            <p className="text-xl text-white font-medium">
              FraudShield is designed to help detect risk—not to replace human judgment.
            </p>
          </div>
          
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
