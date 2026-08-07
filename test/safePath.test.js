const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const {
  UnsafePathError,
  resolveDownloadPath,
  validateFileName,
} = require('../utils/safePath');

test('validateFileName accepts a single ordinary file name', () => {
  assert.equal(validateFileName('identity-document.pdf'), 'identity-document.pdf');
  assert.equal(validateFileName('report_2026-08.csv'), 'report_2026-08.csv');
});

test('validateFileName rejects empty names', () => {
  for (const value of [undefined, null, '', '   ', 12]) {
    assert.throws(
      () => validateFileName(value),
      (error) => error instanceof UnsafePathError
        && error.message === 'A file name is required',
    );
  }
});

test('validateFileName rejects parent directory references', () => {
  for (const value of ['.', '..', '../secret.txt', '..\\secret.txt']) {
    assert.throws(() => validateFileName(value), UnsafePathError);
  }
});

test('validateFileName rejects nested paths on every platform', () => {
  for (const value of ['folder/file.txt', 'folder\\file.txt', '/absolute.txt']) {
    assert.throws(
      () => validateFileName(value),
      /Nested paths are not allowed/,
    );
  }
});

test('validateFileName rejects confusing surrounding whitespace', () => {
  assert.throws(
    () => validateFileName(' report.csv'),
    /cannot start or end with whitespace/,
  );
  assert.throws(
    () => validateFileName('report.csv '),
    /cannot start or end with whitespace/,
  );
});

test('resolveDownloadPath returns a path below the configured root', () => {
  const root = path.join('var', 'application', 'uploads');
  const result = resolveDownloadPath(root, 'report.csv');

  assert.equal(result, path.resolve(root, 'report.csv'));
  assert.equal(result.startsWith(`${path.resolve(root)}${path.sep}`), true);
});

test('UnsafePathError is suitable for HTTP error handling', () => {
  const error = new UnsafePathError('Invalid download');

  assert.equal(error.name, 'UnsafePathError');
  assert.equal(error.statusCode, 400);
  assert.equal(error.message, 'Invalid download');
});
