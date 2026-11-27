import React, { useContext, useEffect, useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../Context/StoreContext'

const Navbar = ({ setShowLogin }) => {

  const [menu, setMenu] = useState("home");
  const [open, setOpen] = useState(false); // mobile menu
  const { getTotalCartAmount, token ,setToken, cartItems } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  // cart mein kul kitne items
  const cartCount = Object.values(cartItems || {}).reduce((sum, n) => sum + (n > 0 ? n : 0), 0);

  // page badalne par mobile menu band
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setOpen(false);
    navigate('/')
  }

  // Home tap karne par: page ke sabse upar le jao (cart/orders page se bhi home khulega)
  const goHome = () => {
    setMenu("home");
    setOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Menu / Mobile app / Contact tap karne par us section tak smooth scroll
  const scrollToSection = (e, id, name) => {
    e.preventDefault();
    setMenu(name);
    setOpen(false);

    const scroll = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    // agar user cart/orders jaise dusre page par hai to pehle home par jao, phir scroll
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(scroll, 150);
    } else {
      scroll();
    }
  }

  return (
    <div className='navbar'>
      <Link to='/' onClick={goHome}><img className='logo' src={assets.logo} alt="" /></Link>
      <ul className="navbar-menu">
        <Link to="/" onClick={goHome} className={`${menu === "home" ? "active" : ""}`}>Home</Link>
        <a href='#explore-menu' onClick={(e) => scrollToSection(e, "explore-menu", "menu")} className={`${menu === "menu" ? "active" : ""}`}>Menu</a>
        <a href='#app-download' onClick={(e) => scrollToSection(e, "app-download", "mob-app")} className={`${menu === "mob-app" ? "active" : ""}`}>Mobile app</a>
        <a href='#footer' onClick={(e) => scrollToSection(e, "footer", "contact")} className={`${menu === "contact" ? "active" : ""}`}>Contact us</a>
      </ul>
      <div className="navbar-right">
        <Link to='/cart' className='navbar-search-icon'>
          <img src={assets.basket_icon} alt="" />
          <div className={getTotalCartAmount() > 0 ? "dot" : ""}></div>
        </Link>
        {!token ? <button onClick={() => setShowLogin(true)}>sign in</button>
          : <div className='navbar-profile'>
            <img src={assets.profile_icon} alt="" />
            <ul className='navbar-profile-dropdown'>
              <li onClick={()=>navigate('/myorders')}> <img src={assets.bag_icon} alt="" /> <p>Orders</p></li>
              <hr />
              <li onClick={logout}> <img src={assets.logout_icon} alt="" /> <p>Logout</p></li>
            </ul>
          </div>
        }
      </div>

      {/* hamburger button: sirf mobile par dikhta hai */}
      <button
        className={`navbar-toggle ${open ? "open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Menu"
        aria-expanded={open}
      >
        <span></span><span></span><span></span>
      </button>

      {open && (
        <div className="navbar-mobile">
          <Link to="/" onClick={goHome} className={menu === "home" ? "active" : ""}>Home</Link>
          <a href='#explore-menu' onClick={(e) => scrollToSection(e, "explore-menu", "menu")} className={menu === "menu" ? "active" : ""}>Menu</a>
          <a href='#app-download' onClick={(e) => scrollToSection(e, "app-download", "mob-app")} className={menu === "mob-app" ? "active" : ""}>Mobile app</a>
          <a href='#footer' onClick={(e) => scrollToSection(e, "footer", "contact")} className={menu === "contact" ? "active" : ""}>Contact us</a>
          <hr />
          <Link to="/cart">Cart {cartCount > 0 && <span className='navbar-mobile-badge'>{cartCount}</span>}</Link>
          {token
            ? <>
                <Link to="/myorders">My Orders</Link>
                <a href='#logout' onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
              </>
            : <a href='#signin' onClick={(e) => { e.preventDefault(); setOpen(false); setShowLogin(true); }}>Sign in</a>
          }
        </div>
      )}
    </div>
  )
}

export default Navbar
