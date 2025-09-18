import { Router } from "express";
import { signUp, verifyEmail } from "../controllers/auth.controller.js";

const route=Router()

route.post("/signup", signUp)
route.get("/verify/:token", verifyEmail);

export default route