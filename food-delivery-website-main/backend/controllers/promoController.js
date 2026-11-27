import promoModel from "../models/promoModel.js";
import { checkPromo } from "../utils/pricing.js";

// Public: cart mein code apply karne par discount dikhane ke liye
// (asli discount order place hote waqt server par dobara calculate hota hai)
const applyPromo = async (req, res) => {
    try {
        const code = String(req.body.code || "").trim().toUpperCase();
        const subtotal = Number(req.body.subtotal) || 0;
        if (!code) {
            return res.json({ success: false, message: "Enter a promo code" });
        }
        const promo = await promoModel.findOne({ code });
        const result = checkPromo(promo, subtotal);
        if (!result.ok) {
            return res.json({ success: false, message: result.message });
        }
        res.json({
            success: true,
            code: promo.code,
            discount: result.discount,
            message: `Promo applied! You saved ₹${result.discount}`
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// ---- Admin ----
const listPromos = async (req, res) => {
    try {
        const promos = await promoModel.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: promos });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const addPromo = async (req, res) => {
    try {
        const code = String(req.body.code || "").trim().toUpperCase();
        const type = req.body.type;
        const value = Number(req.body.value);
        const minOrder = Number(req.body.minOrder) || 0;
        const maxDiscount = Number(req.body.maxDiscount) || 0;

        if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
            return res.json({ success: false, message: "Code must be 3-20 letters/numbers (no spaces)" });
        }
        if (type !== "percent" && type !== "flat") {
            return res.json({ success: false, message: "Invalid discount type" });
        }
        if (!(value > 0)) {
            return res.json({ success: false, message: "Discount value must be more than 0" });
        }
        if (type === "percent" && value > 100) {
            return res.json({ success: false, message: "Percent cannot be more than 100" });
        }
        if (await promoModel.findOne({ code })) {
            return res.json({ success: false, message: "This code already exists" });
        }

        const promo = new promoModel({
            code, type, value, minOrder,
            maxDiscount: type === "percent" ? maxDiscount : 0,
            expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
        });
        await promo.save();
        res.json({ success: true, message: "Promo code created" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const togglePromo = async (req, res) => {
    try {
        const promo = await promoModel.findById(req.body.id);
        if (!promo) {
            return res.json({ success: false, message: "Promo not found" });
        }
        promo.active = !promo.active;
        await promo.save();
        res.json({ success: true, message: promo.active ? "Promo activated" : "Promo paused" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

const removePromo = async (req, res) => {
    try {
        await promoModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Promo deleted" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { applyPromo, listPromos, addPromo, togglePromo, removePromo }
