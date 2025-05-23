import { asyncHandler } from "../utlls/asyncHandler.js";
import { ApiError } from "../utlls/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utlls/fileUpload.js";
import { ApiResponse } from "../utlls/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const genertaAccesTokenAndRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Somethin went wrong while generating tokens");
  }
};

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

  const { userName, email, password } = req.body;

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

  const { accessToken, refreshToken } = await genertaAccesTokenAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
          hello: "ee",
        },
        "User LoggedIn successfully"
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
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is Expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await genertaAccesTokenAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accesToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Acces token refresh"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message);
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed succesfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched"));
});

const updateUserAvatar=asyncHandler(async (req,res)=>{
  const avatarLocalPath = req.file?.path;


  if(!avatarLocalPath){
    throw new ApiError(401,'Avatar is required')
  }

  const avatar=await uploadOnCloudinary(avatarLocalPath)

  const user= await User.findByIdAndUpdate(req.user?._id,{
    $set:{
      avatar:avatar.url
    }
  },{new:true}).select("-password")

   return res.status(200).json(new ApiResponse(200,user,"Avatar updated Succesfuly"))

})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, fullName } = req.body;

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!(email || fullName || avatarLocalPath || coverLocalPath)) {
    throw new ApiError(401, "At least one field (email, fullName, avatar, or coverImage) is required");
  }

  const avatarUpdate = avatarLocalPath ? await uploadOnCloudinary(avatarLocalPath) : null;
  const coverImageUpdate = coverLocalPath ? await uploadOnCloudinary(coverLocalPath) : null;

  const updateData = {};

  if (email) updateData.email = email;
  if (fullName) updateData.fullName = fullName;
  if (avatarUpdate) updateData.avatar = avatarUpdate.url;
  if (coverImageUpdate) updateData.coverImage = coverImageUpdate.url;

  const user = await User.findByIdAndUpdate(req.user?._id, { $set: updateData }, { new: true }).select("-password");

  return res.status(200).json(new ApiResponse(200, user, "Account updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params;

  if (!userName?.trim()) {
    throw new ApiError(401, 'Username is missing');
  }

  const channel = await User.aggregate([
    {
      // Pehle match kar rahe hain ke jis userName ko dhoondhna hai wo mil jaye
      $match: {
        userName: userName?.toLowerCase() // lowerCase taake exact match ho
      }
    },
    {
      // Pehla lookup: 'subscription' collection se woh records lao jahan
      // 'User._id' == 'subscription.channel'
      $lookup: {
        from: "subscription",          // doosri collection jahan se data lana hai
        localField: '_id',             // current collection ka field (User._id)
        foreignField: 'channel',       // dusri collection ka field jisse match karna hai
        as: 'subscribers'              // jo result mile uska naam ye hoga
      }
    },
    {
      // Dusra lookup: woh records lao jahan 'User._id' == 'subscription.Subscriber'
      $lookup: {
        from: "subscription",
        localField: "_id",             // current user ka _id
        foreignField: "Subscriber",    // dusri collection ka subscriber field
        as: 'subscribeTO'              // result ka naam subscribeTO rakha
      }
    },
    {
      // Ab custom fields add kar rahe hain
      $addFields: {
        // SubscribersCount: total subscribers count nikala
        SubscribersCount: {
          $size: '$subscribers'        // subscribers array ki length
        },
        // channelSubscribeTo: total channels jise user ne subscribe kiya
        channelSubscribeTo: {
          $size: "$subscribeTO"
        },
        // isSubscribed: kya current loggedIn user ne iss channel ko subscribe kiya ya nahi
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // agar user _id subscribers mein hai
            then: true,
            else: false
          }
        }
      }
    },
    {
      // Sirf specific fields show karo output mein
      $project: {
        fullName: 1,
        userName: 1,
        SubscribersCount: 1,
        channelSubscribeTo: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ]);

  // Agar channel nahi mila to 404 error throw karo
  if (!channel?.length) {
    throw new ApiError(404, 'channel does not exists');
  }

  // Agar sab sahi to response return karo
  return res.status(200).json(
    new ApiResponse(200, channel[0], "user channel successfully fetched")
  );
});

const getWatchHistory = asyncHandler(async(req, res) => {
  const user = await User.aggregate([
      {
          $match: {
              _id: new mongoose.Types.ObjectId(req.user._id)
          }
      },
      {
          $lookup: {
              from: "videos",
              localField: "watchHistory",
              foreignField: "_id",
              as: "watchHistory",
              pipeline: [
                  {
                      $lookup: {
                          from: "users",
                          localField: "owner",
                          foreignField: "_id",
                          as: "owner",
                          pipeline: [
                              {
                                  $project: {
                                      fullName: 1,
                                      username: 1,
                                      avatar: 1
                                  }
                              }
                          ]
                      }
                  },
                  {
                      $addFields:{
                          owner:{
                              $first: "$owner"
                          }
                      }
                  }
              ]
          }
      }
  ])

  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch history fetched successfully"
      )
  )
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory
};
