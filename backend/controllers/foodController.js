import foodModel from "../models/foodModel.js";
import reviewModel from "../models/reviewModel.js";
import fs from 'fs'

// unique + safe file name (spaces/special characters hata ke)
const makeFileName = (original) => `${Date.now()}${original}`.replace(/[^a-zA-Z0-9._-]/g, '_')

// all food list (ratings ke saath)
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({}).lean()

        const stats = await reviewModel.aggregate([
            { $group: { _id: "$foodId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
        ])
        const statMap = new Map(stats.map((s) => [s._id, s]))

        const data = foods.map((food) => {
            const s = statMap.get(String(food._id))
            return {
                ...food,
                avgRating: s ? Math.round(s.avg * 10) / 10 : 0,
                ratingCount: s ? s.count : 0
            }
        })

        res.json({ success: true, data })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// add food (admin)
const addFood = async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ success: false, message: "Image required" })
        }

        const food = new foodModel({
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: makeFileName(req.file.originalname),
            imageData: req.file.buffer,
            imageType: req.file.mimetype,
        })

        await food.save();
        res.json({ success: true, message: "Food Added" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// edit food (admin) - image optional
const updateFood = async (req, res) => {
    try {
        const { id, name, description, price, category } = req.body
        const food = await foodModel.findById(id)
        if (!food) {
            return res.json({ success: false, message: "Item not found" })
        }

        if (name !== undefined && String(name).trim() !== "") food.name = String(name).trim()
        if (description !== undefined && String(description).trim() !== "") food.description = String(description).trim()
        if (category !== undefined && String(category).trim() !== "") food.category = String(category).trim()
        if (price !== undefined && price !== "") {
            const p = Number(price)
            if (!Number.isFinite(p) || p < 0) {
                return res.json({ success: false, message: "Invalid price" })
            }
            food.price = p
        }

        if (req.file) {
            // nayi image => naya naam (taaki browser purani cached image na dikhaye)
            food.image = makeFileName(req.file.originalname)
            food.imageData = req.file.buffer
            food.imageType = req.file.mimetype
        }

        await food.save()
        res.json({ success: true, message: "Item Updated" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// in stock / out of stock (admin)
const toggleStock = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id)
        if (!food) {
            return res.json({ success: false, message: "Item not found" })
        }
        food.inStock = typeof req.body.inStock === "boolean" ? req.body.inStock : food.inStock === false
        await food.save()
        res.json({ success: true, message: food.inStock ? "Marked In Stock" : "Marked Out Of Stock", inStock: food.inStock })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// delete food (admin)
const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        if (food) {
            // Reviews for this food item (MongoDB-stored, no file cleanup needed)
            await reviewModel.deleteMany({ foodId: String(food._id) })
        }

        // Delete food from database (image data in MongoDB is cleared automatically)
        await foodModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "Food Removed" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// image database se serve karna: GET /images/<filename>
const getImage = async (req, res) => {
    try {
        const food = await foodModel.findOne({ image: req.params.filename }).select('+imageData')
        if (!food || !food.imageData) {
            return res.status(404).send('Image not found')
        }
        res.set('Content-Type', food.imageType || 'image/png')
        res.set('Cache-Control', 'public, max-age=31536000, immutable')
        res.send(food.imageData)
    } catch (error) {
        console.log(error);
        res.status(500).send('Error')
    }
}

export { listFood, addFood, updateFood, toggleStock, removeFood, getImage }
