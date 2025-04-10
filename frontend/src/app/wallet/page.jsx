// src/app/wallet/page.jsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import NavbarInternal from '@/components/NavbarInternal';
import FooterInternal from '@/components/FooterInternal';
import Image from 'next/image';

// --- Import Skeletons ---
import { WalletOverviewSkeleton } from '@/components/skeletons/WalletOverviewSkeleton';
import { TransactionRowSkeleton } from '@/components/skeletons/TransactionRowSkeleton';
import { RedeemProgressSkeleton } from '@/components/skeletons/RedeemProgressSkeleton';
import { GamificationSkeleton } from '@/components/skeletons/GamificationSkeleton';

// --- Helper Functions ---
const formatCurrency = (value, showCurrencySymbol = true) => {
    if (value === null || value === undefined || isNaN(value)) {
        return showCurrencySymbol ? 'Rs. 0.00' : '0.00';
    }
    const options = {
        style: 'currency',
        currency: 'LKR', // Or 'INR' if Rs means Indian Rupees
        minimumFractionDigits: 2
    };
    if (!showCurrencySymbol) {
        options.currencyDisplay = 'code'; // Use 'code' or 'name' and then remove it if needed
    }
    let formatted = new Intl.NumberFormat('en-LK', options).format(value); // Use 'en-IN' for INR

    // Remove the currency code/symbol if requested (adjust based on locale)
    if (!showCurrencySymbol) {
        formatted = formatted.replace('LKR', '').trim(); // Adjust removal logic as needed
        // formatted = formatted.replace('₹', '').trim(); // For INR
    } else {
        formatted = formatted.replace('LKR', 'Rs.'); // Replace code with Rs. symbol if desired
        // formatted = formatted.replace('INR', 'Rs.'); // Or keep '₹' if using en-IN
    }
    return formatted;
};


const formatDate = (dateString) => {
     if (!dateString) return 'N/A';
    try {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
        let formatted = new Date(dateString).toLocaleString('en-US', options);
        return formatted;
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
};

const formatGrams = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0g';
    }
    // Simple formatting, adjust precision as needed
    return `${Number(value).toFixed(1)}g`;
}

// --- End Helper Functions ---

const TRANSACTIONS_PER_PAGE = 4;
const REDEEMS_PER_PAGE = 3;

export default function WalletPage() {
    // --- State Variables ---
    const [userData, setUserData] = useState(null);
    const [marketData, setMarketData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [transactionFilter, setTransactionFilter] = useState('all');
    const [transactionSearch, setTransactionSearch] = useState('');
    const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
    const [redeemFilter, setRedeemFilter] = useState('all');
    const [currentRedeemPage, setCurrentRedeemPage] = useState(1);
    const [showCustomRedeem, setShowCustomRedeem] = useState(false);
    const [customRedeemSize, setCustomRedeemSize] = useState('1');
    const [customRedeemQuantity, setCustomRedeemQuantity] = useState(1);
    const [showStarsInfo, setShowStarsInfo] = useState(false);

    const router = useRouter();

    // --- Data Fetching ---
    useEffect(() => {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const token = localStorage.getItem('userToken');

        const fetchPageData = async () => {
            setError('');
            if (!token) {
                 setError("Authentication token not found. Please log in.");
                 setLoading(false);
                 router.push('/');
                 return;
             }
            const config = { headers: { Authorization: `Bearer ${token}` } };

            try {
                const [userRes, marketRes] = await Promise.allSettled([ // Use allSettled to get results even if one fails
                    axios.get(`${backendUrl}/api/users/me`, config),
                    axios.get(`${backendUrl}/api/market/gold-summary`) // Don't add auth header if it's public
                ]);

                let userDataResult = null;
                let marketDataResult = null;
                let fetchError = null;

                if (userRes.status === 'fulfilled' && userRes.value.data) {
                    userDataResult = userRes.value.data;
                    console.log("User Data Received:", userDataResult);
                } else {
                    // Handle user data fetch error specifically
                    const userError = userRes.reason?.response?.data?.message || userRes.reason?.message || "Failed to load user data.";
                    console.error("User data fetch error:", userRes.reason);
                    fetchError = userError; // Prioritize user data error
                    if (userRes.reason?.response?.status === 401) {
                        localStorage.clear(); router.push('/'); return; // Critical auth error, stop here
                    }
                }

                if (marketRes.status === 'fulfilled' && marketRes.value.data) {
                    marketDataResult = marketRes.value.data;
                    console.log("Market Data Received:", marketDataResult);
                } else {
                     // Market data error is less critical, log it but don't necessarily block rendering
                    console.warn("Market data fetch error:", marketRes.reason);
                    if (!fetchError) { // Only set market error if user data was ok
                        fetchError = "Failed to load market data. Values might be estimates.";
                    }
                }

                setUserData(userDataResult);
                setMarketData(marketDataResult);
                setError(fetchError || ''); // Set error if any occurred


            } catch (err) { // Catch unexpected errors during Promise.allSettled or setup
                console.error("Error setting up wallet page data fetch:", err);
                setError("An unexpected error occurred while loading wallet data.");
                 setUserData(null); // Clear data on unexpected error
                 setMarketData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchPageData();
    }, [router]);

    // --- Derived Data & Calculations ---
    const goldBalanceGrams = userData?.goldBalanceGrams ?? 0;
    const cashBalanceLKR = userData?.cashBalanceLKR ?? 0;
    const currentPricePerGram = marketData?.latestPricePerGram || 0;
    const goldValueLKR = goldBalanceGrams * currentPricePerGram;
    const priceTrendPercent = marketData?.priceChangePercent ?? 0;
    const priceTrendDirection = marketData?.trend ?? 'stable';

    const lastDeposit = useMemo(() => (userData?.transactions || [])
        .filter(t => t.type === 'deposit' && t.status === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0],
        [userData?.transactions]
    );
    const lastPurchase = useMemo(() => (userData?.transactions || [])
        .filter(t => t.type === 'investment' && t.status === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0],
        [userData?.transactions]
    );

    const getRedeemProgress = (target) => {
        if (target <= 0 || goldBalanceGrams <= 0) return 0;
        return Math.min(100, (goldBalanceGrams / target) * 100);
    };
    const progress1g = getRedeemProgress(1);
    const progress5g = getRedeemProgress(5);
    const progress10g = getRedeemProgress(10);

    // --- Filtering/Pagination (Transactions) ---
    const filteredTransactions = useMemo(() => {
        return (userData?.transactions || []).filter(tx => {
            const typeMatch = transactionFilter === 'all' || tx.type === transactionFilter;
            const searchTerm = transactionSearch.toLowerCase();
            const searchMatch = !searchTerm ||
                formatDate(tx.date).toLowerCase().includes(searchTerm) ||
                (tx.amountLKR && tx.amountLKR.toString().includes(searchTerm)) ||
                (tx.amountGrams && tx.amountGrams.toString().includes(searchTerm)) ||
                (tx.type && tx.type.toLowerCase().replace('_',' ').includes(searchTerm)) ||
                (tx.status && tx.status.toLowerCase().includes(searchTerm));
            return typeMatch && searchMatch;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [userData?.transactions, transactionFilter, transactionSearch]);

    const totalTransactionPages = Math.ceil(filteredTransactions.length / TRANSACTIONS_PER_PAGE);
    const paginatedTransactions = useMemo(() => {
        return filteredTransactions.slice(
            (currentTransactionPage - 1) * TRANSACTIONS_PER_PAGE,
            currentTransactionPage * TRANSACTIONS_PER_PAGE
        );
    }, [filteredTransactions, currentTransactionPage]);

    // --- Filtering/Pagination (Redemptions) ---
    const redeemHistoryTransactions = useMemo(() => {
        return (userData?.transactions || [])
            .filter(tx => tx.type === 'redemption')
            .filter(tx => redeemFilter === 'all' || (tx.status && tx.status.toLowerCase() === redeemFilter))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [userData?.transactions, redeemFilter]);

    const totalRedeemPages = Math.ceil(redeemHistoryTransactions.length / REDEEMS_PER_PAGE);
    const paginatedRedeems = useMemo(() => {
        return redeemHistoryTransactions.slice(
            (currentRedeemPage - 1) * REDEEMS_PER_PAGE,
            currentRedeemPage * REDEEMS_PER_PAGE
        );
    }, [redeemHistoryTransactions, currentRedeemPage]);

    // --- Custom Redeem Calculation ---
    const customRedeemTotalGrams = useMemo(() => {
        const size = parseFloat(customRedeemSize);
        const quantity = parseInt(customRedeemQuantity, 10);
        return (!isNaN(size) && !isNaN(quantity) && size > 0 && quantity > 0) ? size * quantity : 0;
    }, [customRedeemSize, customRedeemQuantity]);

    const hasSufficientGoldForCustom = goldBalanceGrams >= customRedeemTotalGrams && customRedeemTotalGrams > 0;

    // --- Gamification Data ---
    const earnedBadgeIds = userData?.earnedBadgeIds || [];
    const challengeProgressMap = userData?.challengeProgress || {};
    const starCount = userData?.starCount || 0;
    const allBadges = userData?.gamificationDefs?.badges || [];
    const activeChallenges = userData?.gamificationDefs?.challenges || [];
    // Define max stars for display (adjust if needed)
    const maxStars = 5;


    // --- RENDER FUNCTIONS (Refined to match HTML structure) ---
    const renderTransactionRow = (tx, index) => {
        let cashAmountDisplay = '—'; let cashClass = '';
        let goldAmountDisplay = '—'; let goldClass = ''; // Add class for gold if needed
        let rateDisplay = '—'; let feeDisplay = '—';
        let totalDisplay = 'N/A';
        let status = tx.status?.toLowerCase() || 'completed';

        switch (tx.type) {
            case 'deposit': cashAmountDisplay = `+ ${formatCurrency(tx.amountLKR)}`; cashClass = 'positive'; totalDisplay = formatCurrency(tx.amountLKR); break;
            case 'withdrawal': cashAmountDisplay = `- ${formatCurrency(tx.amountLKR)}`; cashClass = 'negative'; totalDisplay = formatCurrency(tx.amountLKR); break;
            case 'investment': cashAmountDisplay = `- ${formatCurrency(tx.amountLKR)}`; cashClass = 'negative'; goldAmountDisplay = `+ ${tx.amountGrams?.toFixed(3)} g`; goldClass = 'positive'; rateDisplay = tx.amountGrams > 0 ? `${formatCurrency(tx.amountLKR / tx.amountGrams)}/g` : 'N/A'; totalDisplay = `${tx.amountGrams?.toFixed(3)} g`; break;
            case 'sell_gold': cashAmountDisplay = `+ ${formatCurrency(tx.amountLKR)}`; cashClass = 'positive'; goldAmountDisplay = `- ${tx.amountGrams?.toFixed(3)} g`; goldClass = 'negative'; rateDisplay = tx.amountGrams > 0 ? `${formatCurrency(tx.amountLKR / tx.amountGrams)}/g` : 'N/A'; totalDisplay = formatCurrency(tx.amountLKR); break;
            case 'redemption': goldAmountDisplay = `- ${tx.amountGrams?.toFixed(3)} g`; goldClass = 'negative'; feeDisplay = tx.feeLKR ? `- ${formatCurrency(tx.feeLKR)}` : '—'; totalDisplay = `${tx.amountGrams?.toFixed(3)} g`; break;
            case 'bonus': cashAmountDisplay = tx.amountLKR ? `+ ${formatCurrency(tx.amountLKR)}` : '—'; if(cashAmountDisplay !== '—') cashClass = 'positive'; goldAmountDisplay = tx.amountGrams ? `+ ${tx.amountGrams?.toFixed(3)} g` : '—'; if(goldAmountDisplay !== '—') goldClass = 'positive'; totalDisplay = cashAmountDisplay !== '—' ? cashAmountDisplay : goldAmountDisplay; break;
            case 'fee': cashAmountDisplay = tx.amountLKR ? `- ${formatCurrency(tx.amountLKR)}` : '—'; if(cashAmountDisplay !== '—') cashClass = 'negative'; feeDisplay = formatCurrency(tx.amountLKR); totalDisplay = formatCurrency(tx.amountLKR); break;
            default: cashAmountDisplay = tx.amountLKR ? formatCurrency(tx.amountLKR) : '—'; goldAmountDisplay = tx.amountGrams ? `${tx.amountGrams.toFixed(3)} g` : '—'; totalDisplay = cashAmountDisplay !== '—' ? cashAmountDisplay : goldAmountDisplay; break;
        }

        return (
             <tr key={tx._id || index}>
                <td data-label="Date">{formatDate(tx.date)}</td>
                <td data-label="Type" className="capitalize">{tx.type?.replace('_', ' ') || 'N/A'}</td>
                <td data-label="Cash Amount" className={cashClass}>{cashAmountDisplay}</td>
                <td data-label="Gold Amount" className={goldClass}>{goldAmountDisplay}</td>
                <td data-label="Rate">{rateDisplay}</td>
                <td data-label="Discount/Fee">{feeDisplay}</td>
                <td data-label="Total">{totalDisplay}</td>
                <td data-label="Status"><span className={`status-badge ${status}`}>{status}</span></td>
            </tr>
        );
    };

    const renderRedeemRow = (tx, index) => {
        const itemDesc = tx.itemDescription || `${tx.amountGrams?.toFixed(3)}g Item`;
        const quantity = tx.quantity || 1;
        const totalGold = tx.amountGrams?.toFixed(3) || 'N/A';
        const fees = tx.feeLKR ? formatCurrency(tx.feeLKR) : 'Rs. 0.00';
        let status = tx.status?.toLowerCase() || 'pending';
        const tracking = tx.trackingNumber || '—';

        // Optional: Auto-update status based on date (prefer backend status if reliable)
        // const today = new Date(); today.setHours(0, 0, 0, 0);
        // const deliveryDate = tx.estimatedDeliveryDate ? new Date(tx.estimatedDeliveryDate) : null;
        // if (deliveryDate && deliveryDate <= today && ['pending', 'processing', 'shipped'].includes(status)) {
        //     status = 'delivered';
        // }

        return (
             <tr key={tx._id || index}>
                <td data-label="Date">{formatDate(tx.date)}</td>
                <td data-label="Item">{itemDesc}</td>
                <td data-label="Quantity">{quantity}</td>
                <td data-label="Total Gold">{totalGold} g</td>
                <td data-label="Fees">{fees}</td>
                <td data-label="Status"><span className={`status-badge ${status}`}>{status}</span></td>
                <td data-label="Tracking Number">{tracking !== '—' ? <a href="#" className="tracking-link">{tracking}</a> : tracking}</td>
                 <td data-label="Details"><Link href={`/redeem-details/${tx._id}`} className="btn btn-secondary btn-small">View Details</Link></td>
            </tr>
        );
     };

    // --- Main Render ---
    return (
        <>
            <NavbarInternal />

            {/* Add background color class here */}
            <section className="wallet bg-[#f5f5f5]">
                {/* Wallet Balance and Gold Owned */}
                <div className="card wallet-balance">
                    <h3>Wallet Overview</h3>
                    {loading ? (
                        <WalletOverviewSkeleton />
                    ) : error && !userData ? (
                        <p className="error-message">{error}</p>
                    ) : userData ? (
                        <div className="wallet-balance-content">
                            <div className="balance-left">
                                <div className="balance-header">
                                    <div className="icon-circle"><i className="fas fa-wallet balance-icon"></i></div>
                                    <p>Cash Balance</p>
                                </div>
                                <h2>{formatCurrency(cashBalanceLKR)}</h2>
                                <p className="recent-activity">{lastDeposit ? `Last Deposit: ${formatCurrency(lastDeposit.amountLKR)} on ${formatDate(lastDeposit.date).split(',')[0]}` : 'No recent deposits'}</p>
                                <div className="balance-buttons">
                                     <Link href="/deposit" className="btn btn-primary"><i className="fas fa-arrow-up"></i> Deposit</Link>
                                     <Link href="/withdraw" className="btn btn-secondary"><i className="fas fa-arrow-down"></i> Withdraw</Link>
                                </div>
                            </div>
                            <div className="divider"></div>
                            <div className="balance-right">
                                <div className="balance-header">
                                     <div className="icon-circle"><Image src="/gold-icon.png" alt="Gold Icon" width={32} height={32} className="gold-icon"/></div>
                                    <p>Gold Owned</p>
                                </div>
                                <h2>{goldBalanceGrams.toFixed(3)} g</h2>
                                 <p className="highlight" title={marketData ? `Based on market price ${formatCurrency(currentPricePerGram)}/g` : 'Market price unavailable'}>
                                    ≈ {marketData ? formatCurrency(goldValueLKR) : 'N/A'}
                                     {marketData && (
                                         <span className={`trend ${priceTrendDirection === 'up' ? 'positive' : priceTrendDirection === 'down' ? 'negative' : ''}`}>
                                            {priceTrendDirection === 'up' ? '▲' : priceTrendDirection === 'down' ? '▼' : ''} {priceTrendPercent.toFixed(1)}% today
                                         </span>
                                     )}
                                 </p>
                                <p className="recent-activity">{lastPurchase ? `Last Purchase: ${lastPurchase.amountGrams?.toFixed(3)} g on ${formatDate(lastPurchase.date).split(',')[0]}` : 'No recent purchases'}</p>
                                <Link href="/trade" className="btn btn-primary"><i className="fas fa-sync-alt"></i> Trade Gold</Link>
                            </div>
                        </div>
                    ) : null }
                     {/* Display non-critical fetch errors if user data loaded */}
                    {error && userData && !error.toLowerCase().includes("user data") && (
                        <p className="warning-message">{error}</p>
                    )}
                </div>

                {/* Transaction History */}
                <div className="card">
                     <h3>Transaction History</h3>
                    <div className="transaction-history">
                        <div className="table-controls">
                             <div className="form-group">
                                <label htmlFor="type-filter">Filter by Type:</label>
                                <select id="type-filter" value={transactionFilter} onChange={(e) => { setTransactionFilter(e.target.value); setCurrentTransactionPage(1); }}>
                                      <option value="all">All</option> <option value="deposit">Deposit</option> <option value="investment">Buy Gold</option> <option value="sell_gold">Sell Gold</option> <option value="withdrawal">Withdrawal</option> <option value="redemption">Redemption</option> <option value="bonus">Bonus</option> <option value="fee">Fee</option>
                                 </select>
                             </div>
                             <div className="form-group">
                                <label htmlFor="transaction-search">Search:</label>
                                <input type="text" id="transaction-search" placeholder="Search..." value={transactionSearch} onChange={(e) => { setTransactionSearch(e.target.value); setCurrentTransactionPage(1); }}/>
                             </div>
                        </div>
                         <table id="transaction-history-table">
                             <thead><tr><th>Date</th><th>Type</th><th>Cash Amount</th><th>Gold Amount</th><th>Rate</th><th>Discount/Fee</th><th>Total</th><th>Status</th></tr></thead>
                             <tbody>
                                {loading ? (
                                    [...Array(TRANSACTIONS_PER_PAGE)].map((_, i) => <TransactionRowSkeleton key={i} cols={8} />)
                                ) : error && !userData?.transactions ? (
                                    <tr><td colSpan="8" className="error-message text-center">Error loading transactions.</td></tr>
                                ) : paginatedTransactions.length > 0 ? (
                                    paginatedTransactions.map(renderTransactionRow)
                                ) : (
                                    <tr><td colSpan="8" className="empty-message text-center">No transactions match your filters.</td></tr>
                                )}
                             </tbody>
                        </table>
                         {!loading && totalTransactionPages > 1 && (
                             <div className="pagination">
                                <span>Page {currentTransactionPage} of {totalTransactionPages}</span>
                                 <div className="pagination-arrows">
                                      <button className="btn btn-secondary btn-small" onClick={() => setCurrentTransactionPage(p => Math.max(1, p - 1))} disabled={currentTransactionPage === 1}>«</button>
                                      <button className="btn btn-secondary btn-small" onClick={() => setCurrentTransactionPage(p => Math.min(totalTransactionPages, p + 1))} disabled={currentTransactionPage === totalTransactionPages}>»</button>
                                 </div>
                             </div>
                         )}
                         <Link href="/transaction-history" className="btn btn-secondary see-more">See All Transactions <i className="fas fa-arrow-right"></i></Link>
                    </div>
                 </div>

                {/* Redeem Gold Coin */}
                <div className="card" id="redeem">
                    <h3>Redeem Gold Coin</h3>
                    <div className="redeem-coin-section">
                         <h4>Quick Redemption</h4>
                         {loading ? (
                             <RedeemProgressSkeleton />
                         ) : error && !userData ? (
                              <p className="error-message text-center">Error loading balance for redemption.</p>
                         ) : userData ? (
                             <div className="quick-redeem">
                                 {/* 10g */}
                                 <div className="redeem-coin-item">
                                     <div className="progress-circle" style={{ background: `conic-gradient(#F8B612 ${progress10g.toFixed(1)}%, #e7e7e7 ${progress10g.toFixed(1)}%)` }} role="progressbar" aria-valuenow={progress10g.toFixed(1)}>
                                         <Image src="/gold-icon.png" alt="" width={40} height={40} className="gold-icon"/>
                                     </div>
                                     <p>Progress for 10g Coin</p> <p className="progress-text">{progress10g.toFixed(1)}%</p>
                                     <button onClick={() => router.push(`/redeem-confirmation/10g/1`)} className={`btn btn-primary ${progress10g < 100 ? 'btn-disabled' : ''}`} disabled={progress10g < 100}>Redeem 10g</button>
                                 </div>
                                  {/* 5g */}
                                  <div className="redeem-coin-item">
                                      <div className="progress-circle" style={{ background: `conic-gradient(#F8B612 ${progress5g.toFixed(1)}%, #e7e7e7 ${progress5g.toFixed(1)}%)` }} role="progressbar" aria-valuenow={progress5g.toFixed(1)}>
                                          <Image src="/gold-icon.png" alt="" width={40} height={40} className="gold-icon"/>
                                     </div>
                                     <p>Progress for 5g Coin</p> <p className="progress-text">{progress5g.toFixed(1)}%</p>
                                      <button onClick={() => router.push(`/redeem-confirmation/5g/1`)} className={`btn btn-primary ${progress5g < 100 ? 'btn-disabled' : ''}`} disabled={progress5g < 100}>Redeem 5g</button>
                                 </div>
                                  {/* 1g */}
                                  <div className="redeem-coin-item">
                                      <div className="progress-circle" style={{ background: `conic-gradient(#F8B612 ${progress1g.toFixed(1)}%, #e7e7e7 ${progress1g.toFixed(1)}%)` }} role="progressbar" aria-valuenow={progress1g.toFixed(1)}>
                                          <Image src="/gold-icon.png" alt="" width={40} height={40} className="gold-icon"/>
                                     </div>
                                     <p>Progress for 1g Coin</p> <p className="progress-text">{progress1g.toFixed(1)}%</p>
                                     <button onClick={() => router.push(`/redeem-confirmation/1g/1`)} className={`btn btn-primary ${progress1g < 100 ? 'btn-disabled' : ''}`} disabled={progress1g < 100}>Redeem 1g</button>
                                 </div>
                             </div>
                         ) : null }
                         <div className="divider"></div>
                          {/* Custom Redemption */}
                          <div className="custom-redeem-toggle">
                                <button className="toggle-btn" onClick={() => setShowCustomRedeem(!showCustomRedeem)} aria-expanded={showCustomRedeem}> Custom Redemption <i className={`fas fa-chevron-${showCustomRedeem ? 'up' : 'down'}`}></i> </button>
                                {showCustomRedeem && (
                                    <div className="custom-redeem-form" style={{ display: 'block' }}>
                                         {loading ? ( <p className='text-center p-4'>Loading balance...</p> ) : userData ? (
                                             <>
                                                 <div className="redeem-form">
                                                     <div className="form-group">
                                                         <label htmlFor="redeem-size">Select Size (grams):</label>
                                                         <select id="redeem-size" value={customRedeemSize} onChange={(e) => setCustomRedeemSize(e.target.value)}>
                                                             <option value="0.5">0.5g</option> <option value="1">1g</option> <option value="2">2g</option> <option value="5">5g</option> <option value="8">8g (Sovereign)</option> <option value="10">10g</option> {/* Add more */}
                                                          </select>
                                                     </div>
                                                     <div className="form-group">
                                                         <label htmlFor="redeem-quantity">Quantity:</label>
                                                         <input type="number" id="redeem-quantity" min="1" step="1" value={customRedeemQuantity} onChange={(e) => setCustomRedeemQuantity(Math.max(1, parseInt(e.target.value) || 1))}/>
                                                     </div>
                                                 </div>
                                                 <div className="redeem-summary">
                                                      <p>Total Gold Required: <span id="total-gold">{customRedeemTotalGrams.toFixed(3)}g</span></p>
                                                      <p>Available Gold: <span id="available-gold">{goldBalanceGrams.toFixed(3)}g</span>{' '}
                                                         <span id="balance-status" className={customRedeemTotalGrams > 0 ? (hasSufficientGoldForCustom ? 'positive' : 'negative') : ''}>
                                                            {customRedeemTotalGrams > 0 ? (hasSufficientGoldForCustom ? '(Sufficient)' : '(Insufficient)') : ''}
                                                         </span>
                                                     </p>
                                                      <p className="info-text">Note: Fees & shipping calculated at next step.</p>
                                                 </div>
                                                 <div className="redeem-action">
                                                      <button type="button" onClick={() => router.push(`/redeem-confirmation/${customRedeemSize}g/${customRedeemQuantity}`)} className={`btn btn-primary ${!hasSufficientGoldForCustom || customRedeemTotalGrams <= 0 ? 'btn-disabled' : ''}`} disabled={!hasSufficientGoldForCustom || customRedeemTotalGrams <= 0}>Proceed to Redeem</button>
                                                 </div>
                                             </>
                                         ) : <p className="error-message text-center">Could not load balance.</p> }
                                     </div>
                                )}
                          </div>
                     </div>
                 </div>

                 {/* Redeem History */}
                 <div className="card">
                     <h3>Redeem History</h3>
                     <div className="redeem-history">
                          <div className="table-controls">
                             <div className="form-group">
                                 <label htmlFor="status-filter">Filter by Status:</label>
                                 <select id="status-filter" value={redeemFilter} onChange={(e) => { setRedeemFilter(e.target.value); setCurrentRedeemPage(1); }}>
                                      <option value="all">All</option> <option value="pending">Pending</option> <option value="processing">Processing</option> <option value="shipped">Shipped</option> <option value="delivered">Delivered</option> <option value="cancelled">Cancelled</option> <option value="failed">Failed</option>
                                 </select>
                             </div>
                         </div>
                          <table id="redeem-history-table">
                             <thead><tr><th>Date</th><th>Item</th><th>Quantity</th><th>Total Gold</th><th>Fees</th><th>Status</th><th>Tracking</th><th>Details</th></tr></thead>
                             <tbody>
                                {loading ? (
                                     [...Array(REDEEMS_PER_PAGE)].map((_, i) => <TransactionRowSkeleton key={i} cols={8} />)
                                ) : error && !userData?.transactions ? (
                                     <tr><td colSpan="8" className="error-message text-center">Error loading redemption history.</td></tr>
                                ) : paginatedRedeems.length > 0 ? (
                                     paginatedRedeems.map(renderRedeemRow)
                                ) : (
                                     <tr><td colSpan="8" className="empty-message text-center">No redemption history found {redeemFilter !== 'all' ? 'for this status' : ''}.</td></tr>
                                )}
                             </tbody>
                        </table>
                         {!loading && totalRedeemPages > 1 && (
                             <div className="pagination">
                                <span>Page {currentRedeemPage} of {totalRedeemPages}</span>
                                 <div className="pagination-arrows">
                                     <button className="btn btn-secondary btn-small" onClick={() => setCurrentRedeemPage(p => Math.max(1, p - 1))} disabled={currentRedeemPage === 1}>«</button>
                                     <button className="btn btn-secondary btn-small" onClick={() => setCurrentRedeemPage(p => Math.min(totalRedeemPages, p + 1))} disabled={currentRedeemPage === totalRedeemPages}>»</button>
                                 </div>
                             </div>
                         )}
                         <Link href="/redeem-history" className="btn btn-secondary see-more">See All Redemptions <i className="fas fa-arrow-right"></i></Link>
                     </div>
                 </div>


                 {/* Gamifications & Rewards - Revised Structure */}
                 <div className="card" id="gamification">
                     <h3>Gamifications & Rewards</h3>
                     {loading ? (
                         <GamificationSkeleton />
                     ) : error && (!userData?.gamificationDefs) ? (
                         <p className="error-message p-4">Error loading gamification details.</p>
                     ) : userData && activeChallenges ? ( // Check data is ready
                         <div className="gamification-rewards">

                             {/* Challenges Section */}
                             <div className="challenges-list"> {/* Wrapper for challenges */}
                                {activeChallenges.length > 0 ? activeChallenges.map(challenge => {
                                     const currentProgress = challengeProgressMap[challenge.id] || 0;
                                     const goal = challenge.goal || 1; // Avoid division by zero, assume goal is at least 1 if not specified
                                     const progressPercent = Math.min(100, (currentProgress / goal) * 100);
                                     const isCompleted = currentProgress >= goal;
                                     const isClaimed = challengeProgressMap[`${challenge.id}_claimed`] === true;
                                     const canClaim = isCompleted && challenge.rewardType === 'claimable' && !isClaimed;
                                     const needed = Math.max(0, goal - currentProgress);

                                      // Determine progress text based on completion and unit
                                     let progressText = 'Not yet started';
                                     if (isCompleted) {
                                        progressText = 'Completed!';
                                     } else if (currentProgress > 0) {
                                        if (challenge.unit === 'LKR') {
                                            progressText = `${formatCurrency(needed)} more`;
                                        } else if (challenge.unit === 'g') {
                                            progressText = `${formatGrams(needed)} more`;
                                        } else {
                                             progressText = `${needed.toFixed(0)} ${challenge.unit || ''} more`; // Default unit handling
                                        }
                                     }


                                     // Determine icon based on status and challenge type
                                     let iconClass = challenge.icon || 'fas fa-tasks'; // Default task icon
                                     if (isCompleted) {
                                        iconClass = 'fas fa-check-circle'; // Checkmark for completed
                                     } else if (challenge.type?.includes('REFER')) {
                                         iconClass = 'fas fa-users'; // People icon for referrals
                                     } else if (challenge.type?.includes('INVEST') || challenge.type?.includes('TRADE')) {
                                         iconClass = 'fas fa-trophy'; // Trophy for trading/investing
                                     }
                                     // Add color class based on completion
                                     const iconColorClass = isCompleted ? 'icon-completed' : 'icon-inprogress'; // Define these in CSS

                                     return (
                                         // Use progress-item structure - assumes flex display
                                         <div key={challenge.id} className={`progress-item ${isCompleted ? 'completed' : ''}`}>
                                             {/* Icon */}
                                             <div className={`challenge-icon ${iconColorClass}`}>
                                                <i className={iconClass}></i>
                                             </div>

                                             {/* Details (Text + Progress Bar) */}
                                             <div className="progress-details">
                                                 <p className="challenge-name">{challenge.name} <span className="star-earn">Earn {challenge.starsAwarded || 0} ★</span></p>
                                                 {challenge.rewardText && <p className="reward-text">Reward: {challenge.rewardText}</p>}
                                                 <div className="progress-bar-container"> {/* Optional container for bar + text below */}
                                                     <div className="progress-bar">
                                                         <div className="progress" style={{ width: `${progressPercent}%`, backgroundColor: isCompleted ? '#28a745' : '#ffc107' }}></div> {/* Green for completed, Yellow for progress */}
                                                     </div>
                                                     <p className="progress-status">{progressText}</p>
                                                 </div>
                                             </div>

                                             {/* CTA Button Area */}
                                             <div className="progress-cta">
                                                 {canClaim ? (
                                                     <button
                                                         // onClick={() => handleClaimReward(challenge.id)} // TODO: Implement claim logic
                                                         className="btn btn-primary cta-btn btn-claim" // Specific class for claim button styling
                                                     >Claim Reward</button>
                                                 ) : isClaimed ? (
                                                    <span className="badge claimed-badge">Claimed</span>
                                                 ) : isCompleted ? (
                                                     // Show nothing or a subtle completed indicator if not claimable
                                                     <span className="badge completed-badge">Done</span>
                                                 ) : (
                                                    // Link to relevant action - use btn-secondary style from image
                                                    <Link href={challenge.ctaLink || "/trade"} className="btn btn-secondary cta-btn btn-action">
                                                         {challenge.ctaText || 'Start Now'}
                                                     </Link>
                                                 )}
                                             </div>
                                         </div>
                                     );
                                 }) : <p className="empty-message">No active challenges right now.</p>}
                             </div>

                             {/* Divider if needed between challenges and stars/badges */}
                             <div className="divider my-4"></div> {/* Added margin utility classes */}

                              {/* Stars & Badges Section */}
                             <div className="stars-badges-section"> {/* Combined or separate as needed */}
                                  {/* Stars */}
                                 <div className="stars-section">
                                     <h4>Your Stars
                                         {/* Info Button */}
                                         <button className="info-btn" onClick={() => setShowStarsInfo(!showStarsInfo)} aria-label="Learn more about stars" aria-expanded={showStarsInfo}>
                                             <i className="fas fa-info-circle"></i>
                                         </button>
                                     </h4>
                                     <div className="stars-display">
                                         {[...Array(maxStars)].map((_, index) => (
                                             <i key={index} className={`fas fa-star ${index < starCount ? 'star-filled' : 'star-empty'}`}></i>
                                         ))}
                                     </div>
                                     {/* Dynamic text based on star count */}
                                     <p>{starCount} out of {maxStars} stars earned - Complete more goals to earn stars!</p>

                                      {/* Stars Info Modal/Popup - shown conditionally */}
                                      {showStarsInfo && (
                                          <div className="stars-info-modal"> {/* Style this modal */}
                                              <p>Earn stars by completing challenges. Collect {maxStars} stars for a special reward!</p>
                                              <button className="btn btn-secondary btn-small" onClick={() => setShowStarsInfo(false)}>Close</button>
                                          </div>
                                      )}
                                 </div>

                                 {/* Uncomment and style if Badges are displayed here */}
                                 {/* <div className="divider my-4"></div>
                                 <div className="badges-section">
                                     <h4>Your Badges</h4>
                                     <div className="badges-display">
                                         {allBadges.length > 0 ? allBadges.map(badge => {
                                             const earned = earnedBadgeIds.includes(badge.id);
                                             return (
                                                 <div key={badge.id} className={`badge-item ${earned ? 'earned' : 'not-earned'}`} title={`${badge.name}: ${badge.description}${earned ? ' (Earned!)' : ''}`}>
                                                     <i className={`${badge.icon || 'fas fa-certificate'} badge-icon`}></i>
                                                     <p className="badge-name">{badge.name}</p>
                                                 </div>
                                             );
                                         }) : <p className="empty-message">No badges earned yet.</p>}
                                     </div>
                                 </div> */}
                            </div>
                         </div>
                     ) : null }
                 </div>

            </section>

            <FooterInternal />
        </>
    );
}