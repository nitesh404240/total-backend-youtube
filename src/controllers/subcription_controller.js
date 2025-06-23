import { Subcription } from "../models/subcriptions_model.js"
import { ApiError } from "../utils/ApiError.js"
import { APIResponse } from "../utils/APIresponse.js"
import { User } from "../models/user_model.js"
import { asynchandler } from "../utils/asynchandler.js"


const toggleSubscription = asynchandler(async (req, res) => {
  let { channelId, subscriberId } = req.body;

  if(!subscriberId){
    subscriberId = req.user._id
  }

if(channelId === subscriberId){
    throw new ApiError(404,"you cannot subscribe to your own")
}

  if (!channelId || !subscriberId) {
    throw new ApiError(400, "Details are missing");
  }

  // Check if already subscribed
  const isSubscribed = await Subcription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (isSubscribed) {
    await Subcription.findByIdAndDelete({_id:isSubscribed._id})
    return res
      .status(200)
      .json(new APIResponse(200, isSubscribed, "Channel is unsubscribed"));
  }



  // Create new subscription
  const newSubscription = await Subcription.create({
    subscriber: subscriberId,
    channel: channelId,
  });

  const populatedSubscription = await Subcription.findById(newSubscription._id)
    .populate("subscriber", "username fullName _id")
    .populate("channel", "username fullName _id");


  return res
    .status(200)
    .json(
      new APIResponse(200, populatedSubscription, "Subscription has been successfully done")
    );
});


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asynchandler(async (req, res) => {
    const {channelId} = req.params
//console.log(channelId)
    if(!channelId){
        throw new ApiError(404,"channel id is not provided ")
    }

    const list_of_subscribers = await Subcription.find({channel : channelId}).populate("subscriber","username fullname email _id")
    //console.log(list_of_subscribers)

    const total_subscriber = await Subcription.countDocuments({channel:channelId})
    return res
    .status(200)
    .json(new APIResponse(200,{list_of_subscribers,total_subscriber},"channel subscriber fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asynchandler(async (req, res) => {
    const { subscriberId } = req.params

    const subcriberIdd = subscriberId||req.user._id
     
//console.log(subcriberIdd)
    if(!subcriberIdd){
        throw new ApiError(404,"subscriber id is not provided ")
    }

    const list_of_channels = await Subcription.find({subscriber : subcriberIdd}).populate("channel","username fullname email _id")
    //console.log(list_of_channels)

    const total_channel_subscribed = await Subcription.countDocuments({subscriber:subcriberIdd})
    return res
    .status(200)
    .json(new APIResponse(200,{list_of_channels,total_channel_subscribed},"subscribed channel fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}