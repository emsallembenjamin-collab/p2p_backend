const fs = require('fs');
const BotController = require('../Bot');

// Read the JSON file
const readJsonFile =  (path) => {
    try {
        const data = fs.readFileSync(path, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData; 
    } catch (e) {
        BotController.errors(e, "readJsonFile")
        return false;
    }
}

const writeJsonFile =  (path, jsonData)=>{
    try{
        const data = JSON.stringify(jsonData);
        fs.writeFileSync(path, data, 'utf8'); 
        return true; 

    }catch(e){
        BotController.errors(e, "writeJsonFile"); 
        return false; 
    }
}

const FileController = {
    readJsonFile, writeJsonFile
}

module.exports = FileController; 