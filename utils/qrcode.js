const QRCode = require('qrcode');
const { Dir } = require('fs');
const path = require('path');
const { KYCStatus } = require('../controllers/constant');
const User = require('../models/user');

exports.generateQRcodeOfWallet = (address) => {
    const outputPath = path.join(__dirname, '../public/qrcode/', `${address}.svg`);

    QRCode.toFile(outputPath, address, {
        errorCorrectionLevel: 'H'
    }, function (err) {
        if (err) {
            console.error('Failed to save QR code:', err);
            return;
        }
        console.log('QR code saved to:', outputPath);
    });
};

exports.generateAllQrcode =async (req,res) =>{
    const tradingAccounts =await User.find({verification_status: KYCStatus.APPROVED}); 
    for(let tradingAccount of tradingAccounts){
        try{
              this.generateQRcodeOfWallet(tradingAccount.ethAddress)
        }catch(e){
            console.log(e)
        }
    }

    return res.status(200).send('ok'); 
}