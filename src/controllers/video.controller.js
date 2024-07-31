import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiERROR } from "../utils/ApiERROR.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (title === "") {
        throw new ApiERROR(400, "Title is required")
    }
    if (description === "") {
        throw new ApiERROR(400, "Description is required")
    }

    const thumbnailPath = req.files?.thumbnail[0].path
    if (!thumbnailPath) {
        {
            throw new ApiERROR(400, "Thumbnail is required")
        }
    }

    const videoFilePath = req.files?.videoFile[0]?.path
    if (!videoFilePath) {
        throw new ApiERROR(400, "Video file is required")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailPath)
    const videoFile = await uploadOnCloudinary(videoFilePath)

    if (!thumbnail) {
        throw new ApiERROR(500, "Failed to upload thumbnail to Cloudinary")
    }
    if (!videoFile) {
        throw new ApiERROR(500, "Failed to upload videoFile to Cloudinary")
    }

    const duration = videoFile.duration

    if (!duration) {
        throw new ApiERROR(500, "Failed to retrieve video duration");
    }

    const video = await Video.create({
        title,
        description,
        thumbnail: thumbnail.url,
        videoFile: videoFile.url,
        duration,
        owner: req.user._id
    })

    if (!video) {
        throw new ApiERROR(500, "Something went wrong while uploading the video")
    }

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video uploaded successfully"))

    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId?.trim()) {
        throw new ApiERROR(400, "Something went wrong, please try again ")
    }

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiERROR(400, "Invalid Id format, please try again")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiERROR(404, "Video not found, please try again")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId?.trim()) {
        throw new ApiERROR(400, "Video not found")
    }

    const videoUrl = await Video.findById(videoId)

    if (!videoUrl) {
        throw new ApiERROR(404, "Video not found")
    }

    const { title, description } = req.body

    let thumbnail;
    if (req.file && req.file.path) {
        const thumbnailUrl = req.file?.path
        if (!thumbnailUrl) {
            throw new ApiERROR(400, "Thumbnail not found");
        }
        thumbnail = await uploadOnCloudinary(thumbnailUrl)

        if (!thumbnail.url) {
            throw new ApiERROR(400, "Error while uploading the thumbnail");
        }
    }

    const updateDetails = {}

    if (title && title != "") {
        updateDetails.title = title
    }
    if (description && description != "") {
        updateDetails.description = description
    }
    if (thumbnail && thumbnail.url) {
        updateDetails.thumbnail = thumbnail.url
    }

    console.log(updateDetails);

    const video = await Video.findByIdAndUpdate(
        videoUrl,
        { $set: updateDetails },
        { new: true }
    )

    if(!video){
        throw new ApiERROR(500, "Something went wrong, please try again")
    }

    res
    .status(200)
    .json(new ApiResponse(200, video, "Updated Successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId?.trim()) {
        throw new ApiERROR(400, "Video not found")
    }

    const videoUrl = await Video.findById(videoId)

    if (!videoUrl) {
        throw new ApiERROR(404, "Video not found")
    }

    await Video.findByIdAndDelete(videoUrl)

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId?.trim()) {
        throw new ApiERROR(400, "Video not found")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiERROR(404, "Video not found")
    }
    
    const publishStatus = video.isPublished
    return res
    .status(200)
    .json(new ApiResponse(200, publishStatus, "Public status toggled successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}