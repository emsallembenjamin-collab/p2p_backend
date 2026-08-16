const assert = require('node:assert/strict');
const test = require('node:test');

const {
  EVM_ADDRESS_PATTERN,
  normalizeWalletAddress,
  walletQrFileName,
} = require('../utils/walletAddress');

const mixedCaseAddress = '0x55d398326f99059fF775485246999027B3197955';

test('EVM address pattern accepts exactly forty hexadecimal characters', () => {
  assert.equal(EVM_ADDRESS_PATTERN.test(mixedCaseAddress), true);
  assert.equal(EVM_ADDRESS_PATTERN.test('55d398326f99059fF775485246999027B3197955'), false);
  assert.equal(EVM_ADDRESS_PATTERN.test(`${mixedCaseAddress}00`), false);
  assert.equal(EVM_ADDRESS_PATTERN.test('0xnot-a-wallet-address'), false);
});

test('normalizeWalletAddress trims a valid address', () => {
  assert.equal(
    normalizeWalletAddress(`  ${mixedCaseAddress}  `),
    mixedCaseAddress,
  );
});

test('normalizeWalletAddress rejects non-string values', () => {
  for (const address of [undefined, null, 123, {}, []]) {
    assert.throws(
      () => normalizeWalletAddress(address),
      /Wallet address must be a string/,
    );
  }
});

test('normalizeWalletAddress rejects malformed strings', () => {
  for (const address of [
    '',
    '0x',
    '0x1234',
    '0xggd398326f99059fF775485246999027B3197955',
    '../wallet-address',
  ]) {
    assert.throws(
      () => normalizeWalletAddress(address),
      /Wallet address must be a valid EVM address/,
    );
  }
});

test('walletQrFileName creates a stable lowercase SVG file name', () => {
  assert.equal(
    walletQrFileName(mixedCaseAddress),
    '0x55d398326f99059ff775485246999027b3197955.svg',
  );
});

test('walletQrFileName validates its input before creating a path component', () => {
  assert.throws(
    () => walletQrFileName('../../secret'),
    /Wallet address must be a valid EVM address/,
  );
});
