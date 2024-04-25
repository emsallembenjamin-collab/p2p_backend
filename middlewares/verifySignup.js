const Admin = require("../models/admin");
const User = require("../models/user");
const ROLES = ["user", "admin", "moderator"];

const checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Email
  User.findOne({
    email: req.body.email
  }).exec((err, user) => {
    if (err) {
      console.log(req.body)
      res.status(500).send({ message: err });
      return;
    }
    if (user) {
      res.status(200).send({
        success: false,
        error: "Failed! Email is already in use!"
      });
      return;
    }

    res.status(200).send({
      success: true,
    })
  });
}
const checkDuplicateAdminNameOrEmail = (req, res, next) => {
  // Email
  Admin.findOne({
    email: req.body.email
  }).exec((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    if (user) {
      return res.status(200).send({
        success: false,
        error: "Failed! Email is already in use!"
      })
    }

    next();
  });
}

const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(200).send({
          success: false,
          error: `Failed! Role ${req.body.roles[i]} does not exist!`
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
  checkDuplicateAdminNameOrEmail
};

module.exports = verifySignUp;