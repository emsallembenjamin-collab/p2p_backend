const QRCode = require('qrcode');
const { mkdir } = require('node:fs/promises');
const path = require('path');
const { KYCStatus } = require('../controllers/constant');
const User = require('../models/user');
const { normalizeWalletAddress, walletQrFileName } = require('./walletAddress');

const outputDirectory = path.join(__dirname, '../public/qrcode');

exports.generateQRcodeOfWallet = async (address) => {
    const normalizedAddress = normalizeWalletAddress(address);
    const outputPath = path.join(outputDirectory, walletQrFileName(normalizedAddress));

    await mkdir(outputDirectory, { recursive: true });
    await QRCode.toFile(outputPath, normalizedAddress, {
        errorCorrectionLevel: 'H',
        type: 'svg',
    });

    return outputPath;
};

exports.generateAllQrcode = async (req, res, next) => {
    try {
        const tradingAccounts = await User.find({
            verification_status: KYCStatus.APPROVED,
        });
        const results = await Promise.allSettled(
            tradingAccounts.map((account) => (
                exports.generateQRcodeOfWallet(account.ethAddress)
            )),
        );
        const generated = results.filter((result) => result.status === 'fulfilled').length;

        return res.status(200).send({
            generated,
            failed: results.length - generated,
            total: results.length,
        });
    } catch (error) {
        return next(error);
    }
};
