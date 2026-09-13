import {Schema, model, models, Document} from "mongoose";

export const USER_ROLES = ["user", "superadmin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  email: string;
  hashedPassword: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashedPassword: {type: String, required: true},
    role: {type: String, enum: USER_ROLES, default: "user"},
  },
  {timestamps: true},
);

export const User =
  (models.User as import("mongoose").Model<IUser>) ||
  model<IUser>("User", UserSchema);
