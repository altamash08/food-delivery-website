import React from 'react'
import  './Sidebar.css'
import { NavLink } from 'react-router-dom'

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

const Sidebar = () => {
  return (
    <div className='sidebar'>
      <div className="sidebar-options">
        <NavLink to='/' end className="sidebar-option">
            <Icon><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></Icon>
            <p>Dashboard</p>
        </NavLink>
        <NavLink to='/add' className="sidebar-option">
            <Icon><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></Icon>
            <p>Add Items</p>
        </NavLink>
        <NavLink to='/list' className="sidebar-option">
            <Icon><path d="M9 6h12M9 12h12M9 18h12" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></Icon>
            <p>List Items</p>
        </NavLink>
        <NavLink to='/orders' className="sidebar-option">
            <Icon><path d="M6 7h12l1 13H5L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></Icon>
            <p>Orders</p>
        </NavLink>
        <NavLink to='/promos' className="sidebar-option">
            <Icon><path d="M3 12V4h8l10 10-8 8L3 12z" /><circle cx="7.5" cy="8.5" r="1.3" /></Icon>
            <p>Promo Codes</p>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar
