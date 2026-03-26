// src/modules/practice-labs/wireshark/labs/lab6/lab6.metadata.ts
export const LAB6_METADATA = {
  id:          'wireshark-lab6',
  slug:        'wireshark-sqli-hunt',
  title:       'Wireshark: SQLi Hunt via HTTP Traffic',
  description: 'A WAF flagged anomalous HTTP traffic. Investigate the capture, build the correct Wireshark display filter to isolate SQL injection attempts, identify the attacker IP and injected payload, then submit the flag.',
  difficulty:  'INTERMEDIATE',
  category:    'NETWORK_SECURITY',
  estimatedMinutes: 25,
  points:      300,
  topics: [
    'HTTP display filters',
    'SQL injection detection',
    'Error-based SQLi',
    'UNION-based SQLi',
    'Wireshark BPF vs Display filters',
  ],
  learningOutcomes: [
    'Build Wireshark display filters targeting http.request.uri',
    'Distinguish between BPF capture filters and display filters',
    'Identify SQLi attack patterns in HTTP traffic',
    'Correlate attacker IP with malicious HTTP requests',
    'Understand sqlmap automated attack signatures',
  ],
  hints: [
    { id: 1, cost: 10, text: 'Filter HTTP traffic first: click HTTP in the protocol filter bar' },
    { id: 2, cost: 20, text: 'Use display filter: http.request.uri contains "UNION" to isolate attack packets' },
    { id: 3, cost: 30, text: 'The attacker is using sqlmap. Look for the User-Agent header in flagged packets.' },
  ],
};
