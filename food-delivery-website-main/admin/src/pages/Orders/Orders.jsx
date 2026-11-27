import React, { useEffect, useState } from 'react'
import './Orders.css'
import { toast } from 'react-toastify';
import api from '../../api';
import { assets, currency } from '../../assets/assets';

const STATUSES = ["Food Processing", "Out for delivery", "Delivered", "Cancelled"];

const paymentInfo = (order) => {
  if (order.paymentMethod === 'cod') return order.payment ? { text: 'COD · Paid', cls: 'paid' } : { text: 'Cash on delivery', cls: 'cod' };
  if (order.paymentMethod === 'stripe') return { text: 'Paid online', cls: 'paid' };
  return order.payment ? { text: 'Paid', cls: 'paid' } : { text: 'Pending', cls: 'cod' };
}

const Order = () => {

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const fetchAllOrders = async () => {
    try {
      const response = await api.get(`/api/order/list`)
      if (response.data.success) {
        setOrders(response.data.data); // server newest-first bhejta hai
      }
      else if (response.data.message !== 'Not Authorized') {
        toast.error("Error")
      }
    } catch (error) {
      toast.error("Could not load orders")
    }
  }

  const statusHandler = async (event, orderId) => {
    const response = await api.post(`/api/order/status`, {
      orderId,
      status: event.target.value
    })
    if (response.data.success) {
      await fetchAllOrders();
    } else if (response.data.message !== 'Not Authorized') {
      toast.error(response.data.message)
    }
  }

  // naye orders ke liye har 60 second mein refresh
  useEffect(() => {
    fetchAllOrders();
    const timer = setInterval(fetchAllOrders, 60000);
    return () => clearInterval(timer);
  }, [])

  const q = search.trim().toLowerCase();
  const visible = orders.filter((o) => {
    if (filter !== "All" && o.status !== filter) return false;
    if (!q) return true;
    const a = o.address || {};
    const text = `${a.firstName} ${a.lastName} ${a.phone} ${o._id} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase();
    return text.includes(q);
  });

  const countOf = (status) => status === "All" ? orders.length : orders.filter((o) => o.status === status).length;

  return (
    <div className='order add'>
      <h3>Order Page</h3>

      <div className="order-tools">
        <div className="order-tabs">
          {["All", ...STATUSES].map((s) => (
            <button key={s} className={filter === s ? "active" : ""} onClick={() => setFilter(s)}>
              {s} <em>{countOf(s)}</em>
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search name, phone, item..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="order-list">
        {visible.length === 0 && <p className="order-empty">No orders found.</p>}
        {visible.map((order) => {
          const pay = paymentInfo(order);
          return (
            <div key={order._id} className='order-item'>
              <img src={assets.parcel_icon} alt="" />
              <div>
                <p className='order-item-food'>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return item.name + " x " + item.quantity
                    }
                    else {
                      return item.name + " x " + item.quantity + ", "
                    }
                  })}
                </p>
                <p className='order-item-name'>{order.address.firstName + " " + order.address.lastName}</p>
                <div className='order-item-address'>
                  <span>{order.address.street + ","}</span>
                  <span>{order.address.city + ", " + order.address.state + ", " + order.address.country + ", " + order.address.zipcode}</span>
                </div>
                <span className='order-item-phone'>{order.address.phone}</span>
                <div className="order-badges">
                  <em className={`badge ${pay.cls}`}>{pay.text}</em>
                  {order.discount > 0 && <em className="badge promo">{order.promoCode} (-{currency}{order.discount})</em>}
                  <em className="badge date">{new Date(order.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</em>
                </div>
              </div>
              <p>Items : {order.items.length}</p>
              <p>{currency}{order.amount}</p>
              <select onChange={(e) => statusHandler(e, order._id)} value={order.status} name="" id="">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Order
