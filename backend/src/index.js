import dotenv from "dotenv";
dotenv.config()

import express from "express"
import dbConnect from "./config/dbConnect.js";
import route from "./routes/auth.route.js";

const app=express()

// Middleware
app.use(express.json())

// Database Connection
dbConnect()

// Routes
app.use("/auth",route)

 app.listen(process.env.PORT,()=>console.log("Server Running..."));