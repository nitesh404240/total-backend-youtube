import { Router } from "express";

import {verifyJWT} from "../middlewares/auth_middleware.js";

import { toggleSubscription ,getUserChannelSubscribers,getSubscribedChannels } from "../controllers/subcription_controller.js";

const router = Router()

router.route("/").post(verifyJWT,toggleSubscription)
router.route("/c/:channelId").get(verifyJWT,getUserChannelSubscribers)
router.route("/u/:subscriberId").get(verifyJWT,getSubscribedChannels)
export default router