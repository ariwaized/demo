import React, { useState } from 'react';
import type { Stock } from '../types';

interface TradingChartProps {
  stock: Stock;
}

export const TradingChart: React.FC<TradingChartProps> = ({ stock }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const data = stock.history;

  if (data.length === 0) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>אין מספיק נתונים להצגת גרף</div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Padding for chart edges
  const paddingY = range * 0.05;
  const chartMin = min - paddingY;
  const chartMax = max + paddingY;
  const chartRange = chartMax - chartMin;

  const width = 600;
  const height = 300;

  // Map data index to X coordinate, and price to Y coordinate
  const points = data.map((price, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((price - chartMin) / chartRange) * height;
    return { x, y, price };
  });

  const pathD = points.reduce((path, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
  }, '');

  // Closed path for the gradient area under the line
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  // Color theme based on trend
  const isUp = stock.price >= stock.previousPrice;
  const strokeColor = isUp ? 'var(--trend-up)' : 'var(--trend-down)';
  const gradientId = `chart-gradient-${stock.symbol}`;
  const stopColor = isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';

  return (
    <div className="glass-panel gravity-card float-element" style={{ padding: '24px', position: 'relative' }} id={`chart-card-${stock.symbol}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>שם מניה</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {stock.name} 
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({stock.symbol})</span>
          </h2>
        </div>
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>מחיר נוכחי</span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: strokeColor }}>
            ${stock.price.toFixed(2)}
          </h2>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stopColor} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Area fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Line stroke */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Hover indicator line and circle */}
          {hoverIndex !== null && points[hoverIndex] && (
            <>
              <line 
                x1={points[hoverIndex].x} 
                y1="0" 
                x2={points[hoverIndex].x} 
                y2={height} 
                stroke="rgba(255,255,255,0.15)" 
                strokeDasharray="4 4" 
              />
              <circle 
                cx={points[hoverIndex].x} 
                cy={points[hoverIndex].y} 
                r="6" 
                fill={strokeColor} 
                stroke="#fff" 
                strokeWidth="2" 
              />
            </>
          )}

          {/* Overlay rectangles to detect hover index */}
          {points.map((p, idx) => {
            const step = width / (data.length - 1);
            return (
              <rect
                key={idx}
                x={p.x - step / 2}
                y="0"
                width={step}
                height={height}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            );
          })}
        </svg>

        {hoverIndex !== null && points[hoverIndex] && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--glass-border)',
            padding: '6px 12px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.85rem',
            pointerEvents: 'none',
            display: 'flex',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>מחיר גרף:</span>
            <span style={{ fontWeight: '700', color: strokeColor }}>${points[hoverIndex].price.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div>שער נמוך: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>${stock.low.toFixed(2)}</span></div>
        <div style={{ textAlign: 'left' }}>שער גבוה: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>${stock.high.toFixed(2)}</span></div>
      </div>
    </div>
  );
};
