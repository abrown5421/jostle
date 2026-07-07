import { Box, Text } from '@inithium/ui';
import React from 'react';

interface PolicySection {
  title: string;
  variant?: 'h2' | 'h5';
  content: string[];
}

const comprehensivePolicyTemplate: PolicySection[] = [
  {
    title: '1. Information We Collect',
    content: [
      'Authentication Data: We utilize JSON Web Tokens (JWT) stored locally or via browser cookies to handle user authentication, establish user context, and manage stateful session persistence safely across lifecycle updates.',
      'Infrastructure Log Analytics: To guarantee reliability, uptime, and infrastructure safety, metadata associated with service requests arriving at our Application Programming Interface (API) is captured natively. These data streams may encompass network protocol details, client requests, response status indicators, and tracking timestamps.',
      'Voluntary Profile Submissions: Information provided willingly during operational usage—including email endpoints, configuration settings, or administrative parameters—is recorded within data stores to ensure intended multi-tenant separation.',
    ],
  },
  {
    title: '2. How We Utilize Your Data',
    content: [
      'To verify access privileges, process operations smoothly, and preserve system authentication states.',
      'To analyze platform performance patterns, isolate application exceptions, and protect runtime infrastructure against anomalous activities.',
      'To provide base-level configuration preferences specific to your tenant environment.',
    ],
  },
  {
    title: '3. Storage, Tracking, and Cookies',
    content: [
      'Our architectural design purposefully mitigates intrusive tracking. Client-side state engines (such as localStorage or document cookies) are reserved strictly for critical operational contexts—specifically authorization validations and session retention via JWT parameters.',
      'We do not engage in targeted marketing or cross-origin behavioral tracking across third-party networks.',
    ],
  },
  {
    title: '4. Third-Party Service Integrations',
    content: [
      'While this core system prioritizes secure internal boundaries, external cloud networks (e.g., database storage providers, monitoring agents, or container orchestration systems) process internal payloads to the extent necessary to run physical operations.',
      'We do not trade, sell, or rent user parameters to advertising aggregators.',
    ],
  },
  {
    title: '5. Security and Data Retention',
    content: [
      'Industrial-grade protections are deployed across our network architecture to maintain data integrity. However, no software ecosystem transmitting parameters over open networks is completely secure; consequently, complete assurance cannot be offered.',
      'Core records are maintained solely for the duration required to achieve authentication persistence, deliver boilerplate utility, or satisfy operational logging compliance directives.',
    ],
  },
  {
    title: '6. User Rights and Global Regulatory Disclosures',
    content: [
      'Users retain standard structural rights regarding their records, including the right to inspect, update, or purge historical information collections directly out of database states.',
      'Because this framework functions as an unconfigured boilerplate codebase, full alignment with specific regulatory specifications (such as GDPR or CCPA) requires downstream application owners to perform comprehensive audits on their unique deployment configurations.',
    ],
  },
];

const PrivacyPolicyPage: React.FC = () => {
  return (
    <Box
      color="surface" 
      padding="xl" 
      fullWidth={true}
      className="min-h-screen"
    >
      
        
        <Box flex direction="col" className="border-b border-surface3-contrast pb-8 mb-10">
          <Text color="primary" variant="h2" overrideClassName="mb-4 primary-font">
            Privacy Policy
          </Text>
          <Text color="surface3-contrast" variant="subtitle1" overrideClassName="opacity-70 mb-4">
            Last Modified: July 2026
          </Text>
        </Box>
        <Box className="space-y-8">
          {comprehensivePolicyTemplate.map((section, index) => (
            <Box key={index} flex direction='col' className='my-2 py-2'>
              <Text color="secondary" variant="h5">
                {section.title}
              </Text>
              
              {section.content.map((paragraph, pIndex) => (
                <Text 
                  key={pIndex} 
                  color="surface-contrast" 
                  variant="body" 
                  overrideClassName="mt-4"
                >
                  {paragraph}
                </Text>
              ))}
            </Box>
          ))}
        </Box>

      
    </Box>
  );
};

export default PrivacyPolicyPage;