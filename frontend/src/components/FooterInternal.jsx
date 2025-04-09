// src/components/FooterInternal.jsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Assuming logos are in /public
const logoSrc = "/GoldNest.png";
const paypalSrc = "/paypal-icon.png"; // Ensure these exist
// Add other payment provider logos if used (Paytm mentioned in HTML?)
// const paytmSrc = "/paytm-icon.png";
const payhereSrc = "/PayHere-icon.png"; // Ensure this exists

export default function FooterInternal() {
  return (
      <footer className="footer">
        <div className="footer-content">
            <div className="footer-section logo-section">
                {/* Link to dashboard for internal pages */}
                <Link href="/dashboard">
                    <Image src={logoSrc} alt="GoldNest Logo Small" width={100} height={30} loading="lazy"/>
                </Link>
                {/* Use correct support email */}
                <p><a href="mailto:support@goldnest.com" aria-label="Email GoldNest Support">support@goldnest.com</a></p>
            </div>
            <div className="footer-section">
                <h4>Navigation</h4>
                <ul>
                    {/* Update hrefs */}
                    <li><Link href="/dashboard">Home (Dashboard)</Link></li>
                    <li><Link href="/calculatorinternal">Calculator</Link></li>
                    <li><Link href="/marketinternal">Market</Link></li>
                    <li><Link href="/aboutinternal">About</Link></li>
                </ul>
            </div>
            <div className="footer-section">
                <h4>Legal</h4>
                <ul>
                    <li><Link href="/privacyinternal">Privacy Policy</Link></li>
                    <li><Link href="/termsinternal">Terms of Service</Link></li>
                    <li><Link href="/shippinginternal">Shipping & Returns</Link></li>
                </ul>
            </div>
            <div className="footer-section">
                <h4>Payment Providers</h4>
                <div className="payment-icons">
                    <Image src={paypalSrc} alt="PayPal" width={60} height={20} loading="lazy"/>
                     <Image src={payhereSrc} alt="PayHere" width={70} height={20} loading="lazy"/>
                     {/* Add Paytm or others if used */}
                     {/* <Image src={paytmSrc} alt="Paytm" loading="lazy" /> */}
                </div>
            </div>
            <div className="footer-section">
                <h4>Follow Us</h4>
                <div className="social-icons">
                    {/* Add actual links */}
                    <a href="#" aria-label="Visit GoldNest on Facebook"><i className="fab fa-facebook-f"></i></a>
                    <a href="#" aria-label="Visit GoldNest on LinkedIn"><i className="fab fa-linkedin-in"></i></a>
                    <a href="#" aria-label="Visit GoldNest on YouTube"><i className="fab fa-youtube"></i></a>
                    <a href="#" aria-label="Visit GoldNest on Instagram"><i className="fab fa-instagram"></i></a>
                </div>
            </div>
        </div>
        <div className="footer-bottom">
            <p>© CodeMavericks 2025. All rights reserved.</p>
        </div>
    </footer>
  );
}
