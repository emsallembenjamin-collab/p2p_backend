const DEFAULT_PORT = 8080;
const DEFAULT_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readRequired(environment, name) {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readPositiveInteger(environment, name, fallback) {
  const rawValue = environment[name];

  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function readBoolean(environment, name, fallback = false) {
  const rawValue = environment[name];

  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }

  if (rawValue === 'true') return true;
  if (rawValue === 'false') return false;

  throw new Error(`${name} must be either true or false`);
}

function loadEnvironment(environment = process.env) {
  const nodeEnvironment = environment.NODE_ENV || 'development';

  return Object.freeze({
    nodeEnvironment,
    isProduction: nodeEnvironment === 'production',
    port: readPositiveInteger(environment, 'PORT', DEFAULT_PORT),
    databaseUrl: readRequired(environment, 'DB_URL').replace(/\/$/, ''),
    databaseName: readRequired(environment, 'DB_NAME'),
    sessionSecret: readRequired(environment, 'SESSION_SECRET'),
    sessionMaxAgeMs: readPositiveInteger(
      environment,
      'SESSION_MAX_AGE_MS',
      DEFAULT_SESSION_MAX_AGE_MS,
    ),
    trustProxy: readBoolean(environment, 'TRUST_PROXY'),
  });
}

module.exports = {
  DEFAULT_PORT,
  DEFAULT_SESSION_MAX_AGE_MS,
  loadEnvironment,
  readBoolean,
  readPositiveInteger,
  readRequired,
};
