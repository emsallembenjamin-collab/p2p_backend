const EVM_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function normalizeWalletAddress(address) {
  if (typeof address !== 'string') {
    throw new TypeError('Wallet address must be a string');
  }

  const normalizedAddress = address.trim();
  if (!EVM_ADDRESS_PATTERN.test(normalizedAddress)) {
    throw new TypeError('Wallet address must be a valid EVM address');
  }

  return normalizedAddress;
}

function walletQrFileName(address) {
  return `${normalizeWalletAddress(address).toLowerCase()}.svg`;
}

module.exports = {
  EVM_ADDRESS_PATTERN,
  normalizeWalletAddress,
  walletQrFileName,
};
