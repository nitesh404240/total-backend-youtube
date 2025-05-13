//require('dotenv').config({path:'./env'})
//above line will not config becausewe have only importt accessible name 
//not in require formate

import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
})
connectDB()

///////// 1. approach
//this is a IFEE function that given output instant and run in speed
//(()=>{})
//this is the first approch to connect with database 

// import express from "express"
// const app = express();

// ;( async()=>{
//     try{p
//           await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//           app.on("error",(error)=>{
//             console.log("ERROR",error);
//             throw error
//           })
//           app.listen(process.env.PORT,()=>{
//             console.log(`App is listening on port ${process.env.PORT}`);
//           })
//     }catch(error){
//        console.error("Error:",error)
//        throw err
//     }
// })()