import express from 'express';
import { getReviews, addReview } from '../controllers/reviewController.js';
import authMiddleware from '../middleware/auth.js';

const reviewRouter = express.Router();

reviewRouter.post("/get", getReviews);
reviewRouter.post("/add", authMiddleware, addReview);

export default reviewRouter;
