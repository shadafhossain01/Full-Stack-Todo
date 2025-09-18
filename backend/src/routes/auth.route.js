import { Router } from "express";
import {
  signUp,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout
} from "../controllers/auth.controller.js";

const route=Router()

route.post("/signup", signUp)
route.get("/verify/:token", verifyEmail);

route.post("/login", login);
route.post("/refresh" , refreshToken)

route.post("/forgot-password", forgotPassword)
route.get("/reset/:token", resetPassword)

route.get("/logout",logout)

export default route