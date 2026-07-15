const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AuthorizationError,
  copyIdentityClaims,
  extractBearerToken,
  sendAuthorizationError,
} = require('../utils/authorization');

test('extractBearerToken accepts standard Bearer headers', () => {
  assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(extractBearerToken('bearer token-value'), 'token-value');
  assert.equal(extractBearerToken('  Bearer   token-value  '), 'token-value');
});

test('extractBearerToken keeps compatibility with raw tokens', () => {
  assert.equal(extractBearerToken('abc.def.ghi'), 'abc.def.ghi');
});

test('extractBearerToken rejects missing headers', () => {
  for (const header of [undefined, null, '', '   ']) {
    assert.throws(
      () => extractBearerToken(header),
      (error) => error instanceof AuthorizationError
        && error.message === 'Authorization header is required',
    );
  }
});

test('extractBearerToken rejects unsupported schemes and extra fields', () => {
  for (const header of ['Basic credentials', 'Token value', 'Bearer a b']) {
    assert.throws(
      () => extractBearerToken(header),
      /Authorization header must use the Bearer scheme/,
    );
  }
});

test('copyIdentityClaims attaches only known identity fields', () => {
  const request = {};

  copyIdentityClaims(request, {
    email: 'user@example.test',
    accountUuid: 'account-1',
    isEmailVerified: true,
    _id: 'database-id',
    password: 'must-not-be-copied',
  });

  assert.deepEqual(request, {
    email: 'user@example.test',
    accountUuid: 'account-1',
    isEmailVerified: true,
    _id: 'database-id',
  });
});

test('copyIdentityClaims rejects malformed payloads', () => {
  for (const payload of [undefined, null, 'payload']) {
    assert.throws(
      () => copyIdentityClaims({}, payload),
      /Token payload is invalid/,
    );
  }
});

test('sendAuthorizationError preserves safe authorization messages', () => {
  const calls = [];
  const response = {
    status(code) {
      calls.push(['status', code]);
      return this;
    },
    send(body) {
      calls.push(['send', body]);
      return this;
    },
  };

  sendAuthorizationError(response, new AuthorizationError('Header is invalid'));

  assert.deepEqual(calls, [
    ['status', 401],
    ['send', { message: 'Header is invalid' }],
  ]);
});

test('sendAuthorizationError hides internal verification errors', () => {
  let responseBody;
  const response = {
    status(code) {
      assert.equal(code, 401);
      return this;
    },
    send(body) {
      responseBody = body;
      return this;
    },
  };

  sendAuthorizationError(response, new Error('secret verification detail'));

  assert.deepEqual(responseBody, {
    message: 'Authentication token is invalid or expired',
  });
});
