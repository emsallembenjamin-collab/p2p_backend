const { readRequired } = require('./environment');

const secret = readRequired(process.env, 'JWT_SECRET');
const tfaSecret = readRequired(process.env, 'TFA_SECRET');

if (secret === tfaSecret) {
  throw new Error('JWT_SECRET and TFA_SECRET must use different values');
}

module.exports = {
  secret,
  tfa_secret: tfaSecret,
};
