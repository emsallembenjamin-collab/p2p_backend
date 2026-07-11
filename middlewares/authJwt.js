const jwt = require("jsonwebtoken");
const config = require("../config/auth.js");
const UserService = require("../controllers/Database/account.js");
const {
  AuthorizationError,
  copyIdentityClaims,
  extractBearerToken,
  sendAuthorizationError,
} = require('../utils/authorization');

const verifyToken = (req, res, next) => {
  try {
    const token = extractBearerToken(req.get('authorization'));
    const payload = jwt.verify(token, config.secret);

    copyIdentityClaims(req, payload);
    return next();
  } catch (error) {
    return sendAuthorizationError(res, error);
  }
};

const verifyTFAToken = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.get('authorization'));
    const payload = jwt.verify(token, config.tfa_secret);
    const user = await UserService.getAccountDetailByEmail(payload.email);

    if (!user) {
      throw new AuthorizationError('Token account no longer exists');
    }

    req.email = payload.email;
    req.user = user;
    return next();
  } catch (error) {
    return sendAuthorizationError(res, error);
  }
};

const authJwt = {
  verifyToken,
  verifyTFAToken,
};

module.exports = authJwt;
