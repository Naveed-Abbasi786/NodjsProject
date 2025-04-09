import { asyncHandler } from "../utlls/asyncHandler.js";
import {ApiError} from "../utlls/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utlls/fileUpload.js";
import { ApiResponse } from "../utlls/apiResponse.js";
//get user details from frontend
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from respon
// check for user creation
// return res

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  const { fullName, userName, email, password } = req.body;
  console.log("userName", userName);

  //  RECOMMENDED: Clean and professional validation style
  // validation - not empty

  if ([fullName, userName, email, password].some((field) => !field)) {
    throw new ApiError(400, "All fields are required");
  }
  // Check email format validity
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, "Email is not valid");
  }

  //  NOT RECOMMENDED: Old if-else validation style
  //  This approach becomes repetitive, harder to manage in large apps
  /*
  if(fullName===''){
    throw new ApiError(400, "Full name is required", [], "fullName is empty");
  }
  else if(userName===''){
    throw new ApiError(400, "User name is required", [], "userName is empty");
  }
      
  if ([fullName, userName, email, password].some((item) => 
    item === undefined || item === null || item === "")
  ) {
    throw new ApiError(400, "All fields are required", [], "All fields are required");
  }
    */

  // check if user already exists: username, email
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError(408, "User already exists");
  }

  // check for images, check for avatar
  const avatarLocalPath = req?.files?.avatar?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  

  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  if (!coverLocalPath) {
    throw new ApiError(400, "coverLocalPath is required");
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }
  if (!coverImage) {
    throw new ApiError(400, "Cover is required");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
  });

  // remove password and refresh token field from respon
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return res
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User created successfully"));
});

export { registerUser };
