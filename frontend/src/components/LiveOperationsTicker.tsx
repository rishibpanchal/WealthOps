import React, { useState, useEffect } from 'react';

export const LiveOperationsTicker: React.FC = () => {
  const [eventIndex, setEventIndex] = useState(0);

  const events = [
    { time: '15:42:08', text: 'Portfolio C1024 analyzed', status: 'COMPLETE' },
    { time: '15:42:11', text: 'Policy exception detected (+7.2% equity drift)', status: 'WARNING' },
    { time: '15:42:14', text: 'Rebalance recommendation formulated ($205,200)', status: 'PENDING' },
    { time: '15:42:17', text: 'Dual-approval request #8F91 queued', status: 'ROUTED' },
    { time: '15:43:02', text: 'Chief Risk Officer notified for sign-off', status: 'DISPATCHED' },
    { time: '15:43:40', text: 'Morning 8:00 AM Cron exception sweep ready', status: 'STANDBY' },
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
      <span style={{ color: 'var(--text-muted)' }}>{current.time}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{current.text}</span>
    </div>
  );
};
