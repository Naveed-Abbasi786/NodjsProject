import { app } from './app.js'
import connectDB from './db/index.js'
import dotenv from 'dotenv'

dotenv.config(
  {path:'./.env'}
)

const Port=process.env.PORT || 8000
connectDB()
.then(()=>{
  app.listen(Port , ()=>{
    console.log(`Serve is Running at port : ${Port}`)
  })
  app.on('error',(error)=>{
    console.log('error',error)
    throw error
  })
})
.catch((err)=>{
  console.log('Mongo db Connection failed',err)
})
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
