import React, { useRef, useState } from 'react'
import './Login.css'
import { toast } from 'react-toastify'
import api from '../../api'
import { assets } from '../../assets/assets'

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 30 * 1000

const Login = ({ onLogin }) => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const retryRef = useRef(0)
  const timerRef = useRef(null)

  const submit = async (e) => {
    e?.preventDefault?.()
    if (e) {
      // user ne khud submit kiya: purana retry band karke naye sire se shuru
      retryRef.current = 0
      clearTimeout(timerRef.current)
    }
    setLoading(true)
    try {
      const response = await api.post('/api/admin/login', { email, password })
      if (response.data.success) {
        retryRef.current = 0
        localStorage.setItem('adminToken', response.data.token)
        onLogin(response.data.token)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      const isNetworkError = !error.response

      // Render free-tier services spin down after inactivity and take ~30s to cold-start.
      // Auto-retry instead of immediately failing so a sleeping server recovers on its own.
      if (isNetworkError && retryRef.current < MAX_RETRIES) {
        retryRef.current += 1
        toast.info('Server is waking up. Retrying automatically in 30 seconds…')
        timerRef.current = setTimeout(() => submit(), RETRY_DELAY_MS)
        setLoading(false)
        return
      }

      toast.error(
        isNetworkError
          ? 'Server not reachable. If it was sleeping, wait 30 seconds and try again.'
          : error.response?.data?.message || 'Login failed'
      )
    }
    setLoading(false)
  }

  return (
    <div className='login-page'>
      <form className='login-card' onSubmit={submit}>
        <img src={assets.logo} alt="" />
        <h2>Admin Login</h2>
        <p>Sign in to manage your restaurant.</p>
        <input type="email" placeholder='Admin email' value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <input type="password" placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type='submit' disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </div>
  )
}

export default Login