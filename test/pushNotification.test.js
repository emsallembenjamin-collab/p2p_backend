const assert = require('node:assert/strict');
const test = require('node:test');

const { buildPushMessage } = require('../utils/pushNotification');

test('buildPushMessage creates the Firebase payload', () => {
  const result = buildPushMessage(' device-token ', {
    title: ' Trade complete ',
    body: ' Your order was filled. ',
  });

  assert.deepEqual(result, {
    notification: {
      title: 'Trade complete',
      body: 'Your order was filled.',
    },
    token: 'device-token',
  });
});

test('buildPushMessage includes supported optional fields', () => {
  const result = buildPushMessage('device-token', {
    title: 'Identity approved',
    body: 'You can now create orders.',
    imageUrl: 'https://example.test/approved.png',
    data: { destination: 'profile' },
  });

  assert.equal(
    result.notification.imageUrl,
    'https://example.test/approved.png',
  );
  assert.deepEqual(result.data, { destination: 'profile' });
});

test('buildPushMessage rejects an invalid device token', () => {
  for (const token of [undefined, null, '', '   ', 42]) {
    assert.throws(
      () => buildPushMessage(token, { title: 'Title', body: 'Body' }),
      /token must be a non-empty string/,
    );
  }
});

test('buildPushMessage rejects incomplete notification content', () => {
  assert.throws(
    () => buildPushMessage('token'),
    /notification must be an object/,
  );
  assert.throws(
    () => buildPushMessage('token', { body: 'Body' }),
    /notification.title must be a non-empty string/,
  );
  assert.throws(
    () => buildPushMessage('token', { title: 'Title' }),
    /notification.body must be a non-empty string/,
  );
});

test('buildPushMessage validates optional data', () => {
  assert.throws(
    () => buildPushMessage('token', {
      title: 'Title',
      body: 'Body',
      data: 'profile',
    }),
    /notification.data must be an object/,
  );
});
