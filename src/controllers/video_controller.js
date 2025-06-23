import { ApiError } from "../utils/ApiError.js";
import { APIResponse } from "../utils/APIresponse.js";
import { uploadOncloudinary } from "../utils/cloudinary_service.js";
import { asynchandler } from "../utils/asynchandler.js"; 
import { Video } from "../models/video_model.js";
import { User } from "../models/user_model.js";
import { response } from "express";
const get_all_user_videos = asynchandler(async(req,res,next)=>{
//when we using the pegination it will help use to separate the data or break the data in which we can get all the data in sorted and arranged manner 
    const {limit = 10, page=1,sortBy = "createdAt",sortType = "desc",query="",userId} = req.query
    
    const finalUserId = userId || req.user?._id;

if (!finalUserId) {
  throw new ApiError(404, "User ID is missing");
}
//these are the specific field given in req.query in which we use filter
    if(!finalUserId){
        throw new ApiError(404,"userId is not founded for getting all videos")
    }
//by the hlp of filter we can make our seraching fast in which we can search videos by the hlpt of userid ,owner , title etc
   const filter = {
  isPublished: true,
  ...(query && { title: { $regex: query, $options: "i" } }),
                owner: finalUserId
};

const skip = (page-1)*limit
//by the help of sorrtoeder we will check how the data or videos will arrange in an order in mongodb the default 
// type is asc means ascending if asc is given in our req.query
//  then it will chose -1 beause this is for descending and if desc is not given then 
// it will takes its deafult value 1 ascending
const video = await Video.aggregate([
  {
    $match : { owner:finalUserId }
  },{
    $lookup : {
      from : "users",
      localField : "owner",
      foreignField:"_id",
      as :"owner_detail",
      pipeline :[
        {
          $project:{
                   username:1,
                   fullName:1,
                   avatar:1,
                   coverImage:1,
                   email:1
          }
        }
      ]
    }
  },{
    //video -> comments [owner] -> commenter_details(user)
    $lookup :{
      from : "comments",
      localField : "_id",
      foreignField : "video",
      as : "comments_on_video",
      pipeline : [
        {
          $lookup :{
               from : "users",
               localField : "owner",
               foreignField : "_id",
               as : "commenter_details",
               pipeline: [
                      {
                          $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
              }
            }
          ]
        }
      },
      {
          $addFields : {
            commenter_details : {
              $first : "$commenter_details"
            }
          }
        },
          {
            $project: {
              content: 1,
              createdAt: 1,
              commenter_details: 1
            }
        } 
      ]
    }
  },{
    $lookup : {
      from : "likes",
      localField : "_id",
      foreignField : "video",
      as : "likes_on_video",
      pipeline : [
        {
          $lookup : {
            from : "users",
            localField : "likedBy",
            foreignField : "_id",
            as : "liked_by",
            pipeline : [
              {
             $project :{
                   username : 1,
                   fullName : 1,
                   email : 1
               }
             }
          ]
          }
      },{
        $addFields : {
          liked_by : {
            $first : "$liked_by"
          }
        }
      },{
       $project : {
        liked_by:1,
        Comment : 1
       }
      }
      ]
    }
  },{
      $addFields: {
        likesCount: { $size: "$likes_on_video" },
        commentsCount: { $size: "$comments_on_video" }
      }
    },
  {
      $addFields : {
        owner_detail : {
          $first : "$owner_detail"
        }
      }
  },
  {
            $sort:{
                
                    [sortBy]: sortType === "desc" ? -1 : 1 ,
                     createdAt: -1  // Sort by createdAt in descending order as an option newest first
                  
          } //sort by ascending (1) or descending (-1)order
      } ,      // Skip documents for pagination
       { $skip: skip },

       // Limit documents for pagination
       { $limit: limit },{
        $project : {
          videoFile:1,
          thumbNail:1,
          title:1,
          description:1,
          views : 1,
          owner_detail:1,
          likes_on_video:1,
          comments_on_video:1,
          likesCount:1,
          commentsCount:1
        }
       }

])

//const sortorder = sortType === "asc"?1:-1;

// const all_videos = await Video.find(filter)
// //populate will help to only populate owner and its username email and vatar not other deatails such as password id fullname etc
// .populate("owner","username email avatar")
// .sort({[sortBy]:sortorder})
// .limit(parseInt(limit))
// .skip((page-1)*limit)

const total_count_of_videos = await Video.countDocuments(filter)

return res.status(200).json(new APIResponse(200, {
    video,
    
    total_count_of_videos,
    page: parseInt(page),
    limit: parseInt(limit)
  }, "Videos fetched successfully"))
})


const publishAVideo = asynchandler(async (req, res, next) => {
  const userId = req.user?._id;

  //console.log("➡️ Logged-in User ID:", userId);

  if (!userId) {
    throw new ApiError(404, "No user found");
  }

  // ❌ `find()` is wrong — ✅ use User.findById
  const user = await User.findById(userId).select("username email avatar");
  //console.log("✅ User fetched:", user);

  const {  title, description } = req.body;

 // console.log("📦 Video metadata:", { title, description, duration });

  if (!title || !description) {
    throw new ApiError(400, "Missing video details (title, duration, or description)");
  }

  const video_file_path = req.files?.videoFile?.[0]?.path;
  const thumbNail_file_path = req.files?.thumbNail?.[0]?.path;

  //console.log("📁 Video File Path:", video_file_path);
  //console.log("🖼️ Thumbnail File Path:", thumbNail_file_path);

  if (!video_file_path || !thumbNail_file_path) {
    throw new ApiError(404, "Files are missing");
  }

  // Upload to Cloudinary
  const videoFile = await uploadOncloudinary(video_file_path);
  const thumbNailFile = await uploadOncloudinary(thumbNail_file_path);

  //console.log("☁️ Uploaded Video File:", videoFile);
  //console.log("☁️ Uploaded Thumbnail File:", thumbNailFile);

  if (!videoFile?.secure_url || !thumbNailFile?.secure_url) {
    throw new ApiError(500, "Files are not uploaded on Cloudinary");
  }

  // Save video
  const publishingVideo = await Video.create({
    videoFile: videoFile.secure_url,
    thumbNail: thumbNailFile.secure_url,
    title,
    description,
    duration : videoFile.duration,
    isPublished: true,
    owner: user._id
  });

  console.log("📽️ Video saved to DB:", publishingVideo);

  res.status(201).json(
    new APIResponse(201, publishingVideo, "Video published successfully")
  );
});

const get_video_by_videoid = asynchandler(async(req,res,next)=>{
const {videoId} = req.params
//console.log(videoId)
const video = await Video.find({_id:videoId}).populate("owner" ,"username email _id fullname ")
///console.log(video)
 const updateVideo = await Video.updateOne(
            {_id: videoId},
            {$inc: {views :1}},
            {new:true , validateBeforeSave:false}
        )
        
        if (updateVideo.nModified === 0) {
            throw new ApiError(404, "Video not Found")
        }
return res
.status(200).json(new APIResponse(200,video,"video fetched successfully"))
})

const updateVideo = asynchandler(async (req, res,next) => {
    const {title,description,thumbNail} = req.body
    const {videoId} = req.params
    //TODO: update video details like title, description, thumbnail
     if(!videoId){
        throw new ApiError(404,"video id is not provided")
     }

   // console.log(videoId)
    //if a user is already logged in that means we only need to find the video by the video id and make it set
  
    const thumbnail_path = req.files?.thumbNail?.[0]?.path;

    console.log(thumbnail_path)
    if(!thumbnail_path){
        throw new ApiError(404,"thumbanail path is not founded")
    }

    const thumbanail_url = await uploadOncloudinary(thumbnail_path)
    //console.log("thumbanail_url  ; ",thumbanail_url)
    if(!thumbanail_url.secure_url){
        throw new ApiError(404,"thumnail usl not fetched")
    }

    //deleting the video thumbnail
     const deleteVideoThumbnail = await Video.findById(req.user?._id)
        // console.log("1" ,deleteVideoCoverImage)
        
        if (deleteVideoThumbnail) {
         // console.log("2", coverImage.url)
           await deleteOnCloudinaryImage(deleteVideoThumbnail.thumbnail);
        } 
    const updated_value = await Video.findByIdAndUpdate(
        videoId,{
            "$set" : {
                thumbNail : thumbanail_url.secure_url,
                title,
                description
            
            }
        }
    )

    updated_value.save()
 // console.log(updated_value)

    return res.status(200).json(new APIResponse(200,updated_value,"valued are updated"))
})


const deleteVideo = asynchandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!videoId){
        throw new ApiError(404,"No video id given")
    }

    const deleted_video = await Video.findByIdAndDelete(videoId)

    return res.status(200).json(200,deleted_video,"video deleted successfully")
})

const togglePublishStatus = asynchandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId){
        throw new ApiError(404,"videoid is not given ")
    }

    const togglePublishedStatus = await Video.findById(videoId).select("isPublished")
  
    console.log(togglePublishedStatus)
   return res.status(200).json(new APIResponse(200,togglePublishedStatus,"togglepublish status successfully"))
})

export {publishAVideo,
    get_video_by_videoid,
    get_all_user_videos,
      updateVideo,
    deleteVideo,
togglePublishStatus}
