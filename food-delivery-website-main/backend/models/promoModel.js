import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percent", "flat"], required: true },
    value: { type: Number, required: true },        // percent (1-100) ya flat rupees
    minOrder: { type: Number, default: 0 },         // minimum subtotal
    maxDiscount: { type: Number, default: 0 },      // percent code ke liye cap (0 = no cap)
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
})

const promoModel = mongoose.models.promo || mongoose.model("promo", promoSchema);
export default promoModel;
