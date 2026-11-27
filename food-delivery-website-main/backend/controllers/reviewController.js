import mongoose from "mongoose";
import reviewModel from "../models/reviewModel.js";
import foodModel from "../models/foodModel.js";
import userModel from "../models/userModel.js";

// Public: kisi food ke reviews
const getReviews = async (req, res) => {
    try {
        const { foodId } = req.body;
        if (!mongoose.isValidObjectId(foodId)) {
            return res.json({ success: false, message: "Invalid item" });
        }
        const reviews = await reviewModel.find({ foodId: String(foodId) })
            .sort({ date: -1 })
            .limit(50)
            .select("userName rating comment date");
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// Logged-in user: review add / update
const addReview = async (req, res) => {
    try {
        const { foodId, userId } = req.body;
        const rating = Math.floor(Number(req.body.rating));
        const comment = String(req.body.comment || "").trim().slice(0, 300);

        if (!mongoose.isValidObjectId(foodId) || !(await foodModel.exists({ _id: foodId }))) {
            return res.json({ success: false, message: "Item not found" });
        }
        if (!(rating >= 1 && rating <= 5)) {
            return res.json({ success: false, message: "Please select a rating from 1 to 5" });
        }

        const user = await userModel.findById(userId).select("name");
        await reviewModel.findOneAndUpdate(
            { foodId: String(foodId), userId: String(userId) },
            { foodId: String(foodId), userId: String(userId), userName: user ? user.name : "Customer", rating, comment, date: new Date() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        res.json({ success: true, message: "Review saved" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { getReviews, addReview }
