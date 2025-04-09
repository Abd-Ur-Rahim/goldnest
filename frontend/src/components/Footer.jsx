// src/components/Footer.jsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Assume icons are in public folder or handle Font Awesome setup separately
const logoSrc = "/GoldNest.png"; // Small version? Or same?
const paypalSrc = "/paypal-icon.png"; // Ensure these exist in /public
const payhereSrc = "/PayHere-icon.png"; // **USE CORRECT PAYHERE LOGO FILENAME**

export default function Footer() {
  return (
    <footer className="footer"> {/* Use class from styles.css */}
        <div className="footer-content">
             <div className="footer-section logo-section">
                <Image src={logoSrc} alt="GoldNest Logo Small" width={100} height={30} className="footer-logo"/>
                 <p><a href="mailto:support@goldnest.com">support@goldnest.com</a></p> {/* Use correct email */}
            </div>
            <div className="footer-section">
                <h4>Navigation</h4>
                <ul>
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/calculator">Calculator</Link></li>
                    <li><Link href="/market">Market</Link></li>
                    <li><Link href="/about">About</Link></li>
                </ul>
            </div>
            <div className="footer-section">
                <h4>Legal</h4>
                <ul>
                     <li><Link href="/privacy">Privacy</Link></li>
                     <li><Link href="/terms">Terms</Link></li>
                     <li><Link href="/shipping">Shipping</Link></li>
                </ul>
            </div>
            <div className="footer-section">
                <h4>Payment Providers</h4>
                 {/* Ensure class names match styles.css */}
                <div className="payment-icons">
                    <Image src={paypalSrc} alt="PayPal" width={80} height={25}/> {/* Adjust size */}
                     <Image src={payhereSrc} alt="PayHere" width={80} height={25}/> {/* Adjust size */}
                </div>
            </div>
             <div className="footer-section">
                <h4>Social Media</h4>
                 {/* Ensure class names match styles.css */}
                 {/* Make sure Font Awesome is loaded (see Step D) */}
                <div className="social-icons">
                    <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
                    <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                    <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
                     <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                </div>
            </div>
        </div>
        <p className="footer-bottom">Copyright © CodeMavericks 2025. All rights reserved</p>
    </footer>
  );
}
