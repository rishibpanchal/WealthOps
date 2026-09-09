import React, { useState, useEffect } from 'react';

interface PlatformInitializationProps {
  onComplete: () => void;
}

export const PlatformInitialization: React.FC<PlatformInitializationProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Portfolio universe ........ READY',
    'Policy index .............. READY',
    'Risk engine ............... READY',
    'Agent runtime ............. READY',
    'Audit ledger .............. READY',
    'OPERATIONS ONLINE',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return prev;
        }
      });
    }, 220);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#FBFBFA',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ maxWidth: '460px', width: '100%' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderBottom: '1px solid #E4E1D9',
          paddingBottom: '12px',
          marginBottom: '20px',
        }}>
          <span style={{
            fontFamily: 'Newsreader, serif',
            fontSize: '1.4rem',
            color: '#121316',
            fontWeight: 400,
          }}>
            WEALTHOPS
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            color: '#8A867E',
          }}>
            09.09.26 · INITIALIZING
          </span>
        </div>

        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.8rem',
          lineHeight: '1.8',
          color: '#58554F',
          minHeight: '180px',
        }}>
          <div style={{ color: '#121316', fontWeight: 600, marginBottom: '6px' }}>
            CONNECTING TO OPERATIONS PIPELINE...
          </div>
          {steps.slice(0, stepIndex + 1).map((step, idx) => {
            const isLast = idx === steps.length - 1 && stepIndex === steps.length - 1;
            return (
              <div
                key={idx}
                style={{
                  color: isLast ? '#2B573D' : '#121316',
                  fontWeight: isLast ? 700 : 400,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{step.split('...')[0]}</span>
                <span style={{ color: isLast ? '#2B573D' : '#9E6B47', fontWeight: 600 }}>
                  {step.includes('READY') ? 'READY' : isLast ? '● ONLINE' : ''}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{
          height: '2px',
          background: '#E4E1D9',
          borderRadius: '1px',
          overflow: 'hidden',
          marginTop: '20px',
        }}>
          <div style={{
            height: '100%',
            background: '#9E6B47',
            width: `${((stepIndex + 1) / steps.length) * 100}%`,
            transition: 'width 0.2s ease',
          }} />
        </div>
      </div>
    </div>
  );
};
