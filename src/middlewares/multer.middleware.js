// If you tried to handle file uploads without multer (or a similar library), Express wouldn't know how to extract the file from the incoming HTTP request.
// That means No file gets saved req.file is undefined You can't send it to Cloudinary or process it
import multer from "multer";

//multer as the bridge between a user's file 
// input (like in a form or mobile app) and your 
// Node.js backend.


//when we use our local memory as a storage place it will get filled soon
//so will be use the disk for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
    //this is the destination that will be used in callback
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)
    //callback
  }
})
//the local path and original file name will be returned in callback function
const upload = multer(
    { 
        storage
     }
)

