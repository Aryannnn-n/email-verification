import net from 'node:net';

const SMTP_PORT = 25;
const SMTP_TIMEOUT = 10000;
const SENDER_EMAIL = 'verify@emailchecker.dev';

// Wait and read the next SMTP response message from the server socket
const readResponse = (socket, timeout = SMTP_TIMEOUT) => {
  return new Promise((resolve, reject) => {
    let data = '';
    const timer = setTimeout(() => {
      reject(new Error('smtp_timeout'));
    }, timeout);

    const onData = (chunk) => {
      data += chunk.toString();
      const lines = data.split('\r\n').filter(Boolean);
      const lastLine = lines[lines.length - 1];

      // SMTP response lines end with a 3-digit code followed by a space
      if (lastLine && /^\d{3}\s/.test(lastLine)) {
        clearTimeout(timer);
        socket.removeListener('data', onData);
        const code = parseInt(lastLine.substring(0, 3), 10);
        resolve({ code, message: data.trim() });
      }
    };

    socket.on('data', onData);
    socket.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
};

// Send a line of text to the SMTP server and await response
const sendCommand = (socket, command) => {
  return new Promise((resolve, reject) => {
    socket.write(`${command}\r\n`, (err) => {
      if (err) return reject(err);
      readResponse(socket).then(resolve).catch(reject);
    });
  });
};

// Main SMTP verification routine
export const checkMailbox = async (email, mxHost) => {
  let socket = null;

  try {
    // Open standard raw TCP socket connection
    socket = await new Promise((resolve, reject) => {
      const sock = net.createConnection({ host: mxHost, port: SMTP_PORT, timeout: SMTP_TIMEOUT });
      sock.once('connect', () => resolve(sock));
      sock.once('error', (err) => reject(err));
      sock.once('timeout', () => {
        sock.destroy();
        reject(new Error('connection_timeout'));
      });
    });

    // Read the server welcome banner
    const greeting = await readResponse(socket);
    if (greeting.code !== 220) {
      return {
        exists: null,
        smtpCode: greeting.code,
        smtpMessage: greeting.message,
        error: 'unexpected_greeting',
      };
    }

    // Identify ourselves with EHLO
    const ehlo = await sendCommand(socket, `EHLO emailchecker.dev`);
    if (ehlo.code !== 250) {
      // Try older HELO standard if EHLO fails
      const helo = await sendCommand(socket, `HELO emailchecker.dev`);
      if (helo.code !== 250) {
        return {
          exists: null,
          smtpCode: helo.code,
          smtpMessage: helo.message,
          error: 'helo_rejected',
        };
      }
    }

    // Set mock sender email
    const mailFrom = await sendCommand(socket, `MAIL FROM:<${SENDER_EMAIL}>`);
    if (mailFrom.code !== 250) {
      return {
        exists: null,
        smtpCode: mailFrom.code,
        smtpMessage: mailFrom.message,
        error: 'mail_from_rejected',
      };
    }

    // Query recipient mailbox using RCPT TO
    const rcptTo = await sendCommand(socket, `RCPT TO:<${email}>`);

    // Clean connection close
    try {
      await sendCommand(socket, 'QUIT');
    } catch {
      // Safe to ignore if server hangs up early
    }

    // 250 and 251 codes mean target mailbox exists
    if (rcptTo.code === 250 || rcptTo.code === 251) {
      return {
        exists: true,
        smtpCode: rcptTo.code,
        smtpMessage: rcptTo.message,
        error: null,
      };
    }

    // 550, 551, 553 mean address is definitely invalid/rejected
    if (rcptTo.code === 550 || rcptTo.code === 551 || rcptTo.code === 553) {
      return {
        exists: false,
        smtpCode: rcptTo.code,
        smtpMessage: rcptTo.message,
        error: null,
      };
    }

    // 450 to 452 mean server temporary rate limit / greylisting
    if (rcptTo.code >= 450 && rcptTo.code <= 452) {
      return {
        exists: null,
        smtpCode: rcptTo.code,
        smtpMessage: rcptTo.message,
        error: 'greylisted',
      };
    }

    return {
      exists: null,
      smtpCode: rcptTo.code,
      smtpMessage: rcptTo.message,
      error: `smtp_code_${rcptTo.code}`,
    };
  } catch (err) {
    const errorMessage = err.message || 'unknown_error';
    if (errorMessage.includes('timeout')) {
      return { exists: null, smtpCode: null, smtpMessage: '', error: 'connection_timeout' };
    }
    if (err.code === 'ECONNREFUSED') {
      return { exists: null, smtpCode: null, smtpMessage: '', error: 'connection_refused' };
    }
    if (err.code === 'ECONNRESET') {
      return { exists: null, smtpCode: null, smtpMessage: '', error: 'connection_reset' };
    }
    return { exists: null, smtpCode: null, smtpMessage: '', error: errorMessage };
  } finally {
    if (socket && !socket.destroyed) {
      socket.destroy();
    }
  }
};
