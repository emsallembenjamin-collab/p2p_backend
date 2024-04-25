const jwt = require("jsonwebtoken");
const config = require("../config/auth.js");
const User = require("../models/user");
const Role = require("../models/role");
const UserService = require("../controllers/Database/account.js");

const verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];
  console.log(token);
  try {
    let token = req.headers["authorization"];
    if (!token) {
      return res.status(403).send({ message: "Authorization" });
    }
    let decode = jwt.verify(token, config.secret);
    req.email = decode.email; 
    req.accountUuid = decode.accountUuid; 
    req.isEmailVerified = decode.isEmailVerified; 
    req._id = decode._id;
    next();

  } catch (e) {
    console.log(e);
    return res.status(401).send({ message: "Unauthorized!" });
  }
};

const verifyTFAToken =async  (req, res, next) => {
  let token = req.headers["authorization"];
  console.log(token);
  try {
    let token = req.headers["authorization"];
    if (!token) {
      return res.status(403).send({ message: "Authorization" });
    }
    let decode = jwt.verify(token, config.tfa_secret);
    req.email = decode.email; 
    const user = await UserService.getAccountDetailByEmail(decode.email); 
    req.user= user; 
    next();
  } catch (e) {
    console.log(e);
    return res.status(401).send({ message: "Unauthorized!" });
  }
};

const authJwt = {
  verifyToken, verifyTFAToken
};
module.exports = authJwt;