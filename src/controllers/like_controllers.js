
import {mongoose, Schema,isValidObjectId} from "mongoose"

import {ApiError} from "../utils/ApiError.js"
import { APIResponse } from "../utils/APIresponse.js"
import { asynchandler } from "../utils/asynchandler.js"
import { app } from "../app.js"

import { Like } from "../models/like_model.js"
import { Video } from "../models/video_model.js"
import { User } from "../models/user_model.js"
import { Comment } from "../models/comment_model.js"

const toggleVideoLike = asynchandler(async (req, res) => {
  const userId = req.user._id;
  const { videoId } = req.params;

  // Check required IDs
  if (!userId || !videoId) {
    throw new ApiError(400, "User ID and Video ID are required");
  }

  try {
    // Check if the user has already liked this video
    const existingVideoLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingVideoLike) {
      // User already liked → remove the like (toggle off)
      await Like.deleteOne({ _id: existingVideoLike._id });
      return res
      
        .status(200)
        .json(new APIResponse(200, null, "Like has been removed successfully from video"));
    }

    // User has not liked yet → create a new like
    const likeVideo = await Like.create({
      video: videoId,
      likedBy: userId
    });

    if (!likeVideo) {
      throw new ApiError(500, "Video not liked successfully");
    }

    return res
      .status(200)
      .json(new APIResponse(200, likeVideo, "Video liked successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "An error occurred during like toggle");
  }
});

const toggleCommentLike = asynchandler(async(req,res)=>{
  const userId = req.user._id;
  const { commentId } = req.params;

  // Check required IDs
  if (!userId || !commentId) {
    throw new ApiError(400, "User ID and comment ID are required");
  }

  try {
    // Check if the user has already liked this video
    const existingcommentLike = await Like.findOne({ comment: commentId, likedBy: userId });

    if (existingcommentLike) {
      // User already liked → remove the like (toggle off)
      await Like.deleteOne({ _id: existingcommentLike._id });
      return res
        .status(200)
        .json(new APIResponse(200, null, "Like has been removed successfully from comment"));
    }

    // User has not liked yet → create a new like
    const likecomment = await Like.create({
      comment: commentId,
      likedBy: userId
    });

    if (!likecomment) {
      throw new ApiError(500, "comment not liked successfully");
    }

    return res
      .status(200)
      .json(new APIResponse(200, likecomment, "comment liked successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "An error occurred during like toggle");
  }
})
const toggleTweetLike = asynchandler(async(req,res)=>{
const userId = req.user._id;
  const { tweetId } = req.params;

  // Check required IDs
  if (!userId || !tweetId) {
    throw new ApiError(400, "User ID and tweet ID are required");
  }

  try {
    // Check if the user has already liked this video
    const existingtweetLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (existingtweetLike) {
      // User already liked → remove the like (toggle off)
      await Like.deleteOne({ _id: existingtweetLike._id });
      return res
        .status(200)
        .json(new APIResponse(200, null, "Like has been removed successfully from tweet"));
    }

    // User has not liked yet → create a new like
    const liketweet = await Like.create({
      tweet: tweetId,
      likedBy: userId
    });

    if (!liketweet) {
      throw new ApiError(500, "tweet not liked successfully");
    }

    return res
      .status(200)
      .json(new APIResponse(200, liketweet, "tweet liked successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "An error occurred during like toggle");
  }
})
const getLikedVideos = asynchandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  try {
    const likedVideos = await Like.aggregate([
      {
        // Match only likes on videos by the current user
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
          video: { $ne: null }
        }
      },
      {
        // Lookup the full video details
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "videoDetails"
        }
      },
      {
        // Flatten the video array to object
        $addFields: {
          videoDetails: { $first: "$videoDetails" }
        }
      },
      {
        // Lookup video owner's details using videoDetails.owner
        $lookup: {
          from: "users",
          localField: "videoDetails.owner",
          foreignField: "_id",
          as: "videoOwner"
        }
      },
      {
        // Flatten the owner array to object
        $addFields: {
          videoOwner: { $first: "$videoOwner" }
        }
      },
      {
        // Select only the fields we want to send
        $project: {
          _id: 0,
          videoId: "$videoDetails._id",
          title: "$videoDetails.title",
          description: "$videoDetails.description",
          thumbnail: "$videoDetails.thumbnail",
          createdAt: "$videoDetails.createdAt",
          owner: {
            _id: "$videoOwner._id",
            username: "$videoOwner.username",
            avatar: "$videoOwner.avatar"
          }
        }
      },
      {
        // Optional: sort by most recently liked (depends on Like schema's timestamps)
        $sort: { createdAt: -1 }
      }
    ]);

    return res.status(200).json(
      new APIResponse(200, { likedVideos, total: likedVideos.length }, "Liked videos fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, error.message || "An error occurred while fetching liked videos");
  }
});
const getLikedComments = asynchandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  try {
    const likedComments = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
          comment: { $ne: null }
        }
      },
      {
        $lookup: {
          from: "comments",
          localField: "comment",
          foreignField: "_id",
          as: "commentDetails"
        }
      },
      {
        $addFields: {
          commentDetails: { $first: "$commentDetails" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "commentDetails.owner",
          foreignField: "_id",
          as: "commentOwner"
        }
      },
      {
        $addFields: {
          commentOwner: { $first: "$commentOwner" }
        }
      },
      {
        $project: {
          _id: 0,
          commentId: "$commentDetails._id",
          content: "$commentDetails.content",
          createdAt: "$commentDetails.createdAt",
          owner: {
            _id: "$commentOwner._id",
            username: "$commentOwner.username",
            avatar: "$commentOwner.avatar"
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return res.status(200).json(
      new APIResponse(200, { likedComments, total: likedComments.length }, "Liked comments fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, error.message || "Error while fetching liked comments");
  }
});

const getLikedTweets = asynchandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  try {
    const likedTweets = await Like.aggregate([
      {
        $match: {
          likedBy: new mongoose.Types.ObjectId(userId),
          tweet: { $ne: null }
        }
      },
      {
        $lookup: {
          from: "tweets",
          localField: "tweet",
          foreignField: "_id",
          as: "tweetDetails"
        }
      },
      {
        $addFields: {
          tweetDetails: { $first: "$tweetDetails" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "tweetDetails.owner",
          foreignField: "_id",
          as: "tweetOwner"
        }
      },
      {
        $addFields: {
          tweetOwner: { $first: "$tweetOwner" }
        }
      },
      {
        $project: {
          _id: 0,
          tweetId: "$tweetDetails._id",
          content: "$tweetDetails.content",
          createdAt: "$tweetDetails.createdAt",
          owner: {
            _id: "$tweetOwner._id",
            username: "$tweetOwner.username",
            avatar: "$tweetOwner.avatar"
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return res.status(200).json(
      new APIResponse(200, { likedTweets, total: likedTweets.length }, "Liked tweets fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, error.message || "Error while fetching liked tweets");
  }
});

export {
     toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedComments,
    getLikedTweets
}




