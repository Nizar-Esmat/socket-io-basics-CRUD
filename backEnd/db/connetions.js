import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect("mongodb://root:root@127.0.0.1:27017/soket1?authSource=admin");
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};

export default connectDB;