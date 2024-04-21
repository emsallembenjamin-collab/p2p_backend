
const Database = require("../controllers/Database");
const jwt = require("jsonwebtoken");
const config = require("../config/auth.js");
const { AccountRole, AdminRole } = require("../controllers/constant");

const checkSuperAdmin = async (req, res, next) => {

    const email = getEmailFromToken(req);
    req.email = email;

    if (!email) {
        return res.status(401).send({ error: "Unauthorized User" });
    }
    try {
        const admin = await Database.Admin.findAdminByEmail(email)
        if (!admin) {
            return res.status(403).send({ error: "Bad Request" });
        } else if (admin.role !== AccountRole.SUPER_ADMIN) {
            return res.status(403).send({ error: "Bad Request" });
        } else {
            next();
        }
    } catch (e) {
        return res.status(500).send({ error: "Server Error" });
    }
}

const getEmailFromToken = (req) => {
    try {
        let token = req.headers["authorization"];
        let docode = jwt.verify(token, config.secret);
        return docode.email;
    } catch (e) {
        console.log("getEmailFromToken", e);
        return false;
    }
}

module.exports = checkSuperAdmin;