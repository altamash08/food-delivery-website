import mongoose from "mongoose";

export const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is missing. Set it in Render > Environment.");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB Connected");
};
