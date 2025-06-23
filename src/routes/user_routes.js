import { Router } from "express";
import {upload} from "../middlewares/multer_middleware.js"
import { changePassword, get_current_user, get_user_subcription, RefreshAccessToken, registerUser,  update_user_avatar,  updateProfile, watchHistory } from "../controllers/user_controller.js";
import { loginUser } from "../controllers/user_controller.js";
import { logoutUser } from "../controllers/user_controller.js";
import {verifyJWT} from "../middlewares/auth_middleware.js";

const router = Router();

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

 router.route("/logout").post(verifyJWT,logoutUser)

 router.route("/refresh-token").post(RefreshAccessToken)

 router.route("/change-password").post(changePassword)

 router.route("/get-current-user").post(verifyJWT,get_current_user)

 router.route("/update-profile").patch(verifyJWT,updateProfile)

 router.route("/update-avatar").patch(
    upload.fields([
        {name : "avatar",maxCount : 1}])
        ,verifyJWT , update_user_avatar)

router.route("/c/:username").get(verifyJWT,get_user_subcription)

router.route("/c/:username/watch-history").get(verifyJWT,watchHistory)

export default router


