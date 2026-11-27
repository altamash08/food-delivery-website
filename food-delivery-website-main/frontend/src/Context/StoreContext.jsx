import { createContext, useEffect, useState } from "react";
import { menu_list } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {

    const url = (import.meta.env.VITE_BACKEND_URL || "https://food-delivery-website-backend-buab.onrender.com").replace(/\/+$/, "")
    const [food_list, setFoodList] = useState([]);
    const [foodLoading, setFoodLoading] = useState(true);
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState("")
    const currency = "₹";
    const deliveryCharge = Number(import.meta.env.VITE_DELIVERY_CHARGE || 49);

    // ---- favourites (is device ke browser mein save hote hain) ----
    const [favorites, setFavorites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("favorites") || "[]");
        } catch (error) {
            return [];
        }
    });

    const toggleFavorite = (itemId) => {
        setFavorites((prev) => {
            const next = prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId];
            localStorage.setItem("favorites", JSON.stringify(next));
            return next;
        });
    }

    // ---- cart ----
    const addToCart = async (itemId) => {
        if (!cartItems[itemId]) {
            setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
        }
        else {
            setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
        }
        if (token) {
            try {
                const response = await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
                if (!response.data.success) {
                    // server ne mana kiya (jaise out of stock): local cart wapas theek karo
                    setCartItems((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] || 1) - 1) }));
                    toast.error(response.data.message);
                }
            } catch (error) {
                toast.error("Network problem. Please try again.");
            }
        }
    }

    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }))
        if (token) {
            try {
                await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
            } catch (error) {
                // network error: ignore
            }
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const item in cartItems) {
            try {
              if (cartItems[item] > 0) {
                let itemInfo = food_list.find((product) => product._id === item);
                totalAmount += itemInfo.price * cartItems[item];
            }
            } catch (error) {

            }

        }
        return totalAmount;
    }

    // ---- promo code ----
    const [promo, setPromo] = useState({ code: "", discount: 0 });

    const removePromo = () => setPromo({ code: "", discount: 0 });

    const applyPromo = async (code) => {
        try {
            const response = await axios.post(url + "/api/promo/apply", { code, subtotal: getTotalCartAmount() });
            if (response.data.success) {
                setPromo({ code: response.data.code, discount: response.data.discount });
                return { ok: true, message: response.data.message };
            }
            return { ok: false, message: response.data.message };
        } catch (error) {
            return { ok: false, message: "Could not apply the code. Please try again." };
        }
    }

    // cart badalne par discount dobara check hota hai
    const subtotal = getTotalCartAmount();
    useEffect(() => {
        if (!promo.code) return;
        if (subtotal === 0) {
            removePromo();
            return;
        }
        const recheck = async () => {
            try {
                const response = await axios.post(url + "/api/promo/apply", { code: promo.code, subtotal });
                if (response.data.success) {
                    setPromo((prev) => prev.discount === response.data.discount ? prev : { code: response.data.code, discount: response.data.discount });
                } else {
                    removePromo();
                    toast.info(response.data.message);
                }
            } catch (error) {
                // network error: purana discount rehne do
            }
        }
        recheck();
    }, [subtotal])

    const getFinalAmount = () => {
        const sub = getTotalCartAmount();
        return sub === 0 ? 0 : sub - promo.discount + deliveryCharge;
    }

    // ---- data load ----
    const fetchFoodList = async () => {
        try {
            const response = await axios.get(url + "/api/food/list");
            if (response.data.success) {
                setFoodList(response.data.data)
            }
        } catch (error) {
            toast.error("Could not load the menu. Please refresh the page.");
        } finally {
            setFoodLoading(false);
        }
    }

    const loadCartData = async (token) => {
        try {
            const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
            if (response.data.success) {
                setCartItems(response.data.cartData || {});
            }
        } catch (error) {
            // network error: cart local hi rehne do
        }
    }

    useEffect(() => {
        async function loadData() {
            await fetchFoodList();
            if (localStorage.getItem("token")) {
                setToken(localStorage.getItem("token"))
                await loadCartData(localStorage.getItem("token"))
            }
        }
        loadData()
    }, [])

    const contextValue = {
        url,
        food_list,
        foodLoading,
        fetchFoodList,
        menu_list,
        cartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        getFinalAmount,
        promo,
        applyPromo,
        removePromo,
        favorites,
        toggleFavorite,
        token,
        setToken,
        loadCartData,
        setCartItems,
        currency,
        deliveryCharge
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )

}

export default StoreContextProvider;