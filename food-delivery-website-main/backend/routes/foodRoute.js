import express from 'express';
import { addFood, listFood, removeFood, updateFood, toggleStock } from '../controllers/foodController.js';
import adminAuth from '../middleware/adminAuth.js';
import multer from 'multer';
const foodRouter = express.Router();

// Image ko disk par nahi, memory mein lete hain aur controller usko database mein save karta hai.
// (Render jaise hosting par disk har restart/deploy par saaf ho jaati hai, isliye images gayab hoti thi)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // max 5MB
})

// upload error (jaise badi file) ko saaf message ke saath return karta hai
const uploadImage = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 5MB' : 'Image upload failed';
            return res.json({ success: false, message });
        }
        next();
    });
}

foodRouter.get("/list", listFood);
foodRouter.post("/add", adminAuth, uploadImage, addFood);
foodRouter.post("/update", adminAuth, uploadImage, updateFood);
foodRouter.post("/stock", adminAuth, toggleStock);
foodRouter.post("/remove", adminAuth, removeFood);

export default foodRouter;
