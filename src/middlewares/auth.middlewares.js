import { User } from "../models/user.model.js";
import { ApiError } from "../utlls/apiError.js";
import { asyncHandler } from "../utlls/asyncHandler.js";
import jwt from "jsonwebtoken";
const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

      console.log(token)
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log(decodedToken,'ds')
    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid Access token");
  }
});

export {verifyJwt}