import { v2 as cloudinary } from "cloudinary";
import fs, { unlinkSync } from "fs";

cloudinary.config({
  cloud_name:'dau1gu2rs',
  api_key: '485677937826462',
  api_secret: 'qI3MfeP5GgBcei3QXbcbXYF4IuQ',
});

console.log("ENV Vars =>", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) {
//       console.log("please upload file");
//       return;
//     }
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//     });
//     console.log("File uploaded successfully:", response.url);

//     return response;
//   } catch (error) {
//     fs.unlinkSync(localFilePath);
//     // remove the locally saved temporary file as the upload operation got failed
//     return null;
//   }
// };


const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("please upload file");
      return;
    }

    console.log("Uploading this file to Cloudinary:", localFilePath);

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("File uploaded successfully:", response.url);
    return response;

  } catch (error) {
    console.log("Cloudinary upload error:", error.message); // Add this
    fs.unlinkSync(localFilePath); // delete local file
    return null;
  }
};



export { uploadOnCloudinary };


