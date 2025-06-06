import mongoose, { Schema } from "mongoose";

const subcriptionSchema = new mongoose.Schema({

subscriber :{
    type : mongoose.Schema.Types.ObjectId,  //one who is subcribing
    ref : "User"
}
,
channels : {
  type : mongoose.Schema.Types.ObjectId,  //one who is subcribers is subscribing
    ref : "User"
}

},{timestamps:true})

export const Subcription = mongoose.model("Subcription",subcriptionSchema)