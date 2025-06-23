import { ApiError } from "../utils/ApiError.js";
import { APIResponse } from "../utils/APIresponse.js";
import { uploadOncloudinary } from "../utils/cloudinary_service.js";
import { asynchandler } from "../utils/asynchandler.js"; 
import { Video } from "../models/video_model.js";
import { User } from "../models/user_model.js";
import { Tweet } from "../models/tweet_model.js";
import { Like } from "../models/like_model.js";
import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";

const createTweet = asynchandler(async (req, res) => {
    //TODO: create tweet
    const {tweetToBeCreated} = req.body;

    // console.log(tweetToBeCreated, "tweet")
    if (!tweetToBeCreated) {
        throw new ApiError(404, "No tweet created by user")
    }

    try {
        const createdTweet = await Tweet.create(
            {
                content:tweetToBeCreated,
                owner:req.user._id
             })
      console.log(createdTweet,"created tweet")       
      if (!createdTweet) {
          throw new ApiError(500, "Tweet could not be created")
      }
      res
      .status(200)
      .json(new APIResponse(200, createdTweet,"Tweet created successfully"))

    } catch (error) {
        throw new ApiError(500, error, "Error creating tweet")
    }
})

const getUserTweets = asynchandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user?._id;

  // Step 0: Validate incoming user ID
  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Enter a valid user ID");
  }

  try {
    const userTweets = await Tweet.aggregate([
      {
        // Step 1: Match tweets owned by the requested user
        $match: {
          owner: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        // Step 2: Populate the owner details for each tweet
        // (joins data from 'users' collection where user._id matches tweet.owner)
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "tweetOwner",
          pipeline: [
            {
              // Only return selected user fields to keep response clean
              $project: {
                _id: 1,
                username: 1,
                avatar: 1
              }
            }
          ]
        }
      },
      {
        // Step 3: Flatten the tweetOwner array into a single object
        $addFields: {
          tweetOwner: { $first: "$tweetOwner" }
        }
      },
      {
        // Step 4: Lookup all likes on this tweet
        // Each like has a 'likedBy' (user ID), 'tweet' (tweet ID), etc.
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "tweet",
          as: "likes"
        }
      },
      {
        // Step 5: // I’m using lookup to get user data of people who liked this tweet
// I use $$likerIds from the likes array, and match against _id in users collection
// Then I limit to top 3 and only pick username and avatar

        // (simulate "top likers" like Instagram does)
        $lookup: {
          from: "users",

          // We use the likedBy user IDs from the likes to match users
          let: { likerIds: "$likes.likedBy" },

          pipeline: [
            {
              // Match users whose _id is in the likerIds array
              $match: {
                $expr: { $in: ["$_id", "$$likerIds"] }
              }
            },
            {
              // Only return basic public info of each user
              $project: {
                _id: 1,
                username: 1,
                avatar: 1
              }
            },
            {
              // Limit to just 3 users to reduce response size
              $limit: 3
            }
          ],
          as: "topLikers"
        }
      },
      {
        // Step 6: Add computed fields like totalLikes and isLikedByCurrentUser
        $addFields: {
          // Total number of likes = size of likes array
          totalLikes: { $size: "$likes" },

          // Check if the currently logged-in user has liked this tweet
          // $map creates an array of user IDs from the likes
          // $in checks if currentUserId is inside that array
          isLikedByCurrentUser: {
            $in: [
              new mongoose.Types.ObjectId(currentUserId),
              {
                $map: {
                  input: "$likes",       // loop over each like object
                  as: "like",            // call each item "like"
                  in: "$$like.likedBy"   // return likedBy user ID from each like
                }
              }
            ]
          }
        }
      },
      {
        // Step 7: Final projection — only include necessary fields in the response
        $project: {
          content: 1,               // tweet content
          createdAt: 1,             // when the tweet was posted
          tweetOwner: 1,            // user info of tweet author
          topLikers: 1,             // top 3 users who liked it
          totalLikes: 1,            // total like count
          isLikedByCurrentUser: 1   // whether current user has liked it
        }
      },
      {
        // Step 8 (optional): Sort tweets so latest appears first
        $sort: { createdAt: -1 }
      }
    ]);

    // Step 9: Count how many tweets the user has (useful for frontend stats/pagination)
    const total_tweets_by_user = await Tweet.countDocuments({ owner: userId });

    // Step 10: Send final response
    res.status(200).json(
      new APIResponse(200, {
        userTweets,
        total_tweets_by_user
      }, "User Tweets fetched")
    );
  } catch (error) {
    throw new ApiError(500, error, "Could not fetch tweets");
  }
});

const updateTweet = asynchandler(async (req, res) => {
  const {tweet_Id} = req.params
    const {tweet} = req.body

    //console.log(tweet,tweet_Id ,"tweet and its id")

    if (!(tweet || tweet_Id)) {
        throw new ApiError(403, "tweet or tweet_Id is not provided")
    }
    try {
        const existingTweets = await Tweet.findOne({ _id: tweet_Id, owner: req.user._id });
        console.log(existingTweets,"Tweets fetched")
        if (!existingTweets) {
            console.log(existingTweets, "not auhtenticated user")
             throw new ApiError(401, `Tweet not found u can not update this: ${req.user.username} :tweet`)
        }
        const updatedTweet = await Tweet.findByIdAndUpdate(tweet_Id,
                  {
                    content : tweet
                  }
                  ,{new :true,validateBeforeSave:false}
             )

        if (!updatedTweet) {
            throw new ApiError(403, "Something went wrong")
        }

        res
        .status(200)
        .json(new APIResponse(200, updatedTweet, "Tweet has been updated"))

    } catch (error) {
        throw new ApiError(500, error, "Error updating tweet : Try again later")
    }
})//DONE!

/*--------------------DELETEtWEET----------------*/

const deleteTweet = asynchandler(async (req, res) => {
    //TODO: delete tweet
    const {tweet_Id} = req.params

    if (!tweet_Id) {
        throw new ApiError(404,"Enter tweet_Id tp delete tweet")
    }

    try {
        if (!isValidObjectId(tweet_Id)) {
            throw new ApiError(404,"Invalid tweet_Id :Enter valid tweet_Id")
        }

        const tweet = await Tweet.findById(tweet_Id)

        if (!( tweet || ( tweet.owner.toString() !== req.user._id.toString()) )){
                throw new ApiError(403, "You can not delete this tweet")
        }
        
       const deleteTweet = await Tweet.deleteOne({_id:tweet_Id})

       if (!deleteTweet) {
        throw new ApiError(500, "Delete tweet failed")
       }

       res
       .status(200)
       .json(new APIResponse(200, deleteTweet, "Your tweet has been deleted"))

    } catch (error) {
        throw new ApiError(500, error, "Something went wrong while deleting your tweet :Try again")
    }
})
export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}