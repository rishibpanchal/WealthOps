import React, { useState, useEffect } from 'react';
import { formatISTTime } from '../utils/formatters';

export const LiveOperationsTicker: React.FC = () => {
  const [eventIndex, setEventIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const clockTimer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const getRecentTime = (secondsAgo: number) => {
    return formatISTTime(now - secondsAgo * 1000);
  };

  const events = [
    { getTime: () => getRecentTime(92), text: 'Portfolio C1024 analyzed', status: 'COMPLETE' },
    { getTime: () => getRecentTime(74), text: 'Policy exception detected (+7.2% equity drift)', status: 'WARNING' },
    { getTime: () => getRecentTime(51), text: 'Rebalance recommendation formulated (₹20,52,000)', status: 'PENDING' },
    { getTime: () => getRecentTime(32), text: 'Dual-approval request #8F91 queued', status: 'ROUTED' },
    { getTime: () => getRecentTime(14), text: 'Chief Risk Officer notified for sign-off', status: 'DISPATCHED' },
    { getTime: () => getRecentTime(3), text: 'Morning 08:00 IST Cron exception sweep ready', status: 'STANDBY' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setEventIndex((prev) => (prev + 1) % events.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [events.length]);

  const current = events[eventIndex];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '0.74rem',
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-secondary)',
    }}>
      <span style={{
        display: 'inline-block',
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: current.status === 'WARNING' ? 'var(--semantic-amber)' : 'var(--accent-bronze)',
      }} />
      <span style={{ color: 'var(--text-muted)' }}>{current.getTime()}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{current.text}</span>
    </div>
  );
};
