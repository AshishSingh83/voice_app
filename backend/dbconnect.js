const mongoose = require("mongoose");
const connectDb = async(a)=>{
    //const uri = "mongodb+srv://mongodb123:ashish123@cluster0.dg3xrrx.mongodb.net";
    const uri = process.env.DB_URL;
    const DB_NAME = process.env.DB_NAME;
    try{
        await mongoose.connect(`${uri}/${DB_NAME}`);
        console.log('connected to database');
    }
    catch(e){
        console.log('error in connection',e.message);
    }
};
module.exports = connectDb;
