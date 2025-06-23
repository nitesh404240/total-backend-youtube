import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user_model.js"
import { uploadOncloudinary } from "../utils/cloudinary_service.js"
import { APIResponse } from "../utils/APIresponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { Schema } from "mongoose";

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
//when i pushed it it runs pre operator and save the password and other it only hashed pasword when we save the password but we can also hashed othre things also
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


 if(!(password || email)){
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

const get_user_subcription = asynchandler(async(req,res)=>{
  
  const {username} = req.params
// console.log(username)

// const user = await User.findOne({username})
// console.log(user)

  if(!username){
    throw new ApiError(401,"no username recieves")
  }

const channel = await User.aggregate([
    {
      $match : {username : username}
    },{
      //joining all documents in subcription schema that contain user  object id in channel 
      $lookup : {    
        from : "subcriptions",
        localField : "_id",
        foreignField : "channel",
        as : "user_subscribers"

      }
  
      //when the someoone subscriber to someones's channel in which it contain the objectId in thier channel or in subscribe field in subcription shema 

      //so when i use match that mean i am matchin username in user schema //a
      //after that when i loopup the my local user object  _id with cforeing field of subcription that is channel that means 
      // it shows that how many channels contain the same object id that username conatain so by caluclating this we can field how many subscriber nitesh 
    },
      //joining all documents in subcription schema that contain user  object id in channel 
      {
      $lookup : {
        from : "subcriptions",
        localField : "_id",
        foreignField : "subscriber",
        as : "to_user_subscribes"

      }
    },
    {
      $lookup: {
            from: "users",
            localField: "to_user_subscribes.channel", // channel is the person you subscribed to
            foreignField: "_id",
            as: "subscribedToUsers"
}
    },
    {
      $addFields : {
        total_subscribers_of_this_channel : {
          "$size" : "$user_subscribers"
        },
        total_subcribed_by_user: {
          "$size" : "$to_user_subscribes"
        },
        IsSubscribed : {    
          "$cond" : 
          {
            if : {"$in":[req.user?._id,"$user_subscribers.subscriber"]},
            //they = "pop"
            //this upper line shows that it takes the _id from already logged in user and when i click on pop profile where i see 
            //total cubscriber of 'pop' and total channels that 'pop' subscribed and to find that i subcribed to "pop" or not 
            //i will check my user id in "pop " subcriber list if i present then yes if not then no
            then: true,
            else : false //the user is already logged in so we can fetch its _id 
          }
        }
      }
    },
    {
      $project : {
        usrename : 1,
        email: 1,
        fullname : 1,
        total_subscribers_of_this_channel :1,
        total_subcribed_by_user : 1,
        IsSubscribed:1,
       // subscribedToUsers,
        avatar : 1,
        coverImage:1
      }
    }
  ])

 // console.log(channel)
return res
.status(200)
.json(
  new APIResponse(200,channel[0],"channel fetched successfully")
)
})

const watchHistory = asynchandler(async(req,res,next)=>{
//console.log(req.user._id)

 // const {username} = req.params

  //req.user._id = "wbekfjwef5w4f6w46f46e8f46e46e4f6w8e4"

  //this above line user store a string not a id to get full object id we need to implement new monogoose schema types objectId(user) this will create a new object id
  const user = await User.aggregate([
    {
      //$match : { username : username}
      $match : {_id : req.user._id}
    },
    {
      $lookup : {
        from : "videos", //we use videos instead of Video because our database stored as this
        localField : "watchHistory",
        //outwatch history will contain some object ids that of vedios from vedios schema 
        foreignField : "_id",
        //in this fist lookup there will be many ids append in watchhistory array to these will be from videos schema or object id of videos
        as : "watch_history_of_user",
        pipeline : [
          //by the help of 1st lookup we create a join on vedioes in which we will takes all the document that contian the user id 
          //in below lookup we will get the owner of those vedios by the help of joining with user schema 
          //this is called nested pipeline and by the help of project we will only project the name ,email,and fullname 
          {
            $lookup : {
              from : "users",  //collection name (must match actual MongoDB collection, typically lowercase plural)
              //in vedios schema or document each vedio contain some owner ids in which to find the owner we need to make another lookup to user to find theri identity 
              //the ids will store in owner field  
              localField : "owner",
              foreignField : "_id",  //collection name (must match actual MongoDB collection, typically lowercase plural)
              as : "owners_details_of_videos",
              //by the help of this we can find the owner of vedios that user saw 
              pipeline:[
                {
                  $project : {
                      username : 1,
                      email : 1,
                      fullname : 1
                  }
                },
                
              ]
            }
            
          },{
             $addFields : {
               owners_details_of_videos :
                           { $first : "$owners_details_of_videos"}
             }
             //by using the addfiels in owners_details_of_videos it gives array first field into object
             //   owners_details_of_videos: [ { ... } ]  -> owners_details_of_videos: { ... }

             

            }//there is no need to project this becauase our schema already has thos field whihc will eventually attached to it
            //{
                //    //$project : {
                //      title: 1,
                //      thumbnail:1,
                //      videoFile : 1,
                //      description : 1,
                //      views:1,
                //      duration: 1,
                //      owner: 1,
                //      owners_details_of_videos: 1,
                //   }}
        ]
      },
    },{

      //this project will help to only project email,fullname,usernamewatch_history (this will contain user_id,duration,time,owner(this include email,fullname,username))
      $project : {
        email: 1,
      username : 1,
      watch_history_of_user: 1
      }
    }
  ])

  return res
  .status(200)
  .json(new APIResponse(200,"watchhistory fetched successfully",user[0]))
  //.json(new APIResponse(200,"watchhistory fetched successfully",user[0].watch_history_of_user))
  //this above response is lighweight which directly gives watch history which includes vedios details like owner and other 
  })

//    {     //[{ _id ,watch_history_documents[{_id,title,owner,owners_of_vedios : [{username,email,fullname }]}] }]   ============outpu

//   //this upper aggregate return us the output in ARRAY form ,so we need to assemble the data ,
//             // this output will in array in owner field so we need to improve it for the front end because one array in owner
//             //  field and another array for outside in which we concienved the vedioes from user 
//             ////there will user details first when we user - > videos and in vedios there will be owner_of_videos -> user details
// //            //for example there are 8 videos in my history in which each ontain theri owner details 
// //////////////=======[     
// //                       {_id , email , fullname ,                 ====this output when we dont using addfield in out pipeline
// //                           watch_history_videos :  [
// //                       {_id(id of vedios),duration,title ,owners_of_videos: [{email,fullname,username}] },
// //                       {_id(Id of vedios),duration,title ,owners_of_videos: [{email,fullname,username}] },
// //                       {_id(id of vedios),duration,title ,owners_of_videos: [{email,fullname,username}] },
// //                       {_id(Id of vedios),duration,title ,owners_of_videos: [{email,fullname,username}] },
// //                       {_id(id of vedios),duration,title ,owners_of_videos: [{email,fullname,username}] },
// //                       {_id(Id of vedios),duration,title ,owners_of_videos: [{email,fullname,username}] },
// //                       {_id(id of vedios),duration,title ,owners_of_videos: [{email,fullname,username}] },
// //                       {_id(Id of vedios),duration,title ,owners_of_videos: [{email,fullname,username}] }
// //                   ]}                     
// //                   ]


// //output when i am writing this new code which hase a heirarchy - > 
// //                                    [{  user_details -> _id,fullname ,username,email ,
// //                                      watch_history : [{this will contain vedioes information in which fields are 
//     //                                                      _id,duration,time ,likes,comments, 
//     //                                                                       owner_details : { this will dsiplay owner info without array becuse we
//     //                                                                                use addfield which project only object not array by using first
//     //                                                                                    email ,fullname,username             } 
// //                                                },{ },{ },{ },{ }---------] }]
// // [
// //   {
// //     _id: ObjectId("user_id_here"),
// //     email: "nitesh@example.com",
// //     fullname: "Nitesh Choudhary",
// //     username: "nitesh404",
// //     avatar: "avatar_url.jpg",

// //     watch_history_videos: [
// //       {
// //         _id: ObjectId("video_id_1"),
// //         title: "How to Learn MongoDB",
// //         thumbnail: "thumbnail1.jpg",
// //         videoFile: "video1.mp4",
// //         description: "A complete guide to MongoDB aggregation.",
// //         views: 1023,
// //         duration: "08:15",
// //         owner: ObjectId("owner_id_1"),

// //         owners_details_of_videos: {
// //           username: "techguru",
// //           email: "techguru@example.com",
// //           fullname: "Tech Guru"
// //         }
// //       }
// //     ]
// //   }
// // ]

// }
export {
         registerUser,
         loginUser,
         logoutUser,
         RefreshAccessToken,
         changePassword,
         get_current_user,
         updateProfile,
         update_user_avatar,
         watchHistory,
         get_user_subcription
      }


//  {     //example===============
// //   userchema :     [
// //   { _id: ObjectId("u1"), username: "nitesh", fullname: "Nitesh Choudhary", email: "nitesh@example.com" },
// //   { _id: ObjectId("u2"), username: "alice", fullname: "Alice A", email: "alice@example.com" },
// //   { _id: ObjectId("u3"), username: "bob", fullname: "Bob B", email: "bob@example.com" }
// // ]
// //=======================subcriptions=================
// // [
// //   { _id: ObjectId("s1"), subscriber: ObjectId("u2"), channel: ObjectId("u1") }, // Alice → Nitesh
// //   { _id: ObjectId("s2"), subscriber: ObjectId("u3"), channel: ObjectId("u1") }, // Bob → Nitesh
// //   { _id: ObjectId("s3"), subscriber: ObjectId("u1"), channel: ObjectId("u2") }, // Nitesh → Alice
// //   { _id: ObjectId("s4"), subscriber: ObjectId("u1"), channel: ObjectId("u3") }  // Nitesh → Bob
// // ]


// ///=========================output for aggregation pipeline===========================
// // {
// //   "_id": ObjectId("u1"),
// //   "username": "nitesh",
// //   "fullname": "Nitesh Choudhary",
// //   "email": "nitesh@example.com",                       ==========this is for matching the username ================

//  ///==============================================user_subcriber in which i join them _id to channel ===================================
//  //here i only found 2 documents that conatiain nitesh object id in their channel (channel gives use the count that how many subscribed me)
// //   "user_subscribers": [
// //     {
// //       "_id": ObjectId("s1"),
// //       "subscriber": ObjectId("u2"),
// //       "channel": ObjectId("u1")        ========================
// //     },
// //     {
// //       "_id": ObjectId("s2"),
// //       "subscriber": ObjectId("u3"),
// //       "channel": ObjectId("u1")          ====================
// //     }
// //   ],
  
// //============================================ this is thir lookup which gives me the docuument that contain the channel the is subscriber it match with subscriber =========
// //======================there ar total 2 channel that i subcribedd

// //   "to_user_subscribes": [
// //     {
// //       "_id": ObjectId("s3"),
// //       "subscriber": ObjectId("u1"),           ===================
// //       "channel": ObjectId("u2")                   ==============
// //     },
// //     {
// //       "_id": ObjectId("s4"),
// //       "subscriber": ObjectId("u1"),
// //       "channel": ObjectId("u3")
// //     }
// //   ],

// //   "subscribedToUsers": [
// //     {
// //       "_id": ObjectId("u2"),
// //       "username": "alice",
// //       "fullname": "Alice A",
// //       "email": "alice@example.com"
// //     },
// //     {
// //       "_id": ObjectId("u3"),
// //       "username": "bob",
// //       "fullname": "Bob B",
// //       "email": "bob@example.com"
// //     }
// //   ],
// ///===========================================this is the counting or finding the size of the documents in that field=============================
// //   "total_subscribers_of_this_channel": 2,
// //   "total_user_to_other_channels": 2
// // }


// //=====================================this is second pipeline output ==========================================
// // [{
// //   _id: ObjectId("user_id_here"),
// //   watch_history_videos: [
// //     {                                          ////////this is document 1 for vedio field and it also contain owner 
// //                                                         field that attached with vedio and also we wrote another pipeline for that 
// //                                                       will join owner field with user and find all the necessary details of the owner
// //                                                     like email ,fullname ,username
// //       _id: ObjectId("video_id_1"),
// //       title: "Video 1",
// //       owner: ObjectId("owner_id_1"),
// //       owners_of_videos: [                             //wen we used second pipeline 
// //         {
// //           username: "user1",
// //           email: "u1@example.com",
// //           fullname: "User One"
// //         }
// //       ]
// //     },
// //     {
// //       _id: ObjectId("video_id_2"),                     //fisrt pipe line output that gives vedio schema (user ->vedios)
// //       title: "Video 2",
// //       owner: ObjectId("owner_id_2"),
// //       owners_of_videos: [                             //second pipeline which gives us owner details {  owner -> user }
// //         {
// //           username: "user2",
// //           email: "u2@example.com",
// //           fullname: "User Two"
// //         }
// //       ]
// //     }
// //     // and so on...
// //   ]
// // }]
// }