import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiERROR } from "../utils/ApiERROR.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiERROR(400, "Name & description are requrired field")
    }

    const playlist = await Playlist.create({
        name,
        description,
    })

    if (!playlist) {
        throw new ApiERROR(404, "Error while creating the playlist")
    }
    
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist succesfully created"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId && !playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiERROR(400, "Invalid or missing playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiERROR(404, "Playlist not found")
    }
        

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId && !playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiERROR(400, "Invalid or missing playlist ID")
    }

    if (!videoId && !videoId.trim() || !isValidObjectId(videoId)) {
        throw new ApiERROR(400, "Invalid or missing video ID")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { video: videoId }
        },
        { new: true }
    )

    if (!playlist) {
        throw new ApiERROR(404, "Playlist not found")
    }    

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId && !playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiERROR(400, "Invalid or missing playlist ID")
    }

    if (!videoId && !videoId.trim() || !isValidObjectId(videoId)) {
        throw new ApiERROR(400, "Invalid or missing video ID")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { video: videoId },
        },
        { new: true }
    )

    if (!playlist) {
        throw new ApiERROR(404, "Error while deleting the playlist")
    }    

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video deleted successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId && !playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiERROR(400, "Invalid or missing playlist ID")
    }

    const playlist = await Playlist.findByIdAndDelete(playlistId)

    if (!playlist) {
        throw new ApiERROR(400, "Error while deleting the playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!playlistId && !playlistId.trim() || !isValidObjectId(playlistId)) {
        throw new ApiERROR(400, "Invalid or missing playlist ID")
    }

    if (name === "" || description === "") {
        throw new ApiERROR(400, "Name & description is required field")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    )

    if (!playlist) {
        throw new ApiERROR(400, "Error while updating the playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}