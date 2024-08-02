import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiERROR } from "../utils/ApiERROR.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content, owner } = req.body

    if (!content || !owner) {
        throw new ApiERROR(400, "Content and owner fields are required");
    }

    if (!isValidObjectId(owner)) {
        throw new ApiERROR(400, "Invalid owner ID");
    }

    //check if user exists
    const userExists = await User.findById(owner)
    if (!userExists) {
        throw new ApiERROR(404, "User not found");
    }

    const tweet = await Tweet.create({
        owner,
        content,
    })

    if (!tweet) {
        throw new ApiERROR(404, "Error while creating the tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!tweetId || !tweetId?.trim()) {
        throw new ApiERROR(404, "Tweet not found")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiERROR(400, "Invalid tweet ID");
    }

    const { content } = req.body

    if (!content || content === "") {
        throw new ApiERROR(400, "No content found")
    }

    const updateTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        { new: true }
    )

    if (!updateTweet) {
        throw new ApiERROR(400, "Error while updating the tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!tweetId || !tweetId?.trim()) {
        throw new ApiERROR(404, "Tweet not found")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiERROR(400, "Invalid tweet ID");
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}