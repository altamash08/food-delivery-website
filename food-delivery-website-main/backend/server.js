import 'dotenv/config'
import express  from "express"
import cors from 'cors'
import { connectDB } from "./config/db.js"
import userRouter from "./routes/userRoute.js"
import foodRouter from "./routes/foodRoute.js"
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import adminRouter from "./routes/adminRoute.js"
import promoRouter from "./routes/promoRoute.js"
import reviewRouter from "./routes/reviewRoute.js"
import { getImage } from "./controllers/foodController.js"

// app config
const app = express()
const port = process.env.PORT || 4000;

// Render proxy ke peeche chalta hai (login attempts ke liye sahi IP chahiye)
app.set('trust proxy', 1)

// middlewares
app.use(express.json())
app.use(cors())

// db connection
connectDB()

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/food", foodRouter)
// pehle uploads folder (purane items ki files), na mile to database se image
app.use("/images",express.static('uploads'))
app.get("/images/:filename", getImage)
app.use("/api/cart", cartRouter)
app.use("/api/order",orderRouter)
app.use("/api/admin", adminRouter)
app.use("/api/promo", promoRouter)
app.use("/api/review", reviewRouter)

app.get("/", (req, res) => {
    res.send("API Working")
  });

app.listen(port, () => console.log(`Server started on http://localhost:${port}`))
