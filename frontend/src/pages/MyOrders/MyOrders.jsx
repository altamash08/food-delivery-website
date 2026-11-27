import React, { useContext, useEffect, useState } from 'react'
import './MyOrders.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';

// order ke steps (status ke hisaab se)
const STEPS = [
  { label: 'Order Placed', desc: 'We have received your order' },
  { label: 'Preparing', desc: 'Your food is being prepared' },
  { label: 'Out for Delivery', desc: 'Our rider is on the way' },
  { label: 'Delivered', desc: 'Enjoy your meal!' },
];
const STATUS_STEP = { 'Food Processing': 1, 'Out for delivery': 2, 'Delivered': 3 };

const paymentLabel = (order) => {
  if (order.paymentMethod === 'cod') return order.payment ? 'Cash on delivery (Paid)' : 'Cash on delivery';
  if (order.paymentMethod === 'stripe') return 'Paid online';
  return order.payment ? 'Paid' : 'Pending';
}

const MyOrders = () => {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const { url, token, currency } = useContext(StoreContext);

  const fetchOrders = async () => {
    try {
      const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      // network problem: purana data dikhta rahega
    } finally {
      setLoading(false);
    }
  }

  // orders load + har 30 second mein status refresh (live tracking)
  useEffect(() => {
    if (!token) return;
    fetchOrders();
    const timer = setInterval(fetchOrders, 30000);
    return () => clearInterval(timer);
  }, [token])

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Do you want to cancel this order?")) return;
    try {
      const response = await axios.post(url + "/api/order/cancel", { orderId }, { headers: { token } });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Network problem. Please try again.");
    }
  }

  const toggleTrack = (orderId) => {
    setOpenId((prev) => prev === orderId ? null : orderId);
    fetchOrders();
  }

  return (
    <div className='my-orders'>
      <h2>My Orders</h2>
      <div className="container">
        {loading && token && <p className="my-orders-note">Loading your orders...</p>}
        {!loading && data.length === 0 && (
          <div className="my-orders-empty">
            <img src={assets.parcel_icon} alt="" />
            <h3>No orders yet</h3>
            <p>When you place an order, you can track it here.</p>
          </div>
        )}
        {data.map((order) => {
          const cancelled = order.status === 'Cancelled';
          const current = STATUS_STEP[order.status] ?? 1;
          const open = openId === order._id;
          return (
            <div key={order._id} className={`my-orders-card ${cancelled ? 'cancelled' : ''}`}>
              <div className='my-orders-order'>
                <img src={assets.parcel_icon} alt="" />
                <p>{order.items.map((item, index) => {
                  if (index === order.items.length - 1) {
                    return item.name + " x " + item.quantity
                  }
                  else {
                    return item.name + " x " + item.quantity + ", "
                  }
                })}</p>
                <p>{currency}{order.amount}.00</p>
                <p>Items: {order.items.length}</p>
                <p className={`my-orders-status s-${cancelled ? 'cancelled' : current}`}><span>&#x25cf;</span> <b>{order.status}</b></p>
                <button onClick={() => toggleTrack(order._id)}>{open ? 'Hide' : 'Track Order'}</button>
              </div>

              {open && (
                <div className="my-orders-track">
                  {cancelled
                    ? <p className="my-orders-cancelled-note">This order was cancelled.</p>
                    : <div className="timeline">
                        {STEPS.map((step, i) => (
                          <div key={step.label} className={`timeline-step ${i < current || current === 3 ? 'done' : ''} ${i === current && current < 3 ? 'active' : ''}`}>
                            <div className="timeline-dot">{i < current || current === 3 ? '✓' : ''}</div>
                            <div className="timeline-text">
                              <b>{step.label}</b>
                              <span>{step.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                  }

                  <div className="my-orders-details">
                    <div>
                      <small>Placed on</small>
                      <p>{new Date(order.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <small>Payment</small>
                      <p>{paymentLabel(order)}</p>
                    </div>
                    <div>
                      <small>Deliver to</small>
                      <p>{order.address.street}, {order.address.city}</p>
                    </div>
                    {order.discount > 0 && (
                      <div>
                        <small>Promo {order.promoCode}</small>
                        <p>- {currency}{order.discount}</p>
                      </div>
                    )}
                  </div>

                  {order.paymentMethod === 'cod' && order.status === 'Food Processing' && (
                    <button className="my-orders-cancel" onClick={() => cancelOrder(order._id)}>Cancel order</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyOrders
