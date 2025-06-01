////lets design a middleware for authentication
import {ApiError} from "../utils/ApiError.js"
import { asynchandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"
import  {User}  from "../models/user_model.js";
export const verifyJWT = asynchandler(async(req,_,next)=>{
//now we are retreuving the token from the server in which we also check the headers that do be 
//used to sended via phone logging because it doesnt work on server and in token it send in header 
//===it send Authorization Beared[token name with token value]
   

    try {
        const accessToken= req.cookies?.accessToken|| req.header("Authorization")?.replace("Bearer ","")
     if(!accessToken){
        throw new ApiError(400,"No access token")
     }
     
     const decodeToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)
     //we are not using await in generating the token so it get empty object isnted of a cookie 
     //jwt.verify(Promise {<pending>}, secret)  
     //accessToken = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

    
    const user = await User.findById(decodeToken?._id).select("-refreshToken -password")
    
    if(!user){
        throw new ApiError(401,"invalid access token",)
    }

     req.user = user;
    //so now it gives the access of user to the req to logged out in a scenerio
    next()
}catch (error) {
      throw new ApiError(401,error?.message||"internal error",)
    }

   
})

