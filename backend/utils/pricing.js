import crypto from 'crypto'

// Delivery charge (frontend ke StoreContext mein bhi 49 hai). Env se badal sakte ho: DELIVERY_CHARGE
export const getDeliveryCharge = () => {
    const raw = process.env.DELIVERY_CHARGE
    if (raw !== undefined && raw !== '' && Number.isFinite(Number(raw)) && Number(raw) >= 0) {
        return Number(raw)
    }
    return 49
}

// timing-safe string compare (admin login ke liye)
export const safeEqual = (a, b) => {
    const ha = crypto.createHash('sha256').update(String(a ?? '')).digest()
    const hb = crypto.createHash('sha256').update(String(b ?? '')).digest()
    return crypto.timingSafeEqual(ha, hb)
}

// Promo code check + discount calculation
// promo: promoModel ka document (ya null), subtotal: items ka total (delivery ke bina)
export const checkPromo = (promo, subtotal, now = new Date()) => {
    if (!promo) return { ok: false, message: 'Invalid promo code' }
    if (!promo.active) return { ok: false, message: 'This promo code is not active' }
    if (promo.expiresAt && new Date(promo.expiresAt) < now) return { ok: false, message: 'This promo code has expired' }
    if (subtotal <= 0) return { ok: false, message: 'Your cart is empty' }
    if (subtotal < (promo.minOrder || 0)) {
        return { ok: false, message: `Add items worth ₹${promo.minOrder} or more to use this code` }
    }

    let discount = 0
    if (promo.type === 'percent') {
        discount = Math.floor((subtotal * promo.value) / 100)
        if (promo.maxDiscount > 0) discount = Math.min(discount, promo.maxDiscount)
    } else {
        discount = promo.value
    }
    discount = Math.min(Math.floor(discount), subtotal)

    if (discount <= 0) return { ok: false, message: 'This promo code cannot be applied to your cart' }
    return { ok: true, discount }
}
