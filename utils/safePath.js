const path = require('node:path');

class UnsafePathError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnsafePathError';
    this.statusCode = 400;
  }
}

function validateFileName(fileName) {
  if (typeof fileName !== 'string' || fileName.trim() === '') {
    throw new UnsafePathError('A file name is required');
  }

  if (fileName !== fileName.trim()) {
    throw new UnsafePathError('File names cannot start or end with whitespace');
  }

  if (fileName === '.' || fileName === '..') {
    throw new UnsafePathError('Directory references are not allowed');
  }

  if (fileName.includes('/') || fileName.includes('\\')) {
    throw new UnsafePathError('Nested paths are not allowed');
  }

  if (path.basename(fileName) !== fileName) {
    throw new UnsafePathError('The supplied file name is invalid');
  }

  return fileName;
}

function resolveDownloadPath(rootDirectory, fileName) {
  const safeFileName = validateFileName(fileName);
  const root = path.resolve(rootDirectory);
  const resolvedPath = path.resolve(root, safeFileName);
  const expectedPrefix = `${root}${path.sep}`;

  if (!resolvedPath.startsWith(expectedPrefix)) {
    throw new UnsafePathError('The requested file is outside the download directory');
  }

  return resolvedPath;
}

module.exports = {
  UnsafePathError,
  resolveDownloadPath,
  validateFileName,
};
