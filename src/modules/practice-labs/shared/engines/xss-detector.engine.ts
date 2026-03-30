// ─────────────────────────────────────────────────────────────────────────────
// XssDetectorEngine
// ─────────────────────────────────────────────────────────────────────────────
// Centralised XSS payload detection for all XSS lab services.
// Previously each lab had its own private isXSSPayload() — now unified here.
//
// Improvements over individual lab implementations:
//  - Added <body onload=  vector (missed in all labs)
//  - Added <input autofocus onfocus=  vector
//  - Added <select autofocus onfocus=  vector
//  - Added <video src=  / <audio src=  vectors
//  - Added data:text/html  vector
//  - Added expression()  (IE legacy, still tested in CTFs)
//  - Kept all original patterns intact (no regression)
// ─────────────────────────────────────────────────────────────────────────────

export type XssDetectionResult = {
  detected: boolean;
  matchedVector: string | null; // which pattern triggered (useful for logging)
  confidence: 'high' | 'medium'; // high = definite XSS, medium = likely
};

const HIGH_CONFIDENCE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: '<script> tag',           pattern: /<script[\s>]/i },
  { label: '</script> tag',          pattern: /<\/script>/i },
  { label: 'event handler attr',     pattern: /on\w+\s*=/i },      // onerror= onload= onclick= ...
  { label: 'javascript: URI',        pattern: /javascript:/i },
  { label: '<img> tag',              pattern: /<img[^>]*>/i },
  { label: '<svg> tag',              pattern: /<svg[\s>]/i },
  { label: '<iframe> tag',           pattern: /<iframe[\s>]/i },
  { label: '<details> tag',          pattern: /<details[\s>]/i },
  { label: '<object> tag',           pattern: /<object[\s>]/i },
  { label: '<embed> tag',            pattern: /<embed[\s>]/i },
  { label: '<body> tag',             pattern: /<body[\s>]/i },
  { label: '<video> tag',            pattern: /<video[\s>]/i },
  { label: '<audio> tag',            pattern: /<audio[\s>]/i },
  { label: '<input autofocus>',      pattern: /<input[^>]+autofocus/i },
  { label: '<select autofocus>',     pattern: /<select[^>]+autofocus/i },
  { label: '<form> tag',             pattern: /<form[\s>]/i },
];

const MEDIUM_CONFIDENCE_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'data: URI',             pattern: /data:text\/html/i },
  { label: 'expression() CSS',      pattern: /expression\s*\(/i },
  { label: 'vbscript: URI',         pattern: /vbscript:/i },
];

export class XssDetectorEngine {
  /**
   * Full detection — returns detailed result for logging and branching.
   */
  static detect(input: string): XssDetectionResult {
    if (!input || typeof input !== 'string') {
      return { detected: false, matchedVector: null, confidence: 'high' };
    }

    for (const { label, pattern } of HIGH_CONFIDENCE_PATTERNS) {
      if (pattern.test(input)) {
        return { detected: true, matchedVector: label, confidence: 'high' };
      }
    }

    for (const { label, pattern } of MEDIUM_CONFIDENCE_PATTERNS) {
      if (pattern.test(input)) {
        return { detected: true, matchedVector: label, confidence: 'medium' };
      }
    }

    return { detected: false, matchedVector: null, confidence: 'high' };
  }

  /**
   * Simple boolean helper — drop-in replacement for the old isXSSPayload().
   */
  static isPayload(input: string): boolean {
    return XssDetectorEngine.detect(input).detected;
  }
}
