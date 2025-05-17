import { asynchandler } from "../utils/asynchandler.js";

//we can use this registeruser directly without using the async handler 
//we can directly define this but this will lead to additional field 
const registerUser = asynchandler( async (req,res)=>{
     res.status(200).json({
     message : " Nitesh choudhary "

    })
})

//this is only for the registration of the user 

export {registerUser,}

