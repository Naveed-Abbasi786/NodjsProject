// import connectDB from './db/index.js'
// import dotenv from 'dotenv'

// dotenv.config(
//   {path:'./.env'}
// )
// connectDB()

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// import dotenv from "dotenv";
// import express from "express";

// dotenv.config({ path: "./.env" });

// const app = express();

// (async () => {
//   try {
//     const connectionInstance = await mongoose.connect(
//       `${process.env.MONGODB_URI}/${DB_NAME}`
//     );

//     console.log(`MongoDB connected! DB Host: ${connectionInstance.connection.host}`);

//     app.listen(process.env.PORT, () => {
//       console.log(`App is listening on port ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.error("MongoDB connection error:", error.message);
//     process.exit(1); 
//   }
// })();
