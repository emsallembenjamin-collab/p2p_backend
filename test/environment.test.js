const assert = require('node:assert/strict');
const test = require('node:test');

const {
  DEFAULT_PORT,
  DEFAULT_SESSION_MAX_AGE_MS,
  loadEnvironment,
} = require('../config/environment');

const requiredEnvironment = {
  DB_URL: 'mongodb://localhost:27017',
  DB_NAME: 'p2p_test',
  SESSION_SECRET: 'test-only-secret',
};

test('loadEnvironment applies safe development defaults', () => {
  const configuration = loadEnvironment(requiredEnvironment);

  assert.equal(configuration.nodeEnvironment, 'development');
  assert.equal(configuration.isProduction, false);
  assert.equal(configuration.port, DEFAULT_PORT);
  assert.equal(configuration.sessionMaxAgeMs, DEFAULT_SESSION_MAX_AGE_MS);
  assert.equal(configuration.trustProxy, false);
});

test('loadEnvironment normalizes values supplied as strings', () => {
  const configuration = loadEnvironment({
    ...requiredEnvironment,
    NODE_ENV: 'production',
    PORT: '3000',
    DB_URL: 'mongodb://database:27017/',
    SESSION_MAX_AGE_MS: '60000',
    TRUST_PROXY: 'true',
  });

  assert.equal(configuration.isProduction, true);
  assert.equal(configuration.port, 3000);
  assert.equal(configuration.databaseUrl, 'mongodb://database:27017');
  assert.equal(configuration.sessionMaxAgeMs, 60000);
  assert.equal(configuration.trustProxy, true);
});

test('loadEnvironment reports each missing required setting', () => {
  for (const name of ['DB_URL', 'DB_NAME', 'SESSION_SECRET']) {
    const environment = { ...requiredEnvironment };
    delete environment[name];

    assert.throws(
      () => loadEnvironment(environment),
      new RegExp(`Missing required environment variable: ${name}`),
    );
  }
});

test('loadEnvironment rejects invalid numbers and booleans', () => {
  assert.throws(
    () => loadEnvironment({ ...requiredEnvironment, PORT: 'not-a-number' }),
    /PORT must be a positive integer/,
  );
  assert.throws(
    () => loadEnvironment({ ...requiredEnvironment, SESSION_MAX_AGE_MS: '-1' }),
    /SESSION_MAX_AGE_MS must be a positive integer/,
  );
  assert.throws(
    () => loadEnvironment({ ...requiredEnvironment, TRUST_PROXY: 'yes' }),
    /TRUST_PROXY must be either true or false/,
  );
});

test('loadEnvironment returns an immutable configuration object', () => {
  const configuration = loadEnvironment(requiredEnvironment);

  assert.equal(Object.isFrozen(configuration), true);
});
