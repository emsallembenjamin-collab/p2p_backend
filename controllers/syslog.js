const LogService = require("./Database/syslogs");

const getSyslogsForUser = async (req, res, next) => {
    const { email, accountUuid } = req;
    let result = await LogService.getSyslogsForUser(email);
    return res.status(200).send({
        success: !!result,
        body: result
    })
}

const SysLogController = {
    getSyslogsForUser
}
module.exports = SysLogController; 