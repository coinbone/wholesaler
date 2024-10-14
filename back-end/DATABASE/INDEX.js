const mongoose = require( 'mongoose');

const {MONGODB_CONNECTION_STRING} = require('../config/index');

const dbconnect =async()=>{ 
    try {
        mongoose.set('strictQuery', false);
         const conn= await mongoose.connect(MONGODB_CONNECTION_STRING);
         console.log( `dataBASE CONNECTED TO HOST : ${conn.connection.host}`);
    }catch( error){
        console.log(`ERROR : ${error}`);
    }
}
module.exports= dbconnect;