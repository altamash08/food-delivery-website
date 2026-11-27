import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true},
    image: { type: String, required: true },
    category:{ type:String, required:true},
    inStock: { type: Boolean, default: true },
    // image ki file database mein save hoti hai (select:false => list API mein heavy data nahi jaata)
    imageData: { type: Buffer, select: false },
    imageType: { type: String }
})

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);
export default foodModel;
