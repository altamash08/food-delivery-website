import React from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'

const Navbar = ({ onLogout }) => {
  return (
    <div className='navbar'>
      <img className='logo' src={assets.logo} alt="" />
      <div className="navbar-right">
        <span className="navbar-label">Admin Dashboard</span>
        <button className="navbar-logout" onClick={onLogout}>Logout</button>
      </div>
    </div>
  )
}

export default Navbar
