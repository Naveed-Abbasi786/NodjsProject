import { asyncHandler } from "../utlls/asyncHandler.js";
import { ApiError } from "../utlls/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utlls/fileUpload.js";
import { ApiResponse } from "../utlls/apiResponse.js";


const genertaAccesTokenAndRefreshToken= async(userid)=>{
  try {
    const user= await User.findById(userid)
    const accessToken= user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    user.refreshToken=refreshToken
    user.save({validateBeforeSave:false})

    return {accessToken,refreshToken}

  } catch (error) {
     throw new ApiError(500,'Somethin went wrong while generating tokens')
  }

}


const registerUser = asyncHandler(async (req, res) => {
// validation - not empty
// check if user already exists: username, email
// check for images, check for avatar
// upload them to cloudinary, avatar
// create user object - create entry in db
// remove password and refresh token field from respon
// check for user creation
// return res

  
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

  let coverImageLocalPath;

  // Check if coverImage exists and is an array, then get the 0th element path
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  } else {
    console.log("Cover image not uploaded");
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
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
    coverImage: coverImage?.url || "",
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




  const loginUser = asyncHandler(async (req, res) => {
    // request body
    // get user details from frontend
    //  Find the user by email or username
    // password Check
    // access and refresh token generation
    // send cokkies

    const { userName,email, password } = req.body;

    if (!(userName || email)) {
      throw new ApiError(400, "User name or email is required");
    }

    const user = await User.findOne({
      $or: [{ email }, { userName }],
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
    }
    
    const { accessToken, refreshToken } = await genertaAccesTokenAndRefreshToken(user._id)


    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');
    
    const options={
      httpOnly:true,
      secure:true
    }

    return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
          hello:'ee'
        },
        'User LoggedIn successfully'
      )
    );

  
});



const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200,"User logged out successfully"));
});


export { registerUser, loginUser ,logoutUser };
