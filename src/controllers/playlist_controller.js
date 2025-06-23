import {mongoose, Schema,isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist_model.js"
import {ApiError} from "../utils/ApiError.js"
import { APIResponse } from "../utils/APIresponse.js"
import { asynchandler } from "../utils/asynchandler.js"
import { app } from "../app.js"



const createPlaylist = asynchandler(async (req, res) => {
    const {name, description,ownerId} = req.body
   //console.log(name)
    const owner = ownerId || req.user._id 
    //console.log(owner)
    if(!name ){
        throw new ApiError(404,"name is required to create a playlist")
    }
   
    //console.log(description)
   try{  const playlist = await Playlist.create({
        name ,
        description,
        owner : owner
     })
      
     const playlist_details = await Playlist.find({_id:playlist._id}).populate("owner","username email avatar fullanme")
     return res
     .status(200)
     .json(new APIResponse(200,playlist_details,"playlist has been successfully made"))
    }catch(error){
      throw new ApiError(500,error,"somthing went errorduring creating a new playlist")
    }

    //TODO: create playlist
})

const getUserPlaylists = asynchandler(async (req, res) => {
    const {userId} = req.params
    
    if(!userId){
        throw new ApiError(404,"userID is not given")
    }

    // const playlist = await Playlist.aggregate([
    //   {$match: {
    //   owner: new mongoose.Types.ObjectId(userId) // ✅ Correct type
    // }},
    //   {$lookup : {
    //            from :"videos",
    //            localField : "videos",
    //            foreignField:"_id",
    //            as:"playlist_videos",
    //            pipeline:[
    //             {
    //               $lookup : {
    //                 from : "users",
    //                 localField : "owner",
    //                 foreignField : "_id",
    //                 as : "owner_details_of_video",
    //                 pipeline : [
    //                   {
    //                        $project : {
    //                              _id : 1,
    //                              username : 1,
    //                              email : 1,
    //                              fullname : 1
    //               },
                  
    //             }
    //                 ]

    //               }
    //             },{
    //               $addFields : {
    //                 owner_details_of_video : {
    //                   $first : "$owner_details_of_video"
    //                 }
    //               }
    //             }, {
    //               $project : {
    //                      _id : 1,
    //                      title : 1,
    //                      description : 1,
    //                      videoFile:1,
    //                      thumbNail:1,
    //                      views:1,
    //                      owner_details_of_video:1
    //               }
    //             }
    //            ]
               

    //   }},
    //   {
    //          $addFields : {
    //           total_video_count : {
    //             $size : "$playlist_videos"
    //           }
    //          }
    //   },
    //   {
    //     $project : {
    //       name : 1,
    //       description : 1 ,
    //       playlist_videos:1,
    //       total_video_count:1
    //     }
    //   }

    // ])

    

    const playlists = await Playlist.find({owner : userId})
     .populate("owner", "username fullname email")           // ✅ populate playlist owner
    .populate({
      path: "videos",
      populate: {
        path: "owner",                //video owner 
        select: "username fullname email"
      }
      
    });
 

 const playlistsWithCounts = playlists.map((playlist) => ({
    _id: playlist._id,
    name: playlist.name,
    description: playlist.description,
    owner: playlist.owner,
    videos: playlist.videos,
    videoCount: playlist.videos.length,
    createdAt: playlist.createdAt
  }));


    return res
    .status(200)
    .json(new APIResponse(200,playlistsWithCounts,"user playlist fetched successfully"))
})

const getPlaylistById = asynchandler(async (req, res) => {
    const {playlistId} = req.params
   
    
    if(!playlistId){
        throw new ApiError(404,"userID is not given")
    }

    const playlist = await Playlist.findById({_id : playlistId})
     .populate("owner", "username fullname email")           // ✅ populate playlist owner
    .populate({
      path: "videos",
      populate: {
        path: "owner",
        select: "username fullname email"
      }
    });

    console.log(playlist)

     const playlist_videos = await Playlist.findById(playlistId).select("videos")
 
  const count_of_videos = playlist_videos.videos.length;
    return res
    .status(200)
    .json(new APIResponse(200,playlist,count_of_videos,"playlist fetched successfully"))



})

const addVideoToPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(404,"id of playlist or video not given")
    }

    const updated_playlist = await Playlist.findByIdAndUpdate(
         playlistId ,
         {
            "$addToSet" : {
                videos : videoId,
            },
                
            
         },{
            new : true
         }

    )

    
 await updated_playlist.save()

const playlist_is = await Playlist.find({_id : playlistId}).
populate("owner","username fullname email")
.populate({
    path: "videos",
    populate: {
      path: "owner",
      select: "username fullname email avatar", // fields you want from User
    }
  })

  const playlist = await Playlist.findById(playlistId).select("videos")
 
  const count_of_videos = playlist.videos.length;
console.log(count_of_videos)

return res
.status(200)
.json(new APIResponse(200,playlist_is,count_of_videos,"video has been successfully added"))
})
const removeVideoFromPlaylist = asynchandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!playlistId||!videoId){
        throw new ApiError(404,"playlist and video id are required")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId
        ,{
            "$pull":{
                videos:videoId
            }
        },{
            new : true
        }
    )

    updatedPlaylist.save()

      if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
    const new_playlist = await Playlist.find({_id : playlistId}).
populate("owner","username fullname email")
.populate({
    path: "videos",
    populate: {
      path: "owner",
      select: "username fullname email avatar", // fields you want from User
    }
  })
  const playlist = await Playlist.findById(playlistId).select("videos")
 
  const count_of_videos = playlist.videos.length;
    return res
    .status(200)
    .json(new APIResponse(200,{new_playlist,count_of_videos},"video successfully removed from playlist"))
})

const deletePlaylist = asynchandler(async (req, res) => {
    const {playlistId} = req.params
    const userId = req.user._id
  
    
    console.log(playlistId,userId)
    if(!userId){
      throw new ApiError(404,"user id is not available")
    }
    // TODO: delete playlist

    if(!playlistId){
     throw new ApiError(404,"playlist is not given")
    }
   
    const is_playlist_exist = await Playlist.findById(playlistId)
if(!is_playlist_exist){
  throw new ApiError(404,"this playlist is not exist")
}

    await Playlist.findByIdAndDelete(playlistId)

    //owner: new mongoose.Types.ObjectId(userId)
     const remained_playlist = await Playlist.find({owner : userId})
     .populate("owner", "username fullname email")           // ✅ populate playlist owner
    .populate({
      path: "videos",
      populate: {
        path: "owner",
        select: "username fullname email"
      }
    });
  
    const playlists_count = await Playlist.countDocuments({owner : userId})
    return res
    .status(200)
    .json(new APIResponse(200,{remained_playlist,playlists_count},"playlist successfully deleted"))
})

const updatePlaylist = asynchandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  // ✅ Check if ID is provided
  if (!playlistId) {
    throw new ApiError(400, "Playlist ID is required");
  }

  // ✅ Build update object
  const updateFields = {};
  if (name) updateFields.name = name;
  if (description) updateFields.description = description;

  // ✅ Find and update the playlist
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $set: updateFields },
    { new: true }
  )
    .populate("owner", "username fullname email")
    .populate({
      path: "videos",
      populate: {
        path: "owner",
        select: "username fullname email"
      }
    });

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res.status(200).json(
    new APIResponse(200, updatedPlaylist, "Playlist updated successfully")
  );
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}