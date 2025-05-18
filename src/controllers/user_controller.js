//we can use this registeruser directly without using the async handler 
//we can directly define this but this will lead to additional field 
import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user_model.js"
import { uploadOncloudinary } from "../utils/cloudinary_service.js"
import { APIResponse } from "../utils/APIresponse.js";
const registerUser = asynchandler( async (req,res)=>{
    //step by step progress
    //get the user detatils from frontend 
    //validation - not empty fiels
    //check if user already exist : via username and email
    //avatar must be checked , images,coverimage
    //upload them to cloudinary and check avatar must be uploads we will udate a check on cloudinary
    //create a user object - create entry in DB 
    //remove the password and token field from response
    //check if response return and user creation 
    //if successful then return res or error


    //////getting the data from user in body field via json or url 
    const {fullname ,email,username,password} = req.body
    console.log("email",email)

    if(fullname === "" ){
        throw new ApiError(400,"fullname is required")
    }else if(email === ""){
        throw new ApiError(400,"email is required")
    }else if(username === ""){
        throw new ApiError(400,"username is required")
    }else if(password === ""){
        throw new ApiError(400,"password is required")
    }

//there are new method to check the field already exist below line both will chekc at a time
    // const userexist = User.findone({
    //     $or : [ { email } , { uername } ]
    // });
    const emailexist =await User.findOne({email})
  //if it finds my email in database it return my name ,pass,uername,avatar,coverimage,fullname a total userschema that i made ]
    if(emailexist){
        throw new ApiError(409,"user with email already exist")
    }
    
     const usernameexist =await User.findOne({email})

    if(usernameexist){
        throw new ApiError(409,"user with username already exist")
    }

//this below files ka access hame multer ne diya jab hamne userroutes me upload ka use kiya
//jisme hamne name nad count use kiya

    const avtarLocalPath = res.files?.avatar[0]?.path;

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avtarLocalPath){
         throw new ApiError(400,"avatar is required")
}
//abhi agar ye karte to hame cloudinary ka pura setup yaha pe karna padta
//we hav our setup in "../utils/cloudinary_service.js"

//here we are uploading the files and method of uploading setup in ../utils/cloudinary_service.js
 const avatar = await uploadOncloudinary(avtarLocalPath)
 const coverImage =await uploadOncloudinary(coverImageLocalPath)

 //it will uplaod the file on cloudinary via localFilePath it wil always check this 

if(!uploadavatar){
    throw new ApiError(400,"avatar file is required")
}
//user is created here
  const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
//if im finding the user by their id i can find this and in return it will automatically remove the 
//fiels password and refershtoken
    const usercreated= await User.findById(user._id).select(
      "-password -refreshTokens"
    )
          
})
  
if(!usercreated){
    throw new ApiError(500,"somthing went wrong while registering the user")

}
return res.status(201).json(
    new APIResponse(200,usercreated,"user registered successfully")
)

//this is only for the registration of the user 

export {registerUser,}

// const registerUser = asynchandler( async (req,res)=>{
//     //here we can send muny much status like 200 for ok
//     //  res.status(200).json({
//     //  message : " Nitesh choudhary "
//     // })
//     })