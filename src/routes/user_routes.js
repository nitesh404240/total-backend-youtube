import { Router } from "express";
import {upload} from "../middlewares/multer_middleware.js"
import { registerUser } from "../controllers/user_controller.js";
import { loginUser } from "../controllers/user_controller.js";
import { logoutUser } from "../controllers/user_controller.js";
import {verifyJWT} from "../middlewares/auth_middleware.js";
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
        maxCount : 1
    }

//     Parses the multipart form// Extracts the file from the avatar field// Saves the file temporarily on your server (e.g., in public/temp/) Attaches file info to req.files
]),registerUser)

router.route("/login").post(loginUser)
//secured routes 
//thats why we used to write next at end of the code
//if there is multiple middleware use next in them and write it between in post 
 router.route("/logout").post(verifyJWT,logoutUser)
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
