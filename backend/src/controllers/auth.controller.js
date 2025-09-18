import nodemailer from "nodemailer";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

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
  if(!username)  errorText.username = "please Provide a Username";
  if(!password)  errorText.password = "Password are Required";
  
    if(!username || !password || !email) return  res.json(errorText);

  const findUser =await UserModel.findOne({ email });
  if (findUser) return res.json({ error: "Email Already Exits" });

  // Hasing Password
  const hashed =await bcrypt.hash(password,10);

  const user=new UserModel({ username, password:hashed, email, isVerified: false });
  await user.save();

  // Email Sending
  const url=process.env.CLIENT_URL
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
    
    res.json({message:"SignUp Succesfull.Verified your mail"})
};

// verifyEmail Controller
const verifyEmail=async(req,res)=>{
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

}

export { signUp, verifyEmail };
