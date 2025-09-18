import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import UserModel from "../models/user.model.js";

// SignUP Controller
const signUp = async (req, res) => {
  const { username, password, email } = req.body;

  // Validation Input fields
  const errorText = {
    username: "",
    password: "",
    email: "",
  };

  let pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!pattern.test(email)) {
    errorText.email = "please Provide a Valid Email.";
  }
  if (!username) errorText.username = "please Provide a Username";
  if (!password) errorText.password = "Password are Required";

  if (!username || !password || !email) return res.json(errorText);

  const findUser = await UserModel.findOne({ email });
  if (findUser) return res.json({ error: "Email Already Exits" });

  // Hasing Password
  const hashed = await bcrypt.hash(password, 10);

  const user = new UserModel({
    username,
    password: hashed,
    email,
    isVerified: false,
  });
  await user.save();

  // Email Sending
  const url = process.env.CLIENT_URL;
  const verifyToken = jwt.sign(
    { id: user._id },
    process.env.VERIFY_SECRET_CODE,
    {
      expiresIn: "30m",
    }
  );
  const confirmationLink = `${url}/auth/verify/${verifyToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_Mail,
      pass: process.env.USER_MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: "Shadaf Hossain",
    to: `${user.email}`,
    subject: "Confirmation for your Email Verification",
    html: `
      <!DOCTYPE html>
      <html>
      <body>
        <h2>Hello ${username},</h2>
        <p>Thanks for signing up! Please confirm your email by clicking below:</p>
        <a href="${confirmationLink}" 
           style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">
           Confirm Email
        </a>
      </body>
      </html>
    `,
  });

  res.json({ message: "SignUp Succesfull.Verified your mail" });
};

// verifyEmail Controller
const verifyEmail = async (req, res) => {
  const { token } = req.params;

  // Verify token
  const decode = jwt.verify(token, process.env.VERIFY_SECRET_CODE);

  //  Find user by ID
  const existsUser = await UserModel.findById(decode.id);
  if (!existsUser) {
    return res.status(404).json({ message: "Invalid Token" });
  }

  // Update isVerified
  existsUser.isVerified = true;
  await existsUser.save();

  res.json({
    success: true,
    message: "Email verified successfully ✅",
  });
};

// AccessToken Generate
const accessTokenGenerate=(data)=>{
return jwt.sign({ id: data._id }, process.env.ACCESS_TOKEN_CODE,{expiresIn:'7d'});
}

// RefreshToken Generate
const refreshTokenGenerate = (data) => {
  return jwt.sign({ id: data._id }, process.env.REFRESH_TOKEN_CODE, {
    expiresIn: "365d",
  });
};

// Login Controller
const login = async (req, res) => {
  const { email, password } = req.body;

  const exitsUser = await UserModel.findOne({ email });
  if (!exitsUser) {
    return res.json({error:"Invalid Credencial"})
  }

  // Email Verification Check
  if(!exitsUser.isVerified){
    return res.json({ message: "Verify Your Mail for Login" });
  }
  // password Verification Check
  const isMatch = await bcrypt.compare(password, exitsUser.password);
  if (!isMatch) {
    return res.json({ error: "Invalid Credencial" });
  }

  // Token Generate
  const refreshToken = refreshTokenGenerate(exitsUser);

  exitsUser.refreshToken = refreshToken;
  res.cookie("RefreshToken", refreshToken,{
maxAge:1000*60*60*24*7,
httpOnly:true,
secure:false,    
sameSite:"strict"
});
  await exitsUser.save()

};

// refreshToken Controller
const refreshToken=async(req,res)=>{
const token = req.cookies.RefreshToken;
const exitsUser=await UserModel.findOne({refreshToken:token})

if(!exitsUser){
    return res.json({error:"Invalid Token"})
}
const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_CODE);
if(!decoded){
    return res.json({ error: "Invalid Token" });
}
const accessToken = accessTokenGenerate(exitsUser);
res.json({
  username: `${exitsUser.username}`,
  accessToken
});

}

// forgotPassword Controller
const forgotPassword=async(req,res)=>{
  const { email } = req.body;
  const exitsUser = await UserModel.findOne({ email });
  if (!exitsUser) {
    return res.json({ message: "User not Found" });
  }

  // Reset Token
  const resetToken = jwt.sign(
    { id: exitsUser._id },
    process.env.RESET_TOKEN_CODE,
    {
      expiresIn: "15m",
    }
  );

  // Sending Mail for Reset Password
  const resetLink = `${process.env.CLIENT_URL}/auth/reset/${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.USER_Mail,
      pass: process.env.USER_MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: "Shadaf Hossain",
    to: `${exitsUser.email}`,
    subject: "Reset your Password.",
    html: `
      <!DOCTYPE html>
      <html>
      <body>
        <h2>Hello ${exitsUser.username},</h2>
        <p> Please confirm your Password by clicking below:</p>
        <a href="${resetLink}" 
           style="background:#007bff;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">
           Confirm Password
        </a>
      </body>
      </html>
    `,
  });
refreshToken.json({message:"Please Check your Mail for Reset password"})
}

// resetPassword Controller
const resetPassword = async(req, res) => {
const {token}=req.params
const {password}=req.body

// verify token
const decoded = jwt.verify(token, process.env.RESET_TOKEN_CODE);

// Find User
const exitsUser = await UserModel.findById(decoded.id);
if (!exitsUser) {
  return res.json({ message: "User Not Found." });
}

exitsUser.password = await bcrypt.hash(password,10);
await exitsUser.save()

res.json({message:"Password Reset Succesfully."})
};

// Logout Controller
const logout=(req,res)=>{
res.clearCookie("RefreshToken");
res.json({ message: "Logout Successful ✅" });
}


export {
  signUp,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout
};
