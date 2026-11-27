import express from 'express';
import { adminLogin, getStats } from '../controllers/adminController.js';
import adminAuth from '../middleware/adminAuth.js';

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.get("/stats", adminAuth, getStats);

export default adminRouter;
