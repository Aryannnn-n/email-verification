import { validateEmailSyntax, extractDomain } from './validators.js';
import { getDidYouMean } from './typoDetector.js';
import { lookupMxRecords } from './dnsLookup.js';
import { checkMailbox } from './smtpChecker.js';

const RESULT_CODES = {
  valid: 1,
  unknown: 3,
  invalid: 6,
};

// Orchestrates the syntax checking, typo check, DNS lookups, and SMTP mailbox verification.
export const verifyEmail = async (email) => {
  const startTime = Date.now();

  const buildResult = (overrides) => ({
    email: email ?? null,
    result: 'unknown',
    resultcode: RESULT_CODES.unknown,
    subresult: 'pending',
    domain: null,
    mxRecords: [],
    didyoumean: null,
    executiontime: parseFloat(((Date.now() - startTime) / 1000).toFixed(2)),
    error: null,
    timestamp: new Date().toISOString(),
    ...overrides,
  });

  // 1. Check for typo suggestions
  const typoResult = getDidYouMean(email);

  // 2. Syntax check
  const syntaxCheck = validateEmailSyntax(email);
  if (!syntaxCheck.valid) {
    if (typoResult.suggestion) {
      return buildResult({
        result: 'invalid',
        resultcode: RESULT_CODES.invalid,
        subresult: 'typo_detected',
        domain: typoResult.originalDomain,
        didyoumean: typoResult.suggestion,
        error: syntaxCheck.reason,
      });
    }

    return buildResult({
      result: 'invalid',
      resultcode: RESULT_CODES.invalid,
      subresult: syntaxCheck.reason,
      error: syntaxCheck.reason,
    });
  }

  const domain = extractDomain(email);

  if (typoResult.suggestion) {
    return buildResult({
      result: 'invalid',
      resultcode: RESULT_CODES.invalid,
      subresult: 'typo_detected',
      domain,
      didyoumean: typoResult.suggestion,
    });
  }

  // 3. DNS MX Query
  const mxResult = await lookupMxRecords(domain);
  if (mxResult.error) {
    return buildResult({
      result: mxResult.error === 'domain_not_found' ? 'invalid' : 'unknown',
      resultcode: mxResult.error === 'domain_not_found' ? RESULT_CODES.invalid : RESULT_CODES.unknown,
      subresult: mxResult.error,
      domain,
      error: mxResult.error,
    });
  }

  // 4. SMTP mail presence check
  let smtpResult = null;
  for (const mxHost of mxResult.records) {
    smtpResult = await checkMailbox(email, mxHost);
    if (smtpResult.exists === true || smtpResult.exists === false) {
      break;
    }
  }

  if (!smtpResult) {
    return buildResult({
      result: 'unknown',
      resultcode: RESULT_CODES.unknown,
      subresult: 'no_mx_servers_reachable',
      domain,
      mxRecords: mxResult.records,
      error: 'no_mx_servers_reachable',
    });
  }

  if (smtpResult.exists === true) {
    return buildResult({
      result: 'valid',
      resultcode: RESULT_CODES.valid,
      subresult: 'mailbox_exists',
      domain,
      mxRecords: mxResult.records,
    });
  }

  if (smtpResult.exists === false) {
    return buildResult({
      result: 'invalid',
      resultcode: RESULT_CODES.invalid,
      subresult: 'mailbox_does_not_exist',
      domain,
      mxRecords: mxResult.records,
    });
  }

  const subresult = smtpResult.error === 'greylisted'
    ? 'greylisted'
    : smtpResult.error?.includes('timeout')
      ? 'connection_timeout'
      : 'connection_error';

  return buildResult({
    result: 'unknown',
    resultcode: RESULT_CODES.unknown,
    subresult,
    domain,
    mxRecords: mxResult.records,
    error: smtpResult.error,
  });
};
