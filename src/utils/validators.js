// Regex to validate basic email format
const EMAIL_REGEX = /^(?!\.)(?!.*\.\.)([a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*)@([a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*)\.([a-zA-Z]{2,})$/;

// Check email structure, lengths, and symbols
export const validateEmailSyntax = (email) => {
  if (email === null || email === undefined) {
    return { valid: false, reason: 'email_is_null' };
  }

  if (typeof email !== 'string') {
    return { valid: false, reason: 'email_is_not_string' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, reason: 'email_is_empty' };
  }

  if (trimmed.length > 254) {
    return { valid: false, reason: 'email_too_long' };
  }

  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) {
    return { valid: false, reason: 'missing_at_symbol' };
  }
  if (atCount > 1) {
    return { valid: false, reason: 'multiple_at_symbols' };
  }

  const [localPart, domain] = trimmed.split('@');

  if (!localPart || localPart.length === 0) {
    return { valid: false, reason: 'empty_local_part' };
  }

  if (localPart.length > 64) {
    return { valid: false, reason: 'local_part_too_long' };
  }

  if (!domain || domain.length === 0) {
    return { valid: false, reason: 'empty_domain' };
  }

  if (domain.length > 253) {
    return { valid: false, reason: 'domain_too_long' };
  }

  if (trimmed.includes('..')) {
    return { valid: false, reason: 'consecutive_dots' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return { valid: false, reason: 'invalid_local_part_dots' };
  }

  if (!domain.includes('.')) {
    return { valid: false, reason: 'domain_missing_tld' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, reason: 'invalid_format' };
  }

  return { valid: true, reason: null };
};

// Extract domain part from email
export const extractDomain = (email) => {
  if (!email || typeof email !== 'string') return null;
  const parts = email.trim().split('@');
  return parts.length === 2 ? parts[1].toLowerCase() : null;
};
