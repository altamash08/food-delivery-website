import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    foodId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, default: "Customer" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    date: { type: Date, default: Date.now }
})

// ek user ek food par ek hi review (dobara dene par update hota hai)
reviewSchema.index({ foodId: 1, userId: 1 }, { unique: true })

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema);
export default reviewModel;
