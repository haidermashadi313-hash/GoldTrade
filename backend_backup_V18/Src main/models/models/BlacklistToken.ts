import mongoose, { Schema } from "mongoose";

const BlacklistTokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "BlacklistToken",
  BlacklistTokenSchema
);