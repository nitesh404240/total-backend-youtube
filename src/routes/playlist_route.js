import { Router } from 'express';
import { addVideoToPlaylist, createPlaylist ,getUserPlaylists,removeVideoFromPlaylist,updatePlaylist,getPlaylistById,deletePlaylist} from '../controllers/playlist_controller.js';
import {verifyJWT} from "../middlewares/auth_middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createPlaylist)

router.route("/:playlistId").get(getPlaylistById)
router.route("/:playlistId").patch(updatePlaylist)
router.route("/:playlistId").delete(deletePlaylist);

 router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
 router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

 router.route("/user/:userId").get(getUserPlaylists);

export default router