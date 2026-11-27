import axios from 'axios';
import React, { useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StoreContext } from '../../Context/StoreContext';
import './Verify.css'

const Verify = () => {
  const { url } = useContext(StoreContext)
  const [searchParams, setSearchParams] = useSearchParams();
  const success = searchParams.get("success")
  const orderId = searchParams.get("orderId")
  const sessionId = searchParams.get("session_id")

  const navigate = useNavigate();

  const verifyPayment = async () => {
    try {
      // session_id se server Stripe se payment confirm karta hai
      const response = await axios.post(url + "/api/order/verify", { success, orderId, session_id: sessionId });
      if (response.data.success) {
        navigate("/myorders");
      }
      else {
        navigate("/")
      }
    } catch (error) {
      navigate("/")
    }
  }

  useEffect(() => {
    verifyPayment();
  }, [])

  return (
    <div className='verify'>
      <div className="spinner"></div>
    </div>
  )
}

export default Verify
