import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiERROR } from "../utils/ApiERROR.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

})

const addComment = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if (!videoId?.trim()) {
        throw new ApiERROR(404, "Target video is not found")
    }

    const { content, owner } = req.body

    if (!content || !owner) {
        throw new ApiERROR(400, "Content and owner fields are required");
    }

    if (!isValidObjectId(owner)) {
        throw new ApiERROR(400, "Invalid owner ID");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner
    })

    if (!comment) {
        throw new ApiERROR(400, "Error while adding the comment")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!commentId && !commentId.trim()) {
        throw new ApiERROR(400, "No comment found")
    }

    const { content } = req.body

    if (!content || content === "") {
        throw new ApiResponse(400, "Content field is empty")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!commentId && !commentId.trim()) {
        throw new ApiERROR(400, "No comment found")
    }

    await Comment.findByIdAndDelete(commentId)

    return res
        .status(200)
        .json(new ApiResponse(400, null, "Comment deleted successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}