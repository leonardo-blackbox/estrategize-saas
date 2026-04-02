const IS_PROD = process.env.NODE_ENV === 'production';

function formatMessage(level: string, msg: string, ...args: unknown[]): string {
  const ts = new Date().toISOString();
  const extra =
    args.length > 0
      ? ' ' +
        args
          .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
          .join(' ')
      : '';
  return `[${ts}] ${level.toUpperCase()} ${msg}${extra}`;
}

export const logger = {
  info: (msg: string, ...args: unknown[]) => {
    console.log(formatMessage('info', msg, ...args));
  },
  warn: (msg: string, ...args: unknown[]) => {
    console.warn(formatMessage('warn', msg, ...args));
  },
  error: (msg: string, ...args: unknown[]) => {
    console.error(formatMessage('error', msg, ...args));
  },
  debug: (msg: string, ...args: unknown[]) => {
    if (!IS_PROD) console.log(formatMessage('debug', msg, ...args));
  },
};
