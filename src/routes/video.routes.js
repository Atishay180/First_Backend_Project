import { Router } from "express";
import { upload } from "../middewares/multer.middleware.js";
import { verifyJWT } from "../middewares/auth.middleware.js";
import { publishAVideo, getVideoById } from "../controllers/video.controller.js"

const router = Router()
router.use(verifyJWT)

router.route('/upload-video').post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },

        ]),
        publishAVideo
    );

router.route("/:videoId").get(getVideoById)

export default router