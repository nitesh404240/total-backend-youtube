import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user_model.js"
import { uploadOncloudinary } from "../utils/cloudinary_service.js"
import { APIResponse } from "../utils/APIresponse.js";
import jwt from "jsonwebtoken"

const generate_Access_And_Refresh_Tokens = async(userId)=>{
    try{
//userid = this id is that passed in userschema for generate access and refresh token
//Finds the user document from the database by its _id.
// user is now a Mongoose document (an instance of the User model).

      const user = await User.findById(userId)
      const accessToken =await user.generateAccessToken()
      //here is the accesstoken gets generated and lifespan is 15min
      const refreshToken =await user.generateRefreshToken()
      //here is refress token generate and life span is 10 days
     user.refreshToken = refreshToken;
      //Saves the refresh token inside the user document.
///This helps you later verify if a refresh token being used is still valid.
    await user.save({ validateBeforeSave: false });
      //Saves the updated user document with the new refresh token.
      //save the refreshtoken in database

      //so now on this stage we wo;; return accesstoken and refreshtoken

      return {accessToken, refreshToken}
    }catch(error){
           throw new ApiError(500,"Somthing wnet wrong while generating refresh and access token")
    }
}

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
    ////====console.log("email",email)

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
    
     const usernameexist =await User.findOne({username})

    if(usernameexist){
        throw new ApiError(409,"user with username already exist")
    }
//the output is this 
//     console.log(req.files);
//   avatar: [
//     {
//       fieldname: 'avatar',
//       originalname: 'avatar2.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       destination: './public/temp',
//       filename: 'avatar2.jpg',
//       path: 'public\\temp\\avatar2.jpg',
//       size: 3275665
//     }
//   ],
//   coverImage: [
//     {
//       fieldname: 'coverImage',
//       originalname: 'coverImage2.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       destination: './public/temp',
//       filename: 'coverImage2.jpg',
//       path: 'public\\temp\\coverImage2.jpg',
//       size: 1476648
//     }
//   ]
// }
//this below files ka access hame multer ne diya jab hamne userroutes me upload ka use kiya
//jisme hamne name and count use kiya
 const avatarLocalPath = req.files?.avatar[0]?.path;
 ///avatarLocalPath = 'public/temp/avatar2.jpg';

 ///this is how it gonna be fetch the files location
/////req.files.avatar[0].path
// example: 'public/temp/avatar2.jpg'

//////////destination: './public/temp',
//       filename: 'avatar2.jpg',
//       path: 'public\\temp\\avatar2.jpg',
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
//console.log(avatarLocalPath)
// public\temp\avatar2.jpg

    if(!avatarLocalPath){
         throw new ApiError(400,"avatar is required")
}
//abhi agar ye karte to hame cloudinary ka pura setup yaha pe karna padta
//we hav our setup in "../utils/cloudinary_service.js"

//here we are uploading the files and method of uploading setup in ../utils/cloudinary_service.js
 const avatar = await uploadOncloudinary(avatarLocalPath)
 const coverImage =await uploadOncloudinary(coverImageLocalPath)

 //it will uplaod the file on cloudinary via localFilePath it wil always check this 

if(!avatar){
    throw new ApiError(400,"avatar file is required")
}
//user is created here and pushed to database
  const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    //console.log(avatar)
//if im finding the user by their id i can find this and in return it will automatically remove the 
//fiels password and refershtoken
    const usercreated= await User.findById(user._id).select(
      "-password -refreshTokens"
    )
       //this above line is responsible to delete the field password and 
       //refresh token from the api response    
  
if(!usercreated){
    throw new ApiError(500,"somthing went wrong while registering the user")

}
return res.status(201).json(
    new APIResponse(200,usercreated,"user registered successfully")
)

//we can get the same data by user

//this is only for the registration of the user 
})

const loginUser = asynchandler(async(req,res)=>{
  //take data from body which convid fron frontend 
  //username or email
  //find the user in database
  //match the password
  //access and refresh token 
  //send cookie
  
    const {password,email} = req.body
  
     if(!email){
        throw new ApiError(400,"email is required")
     }

    // const usernameexist = await User.findOne({username})
    // const emailexist = await User.findOne({email})

    //checking the userexistence
const user = await User.findOne({email})

    if(!user){
         throw new ApiError(404,"user is not exist")
    }

     //now we will check password
//passed password is fetched from req.bosy
const isPasswordValid = await user.isPasswordCorrect(password)
if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials")
}


//so we made a new function for refresh and access token and we can 
//take items out of it easily

//_id field is already generated by userschema for every another user this will be never same

const {accessToken,refreshToken} =await  generate_Access_And_Refresh_Tokens(user._id)

//here what we getting the empty object because it is callin the past user id it is not updated
//so for new update schema we should re call the DaTABASE

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const options = {
    httpOnly : true,
    secure : true

    //these cookie only modified by server not from frontend
}
// | Option     | Purpose                                                               |
// | ---------- | --------------------------------------------------------------------- |
// | `httpOnly` | Client-side JavaScript **cannot access** the cookie (security vs XSS) |
// | `secure`   | Cookie only sent over **HTTPS**, not HTTP (security)                  |
// | `sameSite` | Controls cross-site requests (CSRF protection)                        |
// | `maxAge`   | How long the cookie should live in the browser                        |

return res
.status(200)
.cookie("accessToken" , accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new APIResponse(
        200,
        //below is data field for api response
        {
            user : loggedInUser,accessToken,
            refreshToken
        },
        "user logged in Successfully"
    )
)
})   

 const logoutUser = asynchandler(async (req, res) => {
         // CONST USER = AWAIT USER.FINDById(USER_ID) BUT WE CAN NOT DO THIS BCZ USER SHOULD NOT ENTER EMAIL OR REQUIRED DETAILS TO LOG OUT 
         // SO WE NEED MIDDLE WARE TO GIVE AS USER DETAILS FROM REQ THAT WHERE AUTHMIDDLEWARE COME IN HANDY
        //   WHERE WE ADD AN OBJECT INTO REQ WHILE LOGOUT REQ

/* -------------STEPS TO LOG  OUT --------------------------------*/ 
          // step 1: ----  taking user datails from req.user that we have added while as middleware while logout request
         await  User.findByIdAndUpdate(
            req.user._id, 
            {
              $unset: {
                refreshToken: 1 //this remove field from databse
              }
            },
            {
              new: true, // to get updated new value with a refresh token as undefined otherqise we will get same value of refresh token
            }
          ) 
          //  -clear cookies
          const options = {
            httpOnly: true,
            secure: true,
          }
          //  console.log(req.user, "LOG OUT")
          return res
          .status(200)
          .clearCookie("refreshToken", options)
          .clearCookie("accessToken", options)
          .json(
    new APIResponse(
        200,
        //below is data field for api response
        {
            
        },
        "user logged out Successfully"
    )
)
  })
  
const RefreshAccessToken = asynchandler(async(req,res,next)=>{

   try { 
     const incoming_refresh_token = req.body.refreshToken || req.cookies?.refreshToken;
///console.log("incoming_refresh_token",incoming_refresh_token)
  if(!incoming_refresh_token){
    throw new ApiError(400,"refresh token is not coming")
  }
  const decode_refresh_token = await jwt.verify(incoming_refresh_token,process.env.REFRESH_TOKEN_SECRET)

  if(!decode_refresh_token){
    throw new ApiError(401,"no token matching")
  }

  const user = await User.findById(decode_refresh_token?._id)

  if(!user){
    throw new ApiError(401,"invalid refresh token")
  }

  //we have already saves a encoded token in generate token function so we have to match it with already existed token 
const user_refresh_exists_token = user.refreshToken

///console.log("user_refresh_exists_token :" ,user_refresh_exists_token)

  if(incoming_refresh_token !== user_refresh_exists_token){
    throw new ApiError(401,"refresh token is used or expired",userref,incoming_refresh_token)
  }


const {accessToken,refreshToken} = await generate_Access_And_Refresh_Tokens(user._id)//generating new tokens 
const new_refreshToken = refreshToken;

//console.log("new_refreshToken = ",new_refreshToken)

const options = {
    httpOnly : true,
    secure : true
}


return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",new_refreshToken,options)
.json(
    new APIResponse(
        200,
       {accessToken , new_refreshToken ,user_refresh_exists_token ,incoming_refresh_token},
       "access token refreshned"
    )
)
}catch(error){
    throw new ApiError(401,error?.message||"Invalid refresh token")
}
})

const changePassword = asynchandler(async(req,res,next)=>{

    const {password,new_password,confirm_password} = req.body;


    if(!(new_password === confirm_password)){
        throw new ApiError(404,"password is not confirmed")
    }
    console.log("password  ; ", password)

    console.log("new_password : ",new_password)
    
     if(password == new_password){
        throw new ApiError(404,"password must not be same")
     }

    const accessToken = req.cookies?.accessToken
  
    if(!accessToken){
        throw new ApiError(400,"no access token")
    }
    const decoded_user = await jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)

    if(!decoded_user){
        throw new ApiError(404,"no decoding")
    }

    const user = await User.findById(decoded_user?._id);
    // console.log("user",user)
     if(!user){
        throw new ApiError(401,"user not found")
     }

     const ispasswordCorrect = await user.isPasswordCorrect(password)
// console.log("user_password",user.password)
    //  console.log("ispasswordcorrect",ispasswordCorrect)
  if(!ispasswordCorrect){
    throw new ApiError(404,"old password is not matching")
  }

    
console.log("user_password_old : ",password)
     user.password = new_password;
console.log("user`s_new_password ; " ,new_password)
    
    await user.save({validateBeforeSave:false})

     return res.status(200)
     .json(new APIResponse(200,"password change successfully"))
})

const get_current_user = asynchandler(async(req,res,next)=>{
  //we can find the current user by access token and out auth middleware in which passed doen the user in request
 const user = req.user

 const userr = await User.findById(user._id).select("-password -refreshToken -avatar -coverImage ")
//agar user ko middleware yani requested body se nikalenge to password and refresh token field ko disable kar diya
 return res
 .status(200)
 .json(new APIResponse(200,`current user is : ${userr}`))


})

const updateProfile = asynchandler(async(req,res,next)=>{

  const { fullname,username,email,password} = req.body
 if(!password){
    throw new ApiError(404,"password is requiered to update")
 }


 if(!(fullname || username || email)){
  throw new ApiError(404,"user fields are empty")
 }
  const user = req.user

  //passowrd field ko add kiya hamne authentication me jisse hame passowrd verification kar sake other wise we can remove refreshtoken and password from it
//console.log(email)
//  console.log(password)
//  console.log(user.password)
  const isuserverified = await user.isPasswordCorrect(password)
//console.log(isuserverified)
  if(!isuserverified){
    throw new ApiError(404,"password is incorrect")
  }
  if(fullname && fullname != user.fullname){
      user.fullname = fullname
  }
   if(email && email != user.email){
      user.email = email
  }
   if(username && username != user.username){
      user.username = username
  }

  await user.save()

  const userr = await User.findById(user._id).select("-password -refreshToken -avatar -coverImage ")

  return res
  .status(200)
  .json(new APIResponse(200,"updation has been successfull",userr))

})

const update_user_avatar = asynchandler(async(req,res,next)=>{

     const avatarLocalPath = req.files.avatar[0]?.path

     if(!avatarLocalPath){
      throw new ApiError(401,"no avatar file")
     }
     const avatar = await uploadOncloudinary(avatarLocalPath)
     const avatar_secure_url = avatar.secure_url
     //console.log(avatar.secure_url)

    //  const user = req.user

    //  if(!user){
    //   throw new ApiError(404,"no user fetched")
    //  }

    //  await User.findByIdAndUpdate(
    //   user._id,
    //   {
    //     $set: {
    //        avatar : avatar_secure_url
    //     }
    //   }
    // ) 

    //  await user.save();

     await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
           avatar : avatar_secure_url
        }
      },{
        new : true
      }
    ) 

     return res.status(200).json(new APIResponse(200,"avatar successfully updated",avatar_secure_url))
})
export {registerUser,loginUser,logoutUser,RefreshAccessToken,changePassword,get_current_user,updateProfile,update_user_avatar}

