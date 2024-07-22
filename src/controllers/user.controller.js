import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiERROR } from "../utils/ApiERROR.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

// method to generateAccessAndRefreshTokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //save refresh token on db
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiERROR(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    //1. get user details fron frontend
    //2. validation - not empty
    //3. check if user already exists: username, email
    //4. check for images, check for avatar
    //5. upload them to cloudinary, avatar
    //6. create user object - create entry in db
    //7. remove password and refresh token frield from response
    //8. check for user creation
    //9. return response

    //step-1 get user details fron frontend
    const { fullName, email, username, password } = req.body

    //step-2 validation - not empty
    if (fullName === "") {
        throw new ApiERROR(400, "fullname is required")
    }
    else if (email === "") {
        throw new ApiERROR(400, "email is required")
    }
    else if (username === "") {
        throw new ApiERROR(400, "username is required")
    }
    else if (email === "") {
        throw new ApiERROR(400, "email is required")
    }
    else if (password === "") {
        throw new ApiERROR(400, "password is required")
    }

    // step-3 check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiERROR(409, "User with email or username already exists")
    }

    //step-4 check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiERROR(400, "Avatar file is required")
    }

    //step-5 upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiERROR(400, "Avatar file is required")
    }

    //step-6 create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // step-7 remove password and refresh token frield from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //what you don't want 
    ).lean()

    //step-8 check for user creation
    if (!createdUser) {
        throw new ApiERROR(500, "Something went wrong while registering the user")
    }

    // step-9 return response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User Registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie
    //succesfully logged in

    //1- req body -> data
    const { email, username, password } = req.body

    //2- username or email
    if (!username && !email) {
        throw new ApiERROR(400, "username or email is required")
    }

    //3- find user
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiERROR(404, "User does not exist")
    }

    //4- password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiERROR(401, "Invalid user credentials")
    }

    //5- access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //6- send cookie
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out "))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (incomingRefreshToken) {
        throw new ApiERROR(401, "Unauthorized request")
    }

    try {
        //convert incoming token into decoded token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiERROR(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiERROR(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiERROR(401, error?.message || "Invalid refresh token")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}