// src/modules/practice-labs/wireshark/labs/lab7/lab7.metadata.ts
export const LAB7_METADATA = {
  id:          'wireshark-lab7',
  slug:        'wireshark-c2-beacon',
  title:       'Wireshark: C2 Beacon Detection',
  description: 'An EDR alert flagged periodic outbound connections from an internal workstation. Investigate the capture, identify the beacon interval, find the C2 server IP, extract the beacon signature, then submit the flag.',
  difficulty:  'ADVANCED',
  category:    'NETWORK_ANALYSIS',
  estimatedMinutes: 35,
  points:      400,
  topics: [
    'C2 beacon analysis',
    'TCP SYN pattern detection',
    'Beacon interval calculation',
    'Malware traffic signatures',
    'Wireshark statistics (IO Graph)',
  ],
  learningOutcomes: [
    'Identify periodic TCP SYN patterns indicative of C2 beaconing',
    'Calculate beacon interval from packet timestamps',
    'Extract C2 server IP and port from network captures',
    'Recognize common C2 ports (4444, 8080, 443)',
    'Understand how defenders detect beaconing via jitter analysis',
  ],
  hints: [
    { id: 1, cost: 10, text: 'Filter TCP traffic and look for the same destination IP appearing at regular time intervals' },
    { id: 2, cost: 20, text: 'Use tcp.flags.syn == 1 && tcp.flags.ack == 0 to isolate outbound connection initiations' },
    { id: 3, cost: 30, text: 'The beacon interval is exactly 60 seconds. Check the time difference between packet #10 and #12.' },
  ],
};
