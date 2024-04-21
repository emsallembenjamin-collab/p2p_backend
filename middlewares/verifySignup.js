const BOController = require("../controllers/BO");
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

    BOController.Account.checkEmailFromBO(req.body.email).then(
      exist_result=>{
        if(exist_result){
          res.status(200).send({
            success: false, 
            error: "You can't use this email. This email already in Use."
          })
        }else{
          next();
        }
      }
    ).catch(e=>{
      res.status(200).send({
        success: false, 
        error: "Try with another email. You can't use this email for register."
      })
    }); 
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