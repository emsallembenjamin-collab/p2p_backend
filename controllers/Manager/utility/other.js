
exports.MakeSimpleEmail = (email ) =>{
    return email.slice(0, 3) + "***" + email.slice(email.length-3, email.length); 
}