import dns from 'node:dns';

// Lookup prioritized MX records for a domain.
// If the primary system resolver fails or is blocked, it falls back to public servers.
export const lookupMxRecords = async (domain) => {
  try {
    return await doLookup(domain);
  } catch (err) {
    // If the system DNS connection is refused or fails, try Google and Cloudflare DNS
    if (err.code === 'ECONNREFUSED' || err.code === 'ESERVFAIL') {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
        return await doLookup(domain);
      } catch (fallbackErr) {
        return formatError(fallbackErr);
      }
    }
    return formatError(err);
  }
};

// Actually fetch the records from DNS
const doLookup = async (domain) => {
  const mxRecords = await dns.promises.resolveMx(domain);

  if (!mxRecords || mxRecords.length === 0) {
    return {
      records: [],
      raw: [],
      error: 'no_mx_records',
    };
  }

  // Sort exchanges by priority (lower priority numbers are tried first)
  const sorted = mxRecords.sort((a, b) => a.priority - b.priority);

  return {
    records: sorted.map((r) => r.exchange),
    raw: sorted,
    error: null,
  };
};

// Turn DNS system errors into human readable tags
const formatError = (err) => {
  const errorMap = {
    ENOTFOUND: 'domain_not_found',
    ENODATA: 'no_mx_records',
    ETIMEOUT: 'dns_timeout',
    ESERVFAIL: 'dns_server_failure',
  };

  return {
    records: [],
    raw: [],
    error: errorMap[err.code] || `dns_error_${err.code || 'unknown'}`,
  };
};
