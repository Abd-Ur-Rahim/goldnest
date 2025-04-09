'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import Navbar from '@/components/NavbarInternal';
import Footer from '@/components/FooterInternal';

Chart.register(...registerables);

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState('goldPriceChartContent');
  const goldCanvasRef = useRef(null);
  const inflationCanvasRef = useRef(null);
  const goldChartRef = useRef(null);
  const inflationChartRef = useRef(null);
  const simulationInterval = useRef(null);

  useEffect(() => {
    // Setup chart logic here
  }, []);

  return (
    <>
      <Navbar activePage="market" />
      <main className="static-page-padding">
        <section className="market-section content-container">
          <h2>Market Overview</h2>

          <div className="chart-tabs">
            <button
              className={`tab-button ${activeTab === 'goldPriceChartContent' ? 'active' : ''}`}
              onClick={() => setActiveTab('goldPriceChartContent')}
            >
              Gold Price (Simulated)
            </button>
            <button
              className={`tab-button ${activeTab === 'inflationChartContent' ? 'active' : ''}`}
              onClick={() => setActiveTab('inflationChartContent')}
            >
              Inflation vs Gold (Simulated)
            </button>
          </div>

          <div className="chart-display-area">
            <div
              style={{ display: activeTab === 'goldPriceChartContent' ? 'block' : 'none' }}
              className="chart-content"
            >
              <div className="chart-container">
                <canvas ref={goldCanvasRef} id="goldPriceCanvas"></canvas>
              </div>
            </div>

            <div
              style={{ display: activeTab === 'inflationChartContent' ? 'block' : 'none' }}
              className="chart-content"
            >
              <div className="chart-container">
                <canvas ref={inflationCanvasRef} id="inflationCanvas"></canvas>
              </div>
            </div>
          </div>

          <p className="chart-disclaimer">
            Note: Charts display SIMULATED data for demonstration purposes and do not reflect real-time market values. Past performance is not indicative of future results.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
