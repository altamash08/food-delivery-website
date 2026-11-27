import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import { Navigate, Route, Routes } from 'react-router-dom'
import Add from './pages/Add/Add'
import List from './pages/List/List'
import Orders from './pages/Orders/Orders'
import Dashboard from './pages/Dashboard/Dashboard'
import Promos from './pages/Promos/Promos'
import Login from './pages/Login/Login'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {

  const [token, setToken] = useState(localStorage.getItem('adminToken') || '')

  // token expire hone par api.js ye event bhejta hai
  useEffect(() => {
    const onLogout = () => {
      setToken('')
      toast.info('Session expired. Please login again.')
    }
    window.addEventListener('admin-logout', onLogout)
    return () => window.removeEventListener('admin-logout', onLogout)
  }, [])

  const logout = () => {
    localStorage.removeItem('adminToken')
    setToken('')
  }

  if (!token) {
    return (
      <>
        <ToastContainer />
        <Login onLogin={setToken} />
      </>
    )
  }

  return (
    <div className='app'>
      <ToastContainer />
      <Navbar onLogout={logout} />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<Add />} />
          <Route path="/list" element={<List />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/promos" element={<Promos />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
