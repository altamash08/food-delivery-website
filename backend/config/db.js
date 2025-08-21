import mongoose from "mongoose";

export const  connectDB = async () =>{

    await mongoose.connect('mongodb+srv://altusmanezzu:finalyearproject2025@cluster0.x9t825d.mongodb.net/food-del').then(()=>console.log("DB Connected"));
   
}

