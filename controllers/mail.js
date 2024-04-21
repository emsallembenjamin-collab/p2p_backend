const Database = require("./Database");
const EmailController = require("./Email");


const getMailAndNotifications = async (req, res, next) => {

    const clientUuid = req.params.id;
    let user = await Database.Account.getAccountDetailByUuid(clientUuid);
    if (user) {
        let result = await Database.Mail.getMailHistoryByClientEmail(user.email);
        return res.status(200).send({
            success: true,
            body: result
        })
    }
    return res.status(200).send({
        success: false,
        error: "Server Error"
    })
}

const sendMailToUser = async (req, res, next)=>{
    const {id} = req.params; 
    const data = req.body; 
    const _user =await Database.Account.getAccountDetailById(id); 
    if(_user){
        EmailController.sendNotification(_user.email, data); 
        res.status(200).send({
            success: true, 
            body: {}
        })
    }else{
        res.status(200).send({
            success: false, 
            body: "User not exist."
        })
    }
}

const sendMailToUsers = async (req, res, next)=>{
    const {selectedUsers, ...data} = req.body;
    let _users = await Database.Account.getUserEmailsByIds(selectedUsers); 
    if(_users){
        _users.map(item=>{
            EmailController.sendNotification(item.email, data);
        })
        res.status(200).send({
            success: true
        })
    }else{
        res.status(200).send({
            success: false, 
            body:"Bad Request"
        });
    }
}

const MailController = {
    getMailAndNotifications, sendMailToUser, sendMailToUsers
}

module.exports = MailController; 