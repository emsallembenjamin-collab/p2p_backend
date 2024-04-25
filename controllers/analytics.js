const UserService = require("./Database/account");
const { analyticsMode } = require("./constant");

const getUserAnalytics = async (req, res, next) => {
    
    const {start, end} = req.query; 
    const {adminEmail,adminUuid, role} = req; 
    
    const [startDate, endDate] = [new Date(start), new Date(end)]; 
    const daysDifference = Math.floor((endDate.getTime() - startDate.getTime())/(24*60*60*1000)); 

    let curDate = new Date(); 
    let prevWeekDate = new Date((new Date()).setDate(startDate.getDate() - daysDifference )); 

    let result = await UserService.getUserAnalytics(0, curDate, adminUuid, role);
    let curResult = await UserService.getUserAnalytics(startDate, endDate, adminUuid, role);
    let prevResult = await UserService.getUserAnalytics(prevWeekDate, startDate, adminUuid, role);

    if (result) {
        return res.status(200).send({
            success: true,
            body: {
                total: result, 
                curWeek: curResult, 
                prevWeek: prevResult
            }
        })
    } else {
        return res.status(200).send({
            success: false,
            error: "Internal Server Error"
        })
    }
}



const getBalanceAnalytics = async (req, res, next)=>{
    
   
}

const AnalyticsController = {
    getUserAnalytics,
    getBalanceAnalytics
}
module.exports = AnalyticsController; 