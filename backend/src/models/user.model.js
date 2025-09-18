import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified:Boolean,
  refreshToken:String
},{timestamps:true});


const UserModel = mongoose.model("user", UserSchema);

export default UserModel