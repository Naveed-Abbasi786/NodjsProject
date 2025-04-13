import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJwt, logoutUser);

router.route("/refresh-token").post(refreshToken);

router.route("/change-password").patch(verifyJwt, changeCurrentPassword);

router.route("/get-current-user").get(verifyJwt, getCurrentUser);

router.route("/update-account-details").put(
  verifyJwt,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateAccountDetails
);

router
  .route("/avatar-update")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);


  
router.route("/c/:userName").get(verifyJwt, getUserChannelProfile)
router.route("/history").get(verifyJwt, getWatchHistory)

export default router;
