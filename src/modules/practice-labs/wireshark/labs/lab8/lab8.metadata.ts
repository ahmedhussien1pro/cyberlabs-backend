// src/modules/practice-labs/wireshark/labs/lab8/lab8.metadata.ts
export const LAB8_METADATA = {
  id:          'wireshark-lab8',
  slug:        'wireshark-webshell-upload',
  title:       'Wireshark: Web Shell Upload Detection',
  description: 'A compromised web server triggered an IDS alert. Investigate the HTTP capture, find the malicious PHP web shell upload POST request, decode the hex-encoded flag from the shell content, then submit.',
  difficulty:  'ADVANCED',
  category:    'NETWORK_SECURITY',
  estimatedMinutes: 40,
  points:      450,
  topics: [
    'HTTP POST analysis',
    'Multipart form-data inspection',
    'Content-Type spoofing detection',
    'PHP web shell identification',
    'Hex encoding / decoding',
    'Post-exploitation traffic patterns',
  ],
  learningOutcomes: [
    'Filter and analyze HTTP POST requests in Wireshark',
    'Identify malicious file uploads via Content-Type vs extension mismatch',
    'Extract and decode obfuscated payloads from packet bodies',
    'Trace attacker IP, uploaded shell path, and RCE execution',
    'Understand unrestricted file upload vulnerability and defenses',
  ],
  hints: [
    { id: 1, cost: 10, text: 'Filter: http.request.method == "POST" — find the suspicious POST with a .php filename' },
    { id: 2, cost: 20, text: 'The attacker spoofed Content-Type as image/jpeg but the filename ends in .php. Expand the packet body.' },
    { id: 3, cost: 30, text: 'Find the HIDDEN comment in the PHP shell code. The value after it is hex-encoded. Paste it in the Hex Decoder.' },
  ],
};
