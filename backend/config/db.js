import mongoose from "mongoose";

export const  connectDB = async () =>{

    await mongoose.connect('mongodb+srv://altamashrizwan546_db_user:Altamash08@cluster0.ojfhioo.mongodb.net/food-del').then(()=>console.log("DB Connected"));
   
}

