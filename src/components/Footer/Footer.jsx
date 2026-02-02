import React from "react";
import "./Footer.css";
import { assets } from "../../assets/assets";

const Footer = () => {
  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-content-left">
          <img src={assets.logos} alt="" />
          <p>
            QuickBite is the fast, fresh, and easy way to get your favorite
            meals delivered. From local street food to gourmet dishes, we
            connect you with top restaurants nearby. Enjoy real-time tracking,
            secure payments, and a seamless ordering experience.
          </p>
          <div className="footer-social-icons">
            <img src={assets.facebook_icon} alt="" />
            <img src={assets.twitter_icon} alt="" />
            <img src={assets.linkedin_icon} alt="" />
          </div>
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li>Home</li>
            <li>About us</li>
            <li>Delivery</li>
            <li>Privacy policy</li>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>GET IN TOUCH</h2>
          <ul>
            <li>+91-9988776655</li>
            <li>contact.Quickbite@gmail.com</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright 2025 © QuickBite.in - All Right Reserved  || Created By Altamash, Nezamul, Usman
      </p>
    </div>
  );
};

export default Footer;
