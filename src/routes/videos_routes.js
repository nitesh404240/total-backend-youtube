import { verifyJWT } from "../middlewares/auth_middleware.js";
import { upload } from "../middlewares/multer_middleware.js";

import { get_all_user_videos, get_video_by_videoid, publishAVideo ,updateVideo ,deleteVideo,togglePublishStatus} from "../controllers/video_controller.js";

import { Router } from "express";
const router = Router()

router.route("/").get(verifyJWT,get_all_user_videos)


router.route("/publichAvideo").post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbNail",
                maxCount: 1,
            },
            
        ]),verifyJWT,publishAVideo );

router.route("/c/:videoId").get(get_video_by_videoid)  


router.route("/c/:videoId/update-video").patch(upload.fields([{  //in params we need to pass data in url 
        name : "thumbNail",
        maxCount : 1
     }]), updateVideo); 

router.route("/c/:videoId").delete(deleteVideo)  

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
export default router