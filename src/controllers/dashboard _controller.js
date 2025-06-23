import mongoose from "mongoose"
import { Video } from "../models/video_model.js"
import { Subcription } from "../models/subcriptions_model.js"
import { Like } from "../models/like_model.js"
import {ApiError} from "../utils/ApiError.js"
import {APIResponse} from "../utils/APIresponse.js"
import {asynchandler} from "../utils/asynchandler.js"
import { User } from "../models/user_model.js"
import { Comment } from "../models/comment_model.js"

const getChannelStats = asynchandler(async (req, res) => {
  const userID = req.user?._id;
  console.log("🔐 userID:", userID);

  if (!userID) {
    throw new ApiError(404, "User is not logged in");
  }

  try {
    const user_dashboard_details = await User.aggregate([
      { $match: { _id: userID } },
      {
        $lookup: {
          from: "videos",
          localField: "_id",
          foreignField: "owner",
          as: "videos_by_user",
          pipeline: [
            {
              $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "video_comments"
              }
            },
            {
                  $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "video_likes"
                  }
                },{
        $addFields: {
          total_video_comments: { $size: "$video_comments" }
        }
      },
      {
        $addFields: {
          total_video_likes: { $size: "$video_likes" }
        }
      },
            {
              $project: {
                videoFile: 1,
                thumbNail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                total_video_comments:1,
                total_video_likes :1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: "subcriptions",
          localField: "_id",
          foreignField: "channel",
          as: "user_subscriber"
        }
      },
      {
        $lookup: {
          from: "subcriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "user_subscribed"
        }
      },
      
      
      {
        $addFields: {
          total_user_subscriber: { $size: "$user_subscriber" }
        }
      },
      {
        $addFields: {
          total_subscribed_by_user: { $size: "$user_subscribed" }
        }
      },
      
      {
        $addFields: {
          overall_views: {
            $sum: "$videos_by_user.views"
          }
        }
      },      {
        $project: {
          username: 1,
          avatar: 1,
          fullname: 1,
          email: 1,
          coverImage: 1,
          videos_by_user: 1,
          total_video_comments: 1,
          total_video_likes: 1,
          overall_views: 1,
      
          total_user_subscriber: 1,
          total_subscribed_by_user: 1
        }
      }
    ]);

    console.log("📊 user_dashboard_details:", JSON.stringify(user_dashboard_details, null, 2));

    if (!user_dashboard_details || user_dashboard_details.length === 0) {
      throw new ApiError(404, "Couldn't fetch the user details");
    }

    const userVideoId = await Video.find({ owner: userID }).select("_id");
    console.log("🎬 userVideoId:", userVideoId);

    const videoIds = userVideoId.map((video) => video._id);
    console.log("🎥 videoIds:", videoIds);

    const video_comment = await Comment.find({ video: { $in: videoIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("owner", "username avatar email _id");
    console.log("💬 recent video_comment:", video_comment);

    const video_like = await Like.find({ video: { $in: videoIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("likedBy", "username avatar email _id");
    console.log("👍 recent video_like:", video_like);

    return res
      .status(200)
      .json(
        new APIResponse(
          200,
          "User dashboard details fetched successfully",
          user_dashboard_details[0],
          video_comment,
          video_like
        )
      );
  } catch (error) {
    console.error("❌ Error while fetching dashboard stats:", error);
    throw new ApiError(500, "Something went wrong while fetching dashboard stats");
  }
});


const getChannelVideos = asynchandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }