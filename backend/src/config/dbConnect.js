import mongoose from "mongoose";

const dbConnect = async () => {
  try {
    await mongoose
      .connect(process.env.DB_URL)
  } catch (error) {
    console.log("Mongodb Connection Problem", error);
  }
};

export default dbConnect;
