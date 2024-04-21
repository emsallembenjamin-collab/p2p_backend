const Database = require("./Database");

const getSyslogsForUser = async (req, res, next) => {
    const { email, accountUuid } = req;
    let result = await Database.SysLog.getSyslogsForUser(email);
    return res.status(200).send({
        success: !!result,
        body: result
    })
}

const SysLogController = {
    getSyslogsForUser
}
module.exports = SysLogController; 