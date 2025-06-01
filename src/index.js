//require('dotenv').config({path:'./env'})
//above line will not config becausewe have only importt accessible name 
//not in require formate

import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './.env'
})

//Approach 1: Chained .then().catch() Promise Style
//here we import the connect db
const database= connectDB()

database.then(()=>{


    app.listen(process.env.PORT || 8002,()=>{
          console.log(`server is running at ${process.env.PORT}`)
    })
    app.on("error",(error)=>{
        console.log(`getting error`,error);
        throw error
    })
})
.catch((error)=>{
    console.log("Mongodb connection failed !! ",error)
    process.exit(1)
})
//this is a asynchronous mathod in which it returns a promise


/////////Approach 2. IIFE (Immediately Invoked Function Expression) with async/await
//this is a IFEE function that given output instant and run in speed
//(()=>{})
//this is the first approch to connect with database 

// import express from "express"
// const app = express();

// ;( async()=>{
//     try{
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