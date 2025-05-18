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
    //destination: Sets the folder where files will be stored temporarily — here it’s ./public/temp
    //this is the destination that will be used in callback
  },
  filename: function (req, file, cb) {
    //filename: Uses the original file name for saving the file
    cb(null, file.originalname)
    //callback
  }
})
//the local path and original file name will be returned in callback function
export const upload = multer(
    { 
        storage : storage
     }
)
//i used this in user_routes
// router.post("/register", upload.fields([
//   { name: "avatar", maxCount: 1 },
//   { name: "coverImage", maxCount: 1 }
// ]), registerUser);
// This line tells Express:
// “When the /register route receives a request with a file upload, use multer to extract files from the avatar and coverImage fields and store them in public/temp/.”
