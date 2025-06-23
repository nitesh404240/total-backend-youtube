import mongoose from "mongoose"
import {Comment} from "../models/comment_model.js"
import {ApiError} from "../utils/ApiError.js"
import {APIResponse} from "../utils/APIresponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import { Video } from "../models/video_model.js"


const getVideoComments = asynchandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId){
        throw new ApiError(404,"video id is not given")
    }

    try{
          const comments_on_video = await Comment.find({video : videoId})
          .select("content")
          .populate("owner","username avatar _id email")
          .limit(parseInt(limit))
          .skip((page-1)*limit)


          if(!comments_on_video){
            throw new ApiError(404,"couldn't fetched the comments for that video")
          }
           
          const total_comments = await Comment.countDocuments({video:videoId}).select("content")

          return res
          .status(200)
          .json(new APIResponse(200,{comments_on_video,total_comments},"comments for video fetched successfully"))
        
    }catch(error){
         throw new ApiError(500,"commnets not fetched",error)
    }

})

const addComment = asynchandler(async (req, res) => {
  const userId= req.user._id;  // from logged-in user (middleware decoded from token)
const {commentcontent} = req.body; // or req.params.videoId depending on how you pass it
const {videoId} = req.params

if(!userId || !videoId || !commentcontent){
    throw new ApiError(404,"id is not fetched or whether no comments is written")
}
//console.log(userId,videoId,commentcontent)
try{
    const comments_on_video = await Comment.create({
    content : commentcontent,
    video : videoId,
    owner : userId
})



if(!comments_on_video){
    throw new ApiError(500, "Can not add a comment to video");
}

return res
.status(200)
.json(new APIResponse(200,comments_on_video,"comment added successfully"))
}catch(error){
    throw new ApiError(500, error, "Some error occurred while adding comment");
}

})

const updateComment = asynchandler(async (req, res) => {
        // TODO: update a comment
    const {commentId} = req.params;

    const {newComment} = req.body;

   // console.log(newComment, commentId, "Comment and video_Id ");

    if (!(commentId || newComment)) {
        throw new ApiError(404, "Invalid comment_Id : can not update empty");
    }

    try {
        const updatedComment = await Comment.findByIdAndUpdate(commentId,
            {
                content: newComment
            },
            {
                new: true,
                validateBeforeSave: false
            })
        
            console.log(updatedComment,"Comment updated")

        res
        .status(200)
        .json(new APIResponse(200, updatedComment, "Comment updated successfully"))

    } catch (error) {
        throw new ApiError(500, error, "Some error occurred while updating comment");
    }

})

const deleteComment = asynchandler(async (req, res) => {
    const {commentId} = req.params

   // console.log(commentId,"Comment id")

    if (!commentId) {
        throw new ApiError(404, "Enter Comment Id to delete comment")
    }

    try {
        const comment = await Comment.findById({_id:commentId})
        
        if (!comment) {
            throw new ApiError(404, "comment not found : See if comment id is correct")
        }
       
        if (comment.owner.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not allowed to delete this comment")
        }
        
        const deletedComment = await Comment.findByIdAndDelete(commentId)
        
        if (!deletedComment) {
            throw new ApiError(500, "Comment could not deleted: try again")
        }

        res
        .status(200)
        .json(new APIResponse(200, deletedComment, "Comment deleted successfully"))
    } catch (error) {
        throw new ApiError(500, "An error occured while deleting your comment: please try again later")
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }