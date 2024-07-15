import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiERROR } from "../utils/ApiERROR.js"
import { User } from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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

    //step-1
    const { fullName, email, username, password } = req.body
    console.log("email: ", email);

    //step-2
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

    // step-3
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiERROR(409, "User with email or username already exists")
    }

    //step-4
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImageLocalPath[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiERROR(400, "Avatar file is required")
    }

    //step-5
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiERROR(400, "Avatar file is required")
    }

    //step-6
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // step-7
    const createdUser = User.findById(user._id).select(
        "-password -refreshToken" //what you don't want 
    )

    //step-8
    if(!createdUser) {
        throw new ApiERROR(500, "Something went wrong while registering the user")
    }

    // step-9
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered Successfully")
    )
})

export { registerUser }