import React, { useContext, useState } from 'react'
import './Cart.css'
import { StoreContext } from '../../Context/StoreContext'
import { useNavigate } from 'react-router-dom';

const Cart = () => {

  const {cartItems, food_list, removeFromCart, getTotalCartAmount, getFinalAmount, promo, applyPromo, removePromo, url, currency, deliveryCharge} = useContext(StoreContext);
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [promoMsg, setPromoMsg] = useState({ text: "", ok: false });
  const [applying, setApplying] = useState(false);

  const subtotal = getTotalCartAmount();
  const isEmpty = subtotal === 0;

  const onApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setPromoMsg({ text: "Enter a promo code", ok: false });
      return;
    }
    setApplying(true);
    const result = await applyPromo(code.trim());
    setApplying(false);
    setPromoMsg({ text: result.message, ok: result.ok });
    if (result.ok) setCode("");
  }

  const onRemovePromo = () => {
    removePromo();
    setPromoMsg({ text: "", ok: false });
  }

  const browseMenu = () => {
    navigate('/');
    setTimeout(() => {
      const el = document.getElementById('explore-menu');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  }

  if (isEmpty) {
    return (
      <div className='cart'>
        <div className="cart-empty">
          <div className="cart-empty-icon">
            <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path d="M6 7h12l1 13H5L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
          </div>
          <h3>Your cart is empty</h3>
          <p>Looks like you have not added anything yet. Pick something delicious from our menu!</p>
          <button onClick={browseMenu}>Browse menu</button>
        </div>
      </div>
    )
  }

  return (
    <div className='cart'>
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p> <p>Title</p> <p>Price</p> <p>Quantity</p> <p>Total</p> <p>Remove</p>
        </div>
        <br />
        <hr />
        {food_list.map((item, index) => {
          if (cartItems[item._id]>0) {
            return (<div key={index}>
              <div className="cart-items-title cart-items-item">
                <img src={url+"/images/"+item.image} alt="" />
                <p>{item.name}</p>
                <p>{currency}{item.price}</p>
                <div>{cartItems[item._id]}</div>
                <p>{currency}{item.price*cartItems[item._id]}</p>
                <p className='cart-items-remove-icon' onClick={()=>removeFromCart(item._id)}>x</p>
              </div>
              <hr />
            </div>)
          }
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details"><p>Subtotal</p><p>{currency}{subtotal}</p></div>
            <hr />
            {promo.discount > 0 && <>
              <div className="cart-total-details discount"><p>Promo ({promo.code})</p><p>- {currency}{promo.discount}</p></div>
              <hr />
            </>}
            <div className="cart-total-details"><p>Delivery Fee</p><p>{currency}{deliveryCharge}</p></div>
            <hr />
            <div className="cart-total-details"><b>Total</b><b>{currency}{getFinalAmount()}</b></div>
          </div>
          <button onClick={()=>navigate('/order')}>PROCEED TO CHECKOUT</button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it here</p>
            {promo.code
              ? <div className="cart-promo-applied">
                  <div>
                    <b>{promo.code}</b>
                    <span>You saved {currency}{promo.discount}</span>
                  </div>
                  <button type="button" onClick={onRemovePromo}>Remove</button>
                </div>
              : <form className='cart-promocode-input' onSubmit={onApply}>
                  <input type="text" placeholder='promo code' value={code} onChange={(e)=>setCode(e.target.value)} />
                  <button type="submit" disabled={applying}>{applying ? "..." : "Apply"}</button>
                </form>
            }
            {promoMsg.text && !promo.code && <p className={`cart-promo-msg ${promoMsg.ok ? "ok" : "error"}`}>{promoMsg.text}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
