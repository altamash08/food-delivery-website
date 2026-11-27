import express from 'express';
import { applyPromo, listPromos, addPromo, togglePromo, removePromo } from '../controllers/promoController.js';
import adminAuth from '../middleware/adminAuth.js';

const promoRouter = express.Router();

promoRouter.post("/apply", applyPromo);
promoRouter.get("/list", adminAuth, listPromos);
promoRouter.post("/add", adminAuth, addPromo);
promoRouter.post("/toggle", adminAuth, togglePromo);
promoRouter.post("/remove", adminAuth, removePromo);

export default promoRouter;
