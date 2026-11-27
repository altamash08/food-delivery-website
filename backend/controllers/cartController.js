import userModel from "../models/userModel.js"
import foodModel from "../models/foodModel.js"

// add to user cart
const addToCart = async (req, res) => {
   try {
      // out of stock item cart mein nahi jayega
      const food = await foodModel.findById(req.body.itemId).select('inStock')
      if (!food) {
         return res.json({ success: false, message: "Item not found" })
      }
      if (food.inStock === false) {
         return res.json({ success: false, message: "This item is out of stock" })
      }

      let userData = await userModel.findOne({_id:req.body.userId});
      if (!userData) {
         return res.json({ success: false, message: "User not found" });
      }
      let cartData = userData.cartData || {};
      if (cartData[req.body.itemId]) {
         cartData[req.body.itemId] += 1;
      } else {
         cartData[req.body.itemId] = 1;
      }
      await userModel.findByIdAndUpdate(req.body.userId, {cartData});
      res.json({ success: true, message: "Added To Cart" });
   } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Error" })
   }
}

// remove food from user cart
const removeFromCart = async (req, res) => {
   try {
      let userData = await userModel.findById(req.body.userId);
      if (!userData) {
         return res.json({ success: false, message: "User not found" });
      }
      let cartData = userData.cartData || {};
      if (cartData[req.body.itemId] > 1) {
         cartData[req.body.itemId] -= 1;
      } else {
         // Remove the key entirely when quantity reaches 0 or is negative
         delete cartData[req.body.itemId];
      }
      await userModel.findByIdAndUpdate(req.body.userId, {cartData});
      res.json({ success: true, message: "Removed From Cart" });
   } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Error" })
   }

}

// get user cart
const getCart = async (req, res) => {
   try {
      let userData = await userModel.findById(req.body.userId);
      if (!userData) {
         return res.json({ success: false, message: "User not found" });
      }
      let cartData = userData.cartData || {};
      res.json({ success: true, cartData:cartData });
   } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Error" })
   }
}


export { addToCart, removeFromCart, getCart }
