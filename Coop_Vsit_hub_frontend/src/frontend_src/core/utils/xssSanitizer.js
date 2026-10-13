/**
 * Enterprise Input Sanitization & XSS Protection Utilities.
 * Cleans user inputs in real-time to prevent injection attacks and format text consistently.
 */

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes potentially dangerous HTML/XML characters.
 * @param {string} str - Raw input string.
 * @returns {string} - Escaped string safe for rendering.
 */
export const escapeHtml = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'/]/g, (match) => HTML_ESCAPE_MAP[match] || match);
};

/**
 * Strips script tags, iframe tags, and javascript: event attributes.
 * @param {string} value - Raw input.
 * @returns {string} - Sanitized string.
 */
export const sanitizeInput = (value) => {
  if (!value || typeof value !== 'string') return value;

  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove <script>...</script>
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove <iframe>...</iframe>
    .replace(/javascript:[^"']*/gi, '') // Remove javascript: pseudo-protocol
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers (e.g. onclick="...")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '');
};

/**
 * Live sanitization for username/identifier inputs (allows alphanumeric, underscore, dot, @).
 * @param {string} value - Raw input.
 * @returns {string} - Sanitized username/email.
 */
export const sanitizeIdentifier = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9_.@\-]/g, '');
};

/**
 * Live sanitization for currency and numeric values.
 * @param {string} value - Raw input.
 * @returns {string} - Clean numeric/decimal value.
 */
export const sanitizeNumeric = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1');
};

export default {
  escapeHtml,
  sanitizeInput,
  sanitizeIdentifier,
  sanitizeNumeric,
};
