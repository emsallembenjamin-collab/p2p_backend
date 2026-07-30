const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createPermissionMiddleware,
  hasPermission,
  includesPermission,
} = require('../utils/permissions');

const options = {
  superAdminRole: 'super-admin',
  getRole: async (id) => ({
    id,
    permissions: id === 'support' ? ['user:read', 'user:update'] : [],
  }),
};

test('includesPermission handles missing and malformed roles', () => {
  assert.equal(includesPermission(null, 'user:read'), false);
  assert.equal(includesPermission({}, 'user:read'), false);
  assert.equal(includesPermission({ permissions: 'user:read' }, 'user:read'), false);
});

test('includesPermission finds an exact permission', () => {
  const role = { permissions: ['user:read', 'user:update'] };

  assert.equal(includesPermission(role, 'user:read'), true);
  assert.equal(includesPermission(role, 'user'), false);
});

test('hasPermission always allows the super admin role', async () => {
  let roleLookupCalled = false;
  const allowed = await hasPermission(
    { role: 'super-admin' },
    'settings:update',
    {
      ...options,
      getRole: async () => {
        roleLookupCalled = true;
      },
    },
  );

  assert.equal(allowed, true);
  assert.equal(roleLookupCalled, false);
});

test('hasPermission denies missing admins and sub-roles', async () => {
  assert.equal(await hasPermission(null, 'user:read', options), false);
  assert.equal(await hasPermission({ role: 'admin' }, 'user:read', options), false);
});

test('hasPermission awaits the stored role permissions', async () => {
  assert.equal(
    await hasPermission({ role: 'admin', subRole: 'support' }, 'user:update', options),
    true,
  );
  assert.equal(
    await hasPermission({ role: 'admin', subRole: 'auditor' }, 'user:update', options),
    false,
  );
});

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
}

test('permission middleware continues for allowed admins', async () => {
  const middleware = createPermissionMiddleware('user:update', options);
  const response = createResponse();
  let nextCalled = false;

  await middleware(
    { admin: { role: 'admin', subRole: 'support' } },
    response,
    () => { nextCalled = true; },
  );

  assert.equal(nextCalled, true);
  assert.equal(response.statusCode, null);
});

test('permission middleware returns a useful forbidden response', async () => {
  const middleware = createPermissionMiddleware('settings:update', options);
  const response = createResponse();

  await middleware(
    { admin: { role: 'admin', subRole: 'support' } },
    response,
    () => assert.fail('next should not be called'),
  );

  assert.equal(response.statusCode, 403);
  assert.deepEqual(response.body, {
    error: 'Forbidden request',
    requiredPermission: 'settings:update',
  });
});

test('permission middleware forwards role lookup failures', async () => {
  const expectedError = new Error('database unavailable');
  const middleware = createPermissionMiddleware('user:read', {
    ...options,
    getRole: async () => { throw expectedError; },
  });
  let forwardedError;

  await middleware(
    { admin: { role: 'admin', subRole: 'support' } },
    createResponse(),
    (error) => { forwardedError = error; },
  );

  assert.equal(forwardedError, expectedError);
});
