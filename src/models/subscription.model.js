import mongoose, { Schema } from "mongoose";

const subscriptoinShema = new Schema(
  {
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.type.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("subscription", subscriptoinShema);
