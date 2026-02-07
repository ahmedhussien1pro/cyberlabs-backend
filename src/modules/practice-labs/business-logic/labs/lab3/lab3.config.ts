export const Lab3Config = {
  labSlug: 'bl-vuln-lab3',
  description:
    'Business Logic - Bypass multi-step workflow to access restricted features',

  initialState: {
    users: [
      {
        username: 'user',
        email: 'user@test.com',
        role: 'USER',
        password: 'user123',
      },
    ],
  },

  objective:
    'Bypass verification workflow to access premium features without completing steps',
  flagCondition: 'workflow_bypass_success',
  requiredSteps: ['email_verify', 'phone_verify', 'identity_verify'],
};
