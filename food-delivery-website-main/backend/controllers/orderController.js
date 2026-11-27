import mongoose from "mongoose";
import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js"
import foodModel from "../models/foodModel.js";
import promoModel from "../models/promoModel.js";
import { getDeliveryCharge, checkPromo } from "../utils/pricing.js";

// Stripe key tab check hoti hai jab Stripe use ho (COD ke liye key zaroori nahi)
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

//config variables
const currency = "inr";
// Deployed frontend ka link Render ke env mein FRONTEND_URL se aata hai
const getFrontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

const STATUSES = ["Food Processing", "Out for delivery", "Delivered", "Cancelled"];

// sirf wahi orders dikhte hain jo COD hain ya jinka payment ho chuka hai (adhoore Stripe attempts nahi)
const visibleOrders = { $or: [{ payment: true }, { paymentMethod: "cod" }] };

class OrderError extends Error { }

// Price, stock aur promo server par dobara calculate hota hai (frontend ke amount par bharosa nahi)
const buildOrder = async (rawItems, promoCode) => {
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new OrderError("Your cart is empty");
    }
    if (rawItems.length > 100) {
        throw new OrderError("Too many items in cart");
    }

    const ids = rawItems.map((i) => String(i._id)).filter((id) => mongoose.isValidObjectId(id));
    const foods = await foodModel.find({ _id: { $in: ids } });
    const byId = new Map(foods.map((f) => [String(f._id), f]));

    const items = [];
    let subtotal = 0;
    for (const raw of rawItems) {
        const food = byId.get(String(raw._id));
        if (!food) {
            throw new OrderError("Some items in your cart are no longer available");
        }
        if (food.inStock === false) {
            throw new OrderError(`${food.name} is out of stock. Please remove it from your cart.`);
        }
        const quantity = Math.floor(Number(raw.quantity));
        if (!(quantity >= 1 && quantity <= 50)) {
            throw new OrderError("Invalid quantity");
        }
        items.push({
            _id: String(food._id),
            name: food.name,
            price: food.price,
            quantity,
            image: food.image,
            category: food.category,
        });
        subtotal += food.price * quantity;
    }

    let discount = 0;
    let appliedCode = "";
    if (promoCode) {
        const promo = await promoModel.findOne({ code: String(promoCode).trim().toUpperCase() });
        const result = checkPromo(promo, subtotal);
        if (!result.ok) {
            throw new OrderError(result.message);
        }
        discount = result.discount;
        appliedCode = promo.code;
    }

    const deliveryFee = getDeliveryCharge();
    const amount = subtotal - discount + deliveryFee;
    return { items, subtotal, discount, promoCode: appliedCode, deliveryFee, amount };
}

const checkAddress = (address) => {
    if (!address || typeof address !== "object" || !address.phone || !address.street) {
        throw new OrderError("Please fill your delivery details");
    }
}

// Placing User Order for Frontend using stripe
const placeOrder = async (req, res) => {
    let newOrder;
    try {
        checkAddress(req.body.address);
        const built = await buildOrder(req.body.items, req.body.promoCode);

        newOrder = new orderModel({
            userId: req.body.userId,
            items: built.items,
            amount: built.amount,
            subtotal: built.subtotal,
            discount: built.discount,
            promoCode: built.promoCode,
            deliveryFee: built.deliveryFee,
            paymentMethod: "stripe",
            address: req.body.address,
        })
        await newOrder.save();

        const stripe = getStripe();

        const line_items = built.items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name
                },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: {
                    name: "Delivery Charge"
                },
                unit_amount: built.deliveryFee * 100
            },
            quantity: 1
        })

        const sessionData = {
            success_url: `${getFrontendUrl()}/verify?success=true&orderId=${newOrder._id}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${getFrontendUrl()}/verify?success=false&orderId=${newOrder._id}`,
            line_items: line_items,
            mode: 'payment',
            metadata: { orderId: String(newOrder._id) },
        };

        // promo discount Stripe coupon ke roop mein lagta hai
        if (built.discount > 0) {
            const coupon = await stripe.coupons.create({
                amount_off: built.discount * 100,
                currency: currency,
                duration: 'once',
                name: built.promoCode,
            });
            sessionData.discounts = [{ coupon: coupon.id }];
        }

        const session = await stripe.checkout.sessions.create(sessionData);

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        if (newOrder) {
            await orderModel.findByIdAndDelete(newOrder._id).catch(() => { });
        }
        if (error instanceof OrderError) {
            return res.json({ success: false, message: error.message })
        }
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Placing User Order - Cash on delivery
const placeOrderCod = async (req, res) => {
    try {
        checkAddress(req.body.address);
        const built = await buildOrder(req.body.items, req.body.promoCode);

        const newOrder = new orderModel({
            userId: req.body.userId,
            items: built.items,
            amount: built.amount,
            subtotal: built.subtotal,
            discount: built.discount,
            promoCode: built.promoCode,
            deliveryFee: built.deliveryFee,
            paymentMethod: "cod",
            address: req.body.address,
            payment: false,          // cash deliver hone par milta hai
        })
        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        res.json({ success: true, message: "Order Placed" });

    } catch (error) {
        if (error instanceof OrderError) {
            return res.json({ success: false, message: error.message })
        }
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Listing Order for Admin panel (newest first)
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find(visibleOrders).sort({ date: -1 });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// User Orders for Frontend (newest first)
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId, ...visibleOrders }).sort({ date: -1 });
        res.json({ success: true, data: orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Admin: order status change
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!STATUSES.includes(status)) {
            return res.json({ success: false, message: "Invalid status" })
        }
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" })
        }
        order.status = status;
        // COD mein cash delivery par milta hai
        if (status === "Delivered" && order.paymentMethod === "cod") {
            order.payment = true;
        }
        await order.save();
        res.json({ success: true, message: "Status Updated" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// User: apna COD order cancel kare (sirf jab tak Food Processing hai)
const cancelOrder = async (req, res) => {
    try {
        const order = await orderModel.findOne({ _id: req.body.orderId, userId: req.body.userId });
        if (!order) {
            return res.json({ success: false, message: "Order not found" })
        }
        if (order.status !== "Food Processing") {
            return res.json({ success: false, message: "This order can no longer be cancelled" })
        }
        if (order.paymentMethod !== "cod") {
            return res.json({ success: false, message: "Paid online orders cannot be cancelled here. Please contact support." })
        }
        order.status = "Cancelled";
        await order.save();
        res.json({ success: true, message: "Order cancelled" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// Stripe payment verify (Stripe se confirm karke, sirf URL ke bharose nahi)
const verifyOrder = async (req, res) => {
    const { orderId, success, session_id } = req.body;
    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" })
        }

        if (success === "true") {
            if (order.payment) {
                return res.json({ success: true, message: "Paid" })
            }
            if (!session_id) {
                return res.json({ success: false, message: "Payment not verified" })
            }
            const session = await getStripe().checkout.sessions.retrieve(session_id);
            if (session.payment_status === "paid" && session.metadata && session.metadata.orderId === String(order._id)) {
                order.payment = true;
                await order.save();
                // payment hone ke baad hi cart khaali hota hai
                await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
                return res.json({ success: true, message: "Paid" })
            }
            return res.json({ success: false, message: "Payment not completed" })
        }

        // payment cancel: sirf unpaid order delete hoga
        if (!order.payment) {
            await orderModel.findByIdAndDelete(orderId)
        }
        res.json({ success: false, message: "Not Paid" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Not  Verified" })
    }
}

export { placeOrder, listOrders, userOrders, updateStatus, verifyOrder, placeOrderCod, cancelOrder, visibleOrders }
