import { Router } from "express";
import {upload} from "../middlewares/multer_middleware.js"
import { registerUser } from "../controllers/user_controller.js";
const router = Router();

//this is the middleware just before the register user post request 
//that check the field avatar and image 
//this is a check up middlware that locally save the files in public/temp folder in which we can save it 
router.route("/register").post(
upload.fields([
    {
        //// “When the /register route receives a request with a file upload,
        //  use multer to extract files from the avatar and coverImage
        //  fields and store them in public/temp/.”
        name : "avatar",
        maxCount : 1
    },
    {
        name : "coverImage",
        maxcount : 1
    }
]),registerUser)


export default router

//=============  WITHOUT ASYNCHANDLER FUNCITON THE CODE WOULD BE LIKE THIS FOR EVERY ROUTE=======

// router.post("/register", async (req, res, next) => {
//   try {
//     // Some asynchronous logic here (e.g., DB call)
//     res.status(201).json({ message: "User registered" });
//   } catch (error) {
//     next(error); // Manually passing error to the next middleware
//   }
// });
