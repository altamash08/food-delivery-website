import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId: {type:String,required:true},
    items: { type: Array, required:true},
    amount: { type: Number, required: true},
    subtotal: { type: Number },
    discount: { type: Number, default: 0 },
    promoCode: { type: String, default: "" },
    deliveryFee: { type: Number },
    paymentMethod: { type: String },            // "cod" ya "stripe"
    address:{type:Object,required:true},
    status: {type:String,default:"Food Processing"},
    date: {type:Date,default:Date.now},         // pehle Date.now() tha, isse sabhi orders ki date same ho jaati thi
    payment:{type:Boolean,default:false}
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
