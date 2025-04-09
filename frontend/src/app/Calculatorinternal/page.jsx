'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbarinternal';
import Footer from '@/components/Footerinternal';
import Link from 'next/link';

export default function CalculatorPage() {
  const [frequency, setFrequency] = useState('monthly');
  const [investmentAmount, setInvestmentAmount] = useState(5000);
  const [investmentPeriod, setInvestmentPeriod] = useState(5);
  const [returnRate, setReturnRate] = useState(12);

  const [totalInvested, setTotalInvested] = useState(0);
  const [estimatedReturns, setEstimatedReturns] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [chartValue, setChartValue] = useState('Rs. 0');
  const [investedPercent, setInvestedPercent] = useState(0);

  const donutChartRef = useRef(null);

  const currencyFormatter = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0
  });

  const currencyFormatterNoSymbol = new Intl.NumberFormat('en-LK', {
    maximumFractionDigits: 0
  });

  const formatLargeValue = (value) => {
    if (value >= 10000000) {
      return `Rs. ${(value / 10000000).toFixed(2)} Cr`;
    } else if (value >= 100000) {
      return `Rs. ${(value / 100000).toFixed(2)} L`;
    } else {
      return currencyFormatter.format(value);
    }
  };

  useEffect(() => {
    const P = Number(investmentAmount) || 0;
    const t = Number(investmentPeriod) || 0;
    const annualRatePercent = Number(returnRate) || 0;

    if (P <= 0 || t <= 0 || annualRatePercent <= 0) {
      setTotalInvested(0);
      setEstimatedReturns(0);
      setTotalValue(0);
      setChartValue('Rs. 0');
      setInvestedPercent(0);
      return;
    }

    let n = 0;
    let i = 0;
    let currentTotalInvested = 0;
    const annualRateDecimal = annualRatePercent / 100;

    if (frequency === 'monthly') {
      n = t * 12;
      i = annualRateDecimal / 12;
      currentTotalInvested = P * n;
    } else {
      n = t;
      i = annualRateDecimal;
      currentTotalInvested = P * n;
    }

    let futureValue = 0;
    if (i === 0) {
      futureValue = P * n;
    } else {
      futureValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    }

    const currentEstimatedReturns = futureValue - currentTotalInvested;

    setTotalInvested(currentTotalInvested);
    setEstimatedReturns(Math.max(0, currentEstimatedReturns));
    setTotalValue(futureValue);
    setChartValue(formatLargeValue(futureValue));

    let currentInvestedPercent = 0;
    if (futureValue > 0) {
      currentInvestedPercent = Math.max(0, Math.min(100, (currentTotalInvested / futureValue) * 100));
    }

    // Clamp for minimal visibility
    const MIN_VISIBLE_PERCENT = 0.5;
    if (currentInvestedPercent > 0 && currentInvestedPercent < MIN_VISIBLE_PERCENT)
      currentInvestedPercent = MIN_VISIBLE_PERCENT;
    if (currentInvestedPercent < 100 && currentInvestedPercent > (100 - MIN_VISIBLE_PERCENT))
      currentInvestedPercent = 100 - MIN_VISIBLE_PERCENT;

    setInvestedPercent(currentInvestedPercent);
  }, [frequency, investmentAmount, investmentPeriod, returnRate]);

  // ✅ Dynamically update donut chart
  useEffect(() => {
    if (donutChartRef.current) {
      const invested = investedPercent.toFixed(2);
      donutChartRef.current.style.background = `conic-gradient(
        #f0e0b0 ${invested}%,
        #F8B612 ${invested}%
      )`;
    }
  }, [investedPercent]);

  const handleAmountChange = (e) => setInvestmentAmount(e.target.value);
  const handlePeriodChange = (e) => setInvestmentPeriod(e.target.value);
  const handleRateChange = (e) => setReturnRate(e.target.value);
  const handleFrequencyChange = (e) => setFrequency(e.target.value);

  return (
    <>
      <Navbar activePage="calculator" />

      <section className="calculator-page-section">
        <div className="calculator-container">
          <h2>Gold returns Calculator</h2>

          <div className="calculator-grid">
            {/* Input Column */}
            <div className="calculator-inputs">
              <div className="input-group">
                <label htmlFor="investment-frequency">Investment Frequency</label>
                <select id="investment-frequency" className="input-dropdown" value={frequency} onChange={handleFrequencyChange}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="input-group slider-group">
                <label htmlFor="investment-amount-slider">I want to invest ({frequency === 'monthly' ? 'Monthly' : 'Yearly'})</label>
                <div className="slider-wrapper">
                  <span className="input-prefix">Rs</span>
                  <input type="range" id="investment-amount-slider" min="100" max="500000" step="100" value={investmentAmount} onChange={handleAmountChange} />
                  <input type="number" id="investment-amount-value" className="input-value" min="100" max="500000" step="100" value={investmentAmount} onChange={handleAmountChange} />
                </div>
              </div>

              <div className="input-group slider-group">
                <label htmlFor="investment-period">I want to stay invested for</label>
                <div className="slider-wrapper">
                  <input type="range" id="investment-period" min="1" max="30" step="1" value={investmentPeriod} onChange={handlePeriodChange}/>
                  <input type="number" id="investment-period-value" className="input-value years" min="1" max="30" step="1" value={investmentPeriod} onChange={handlePeriodChange} />
                  <span className="input-suffix">years</span>
                </div>
              </div>

              <div className="input-group slider-group">
                <label htmlFor="return-rate">I expect an annual return of</label>
                <div className="slider-wrapper">
                  <input type="range" id="return-rate" min="1" max="25" step="0.5" value={returnRate} onChange={handleRateChange}/>
                  <input type="number" id="return-rate-value" className="input-value percent" min="1" max="25" step="0.5" value={returnRate} onChange={handleRateChange} />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>

            {/* Output Column */}
            <div className="calculator-outputs">
              <div className="chart-container">
                <div ref={donutChartRef} className="donut-chart">
                  <span className="chart-value">{chartValue}</span>
                </div>
              </div>

              <div className="chart-legend">
                <ul>
                  <li><span className="legend-dot invested" style={{ backgroundColor: '#f0e0b0' }}></span> Invested amount</li>
                  <li><span className="legend-dot returns" style={{ backgroundColor: '#F8B612' }}></span> Estimated Returns</li>
                </ul>
              </div>

              <div className="output-details">
                <div className="output-row">
                  <span>Invested amount</span>
                  <span className="output-value">Rs <span id="invested-amount">{currencyFormatterNoSymbol.format(totalInvested)}</span></span>
                </div>
                <div className="output-row">
                  <span>Estimated returns</span>
                  <span className="output-value">Rs <span id="estimated-returns">{currencyFormatterNoSymbol.format(estimatedReturns)}</span></span>
                </div>
                <hr className="output-divider" />
                <div className="output-row total">
                  <span>Total Value</span>
                  <span className="output-value total-value">Rs <span id="total-value">{currencyFormatterNoSymbol.format(totalValue)}</span></span>
                </div>
              </div>

              <Link href="/invest" className="cta-btn invest-now-btn">Invest now</Link>
            </div>
          </div>

          <p className="calculator-description">
            A Systematic Investment Plan (SIP) Calculator for Gold Returns helps estimate the future value of your gold investments based on periodic investments. Since gold prices fluctuate, the return rate varies.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
