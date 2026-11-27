import jwt from "jsonwebtoken";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js";
import { safeEqual } from "../utils/pricing.js";

// ---- Admin login: email/password Render ke env (ADMIN_EMAIL, ADMIN_PASSWORD) se check hota hai ----

// brute force se bachne ke liye: ek IP se 15 minute mein max 8 galat try
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

const isBlocked = (ip) => {
    const rec = attempts.get(ip);
    if (!rec) return false;
    if (Date.now() - rec.first > WINDOW_MS) {
        attempts.delete(ip);
        return false;
    }
    return rec.count >= MAX_ATTEMPTS;
}

const noteFailure = (ip) => {
    const rec = attempts.get(ip);
    if (!rec || Date.now() - rec.first > WINDOW_MS) {
        attempts.set(ip, { count: 1, first: Date.now() });
    } else {
        rec.count += 1;
    }
}

const adminLogin = (req, res) => {
    try {
        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
            return res.json({ success: false, message: "Admin login is not set up on the server" });
        }
        const ip = req.ip || "unknown";
        if (isBlocked(ip)) {
            return res.json({ success: false, message: "Too many attempts. Try again after 15 minutes." });
        }

        const { email, password } = req.body;
        const emailOk = safeEqual(String(email || "").trim().toLowerCase(), process.env.ADMIN_EMAIL.trim().toLowerCase());
        const passOk = safeEqual(password, process.env.ADMIN_PASSWORD);

        if (!(emailOk && passOk)) {
            noteFailure(ip);
            return res.json({ success: false, message: "Invalid email or password" });
        }

        attempts.delete(ip);
        const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

// ---- Dashboard stats (India time IST ke hisaab se "aaj") ----
const IST_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const startOfTodayIST = () => {
    const d = new Date(Date.now() + IST_MS);
    d.setUTCHours(0, 0, 0, 0);
    return new Date(d.getTime() - IST_MS);
}

// cancelled orders aur adhoore card payments count nahi hote
const validOrders = {
    status: { $ne: "Cancelled" },
    $or: [{ payment: true }, { paymentMethod: "cod" }]
};

const getStats = async (req, res) => {
    try {
        const todayStart = startOfTodayIST();
        const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);

        const [totals, todayTotals, statusAgg, daily, top, recent, users, foods] = await Promise.all([
            orderModel.aggregate([
                { $match: validOrders },
                { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$amount" } } }
            ]),
            orderModel.aggregate([
                { $match: { ...validOrders, date: { $gte: todayStart } } },
                { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$amount" } } }
            ]),
            orderModel.aggregate([
                { $match: validOrders },
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            orderModel.aggregate([
                { $match: { ...validOrders, date: { $gte: weekStart } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+05:30" } },
                        orders: { $sum: 1 },
                        revenue: { $sum: "$amount" }
                    }
                }
            ]),
            orderModel.aggregate([
                { $match: validOrders },
                { $unwind: "$items" },
                { $group: { _id: "$items.name", quantity: { $sum: "$items.quantity" } } },
                { $sort: { quantity: -1 } },
                { $limit: 5 }
            ]),
            orderModel.find(validOrders).sort({ date: -1 }).limit(6)
                .select("amount status date items paymentMethod payment address.firstName address.lastName").lean(),
            userModel.countDocuments(),
            foodModel.countDocuments()
        ]);

        // pichhle 7 din (khaali din 0 ke saath)
        const dayMap = new Map(daily.map((d) => [d._id, d]));
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const t = new Date(todayStart.getTime() - i * DAY_MS);
            const key = new Date(t.getTime() + IST_MS).toISOString().slice(0, 10);
            const d = dayMap.get(key);
            days.push({ date: key, orders: d ? d.orders : 0, revenue: d ? d.revenue : 0 });
        }

        const statusCounts = { "Food Processing": 0, "Out for delivery": 0, "Delivered": 0 };
        statusAgg.forEach((s) => { if (s._id in statusCounts) statusCounts[s._id] = s.count; });

        res.json({
            success: true,
            data: {
                totalOrders: totals[0] ? totals[0].orders : 0,
                totalRevenue: totals[0] ? totals[0].revenue : 0,
                todayOrders: todayTotals[0] ? todayTotals[0].orders : 0,
                todayRevenue: todayTotals[0] ? todayTotals[0].revenue : 0,
                statusCounts,
                days,
                topItems: top.map((t) => ({ name: t._id, quantity: t.quantity })),
                recentOrders: recent,
                users,
                foods
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}

export { adminLogin, getStats }
