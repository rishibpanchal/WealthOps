import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  FileText,
  Copy,
  Check,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface Props {
  content: string;
  className?: string;
}

export const InstitutionalMarkdown: React.FC<Props> = ({ content, className }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!content) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to parse inline bolding, inline code, and status markers
  const renderInline = (text: string): React.ReactNode => {
    // Split by inline code first: `code`
    const codeParts = text.split(/(`[^`]+`)/g);

    return codeParts.map((codePart, i) => {
      if (codePart.startsWith('`') && codePart.endsWith('`')) {
        const val = codePart.slice(1, -1);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
        return (
          <span
            key={i}
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: isUuid ? '0.78rem' : '0.82rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: '#F0EFEA',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-hairline)',
              letterSpacing: isUuid ? '0.02em' : 'normal',
            }}
          >
            {val}
          </span>
        );
      }

      // Split by bold: **bold**
      const boldParts = codePart.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((boldPart, j) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
          const boldText = boldPart.slice(2, -2);
          return (
            <strong key={`${i}-${j}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {boldText}
            </strong>
          );
        }

        // Status or breach tags in plain text
        if (boldPart.includes('⚠️ POLICY BREACH')) {
          const segs = boldPart.split('⚠️ POLICY BREACH');
          return (
            <React.Fragment key={`${i}-${j}`}>
              {segs[0]}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: '#FDF2E9',
                  color: '#B45309',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid #FCD34D',
                }}
              >
                <AlertTriangle size={12} />
                POLICY BREACH
              </span>
              {segs[1]}
            </React.Fragment>
          );
        }

        if (boldPart.includes('✅ COMPLIANT')) {
          const segs = boldPart.split('✅ COMPLIANT');
          return (
            <React.Fragment key={`${i}-${j}`}>
              {segs[0]}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  background: '#EAF2ED',
                  color: '#2B573D',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid #C4D9CC',
                }}
              >
                <CheckCircle2 size={12} />
                COMPLIANT
              </span>
              {segs[1]}
            </React.Fragment>
          );
        }

        return <span key={`${i}-${j}`}>{boldPart}</span>;
      });
    });
  };

  // Pre-process sections
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentKeyValues: { key: string; value: string }[] = [];
  let currentAdjustments: { asset: string; action: string; amount: string; detail: string }[] = [];
  let currentBreaches: string[] = [];
  let currentListItems: string[] = [];

  const flushKeyValues = (keyPrefix: string) => {
    if (currentKeyValues.length === 0) return;
    const items = [...currentKeyValues];
    currentKeyValues = [];

    blocks.push(
      <div
        key={`kv-group-${keyPrefix}`}
        style={{
          display: 'grid',
          gridTemplateColumns: items.length > 2 ? 'repeat(auto-fit, minmax(180px, 1fr))' : `repeat(${items.length}, 1fr)`,
          gap: '12px',
          margin: '16px 0',
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              background: 'var(--bg-surface-subdued, #F5F4F0)',
              border: '1px solid var(--border-hairline, #E4E1D9)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-secondary, #58554F)',
                fontWeight: 600,
              }}
            >
              {item.key}
            </span>
            <span
              style={{
                fontFamily: item.value.includes('$') || /[\d.%]/.test(item.value) ? 'var(--font-mono, monospace)' : 'inherit',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: 'var(--text-primary, #121316)',
              }}
            >
              {renderInline(item.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const flushAdjustments = (keyPrefix: string) => {
    if (currentAdjustments.length === 0) return;
    const items = [...currentAdjustments];
    currentAdjustments = [];

    blocks.push(
      <div
        key={`adj-group-${keyPrefix}`}
        style={{
          margin: '14px 0 20px 0',
          borderRadius: '6px',
          border: '1px solid var(--border-hairline, #E4E1D9)',
          overflow: 'hidden',
          background: 'var(--bg-surface, #FFFFFF)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1.2fr 1.2fr 1.6fr',
            padding: '8px 16px',
            background: 'var(--bg-surface-subdued, #F5F4F0)',
            borderBottom: '1px solid var(--border-hairline, #E4E1D9)',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
            color: 'var(--text-secondary, #58554F)',
          }}
        >
          <span>Asset Class</span>
          <span>Action</span>
          <span style={{ textAlign: 'right' }}>Est. Volume</span>
          <span style={{ textAlign: 'right' }}>Shift Mandate</span>
        </div>

        {items.map((adj, idx) => {
          const isSell = adj.action.includes('SELL') || adj.action.includes('TRIM');
          const isBuy = adj.action.includes('BUY') || adj.action.includes('ADD');

          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1.2fr 1.2fr 1.6fr',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: idx < items.length - 1 ? '1px solid var(--border-hairline, #E4E1D9)' : 'none',
                fontSize: '0.86rem',
                background: idx % 2 === 1 ? 'rgba(0,0,0,0.01)' : '#FFFFFF',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {adj.asset}
              </div>

              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                    background: isSell ? '#FEF2F2' : isBuy ? '#EAF2ED' : '#F5F4F0',
                    color: isSell ? '#991B1B' : isBuy ? '#2B573D' : 'var(--text-primary)',
                    border: `1px solid ${isSell ? '#FECACA' : isBuy ? '#C4D9CC' : 'var(--border-hairline)'}`,
                  }}
                >
                  {isSell ? <TrendingDown size={12} /> : isBuy ? <TrendingUp size={12} /> : null}
                  {adj.action.replace('_', ' ')}
                </span>
              </div>

              <div
                style={{
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: isSell ? '#991B1B' : isBuy ? '#2B573D' : 'var(--text-primary)',
                }}
              >
                {adj.amount}
              </div>

              <div
                style={{
                  textAlign: 'right',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {adj.detail}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const flushListItems = (keyPrefix: string) => {
    if (currentListItems.length === 0) return;
    const items = [...currentListItems];
    currentListItems = [];

    blocks.push(
      <ul
        key={`list-${keyPrefix}`}
        style={{
          margin: '10px 0 16px 0',
          paddingLeft: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {items.map((li, idx) => (
          <li key={idx} style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
            {renderInline(li)}
          </li>
        ))}
      </ul>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushKeyValues(`line-${i}`);
      flushAdjustments(`line-${i}`);
      flushListItems(`line-${i}`);
      continue;
    }

    // Heading 3: ### ...
    if (line.startsWith('### ')) {
      flushKeyValues(`line-${i}`);
      flushAdjustments(`line-${i}`);
      flushListItems(`line-${i}`);

      const title = line.replace('### ', '');
      blocks.push(
        <div
          key={`h3-${i}`}
          style={{
            margin: i === 0 ? '0 0 14px 0' : '22px 0 14px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--border-hairline, #E4E1D9)',
          }}
        >
          <FileText size={18} style={{ color: 'var(--accent-bronze, #9E6B47)' }} />
          <h3
            style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: '1.2rem',
              fontWeight: 500,
              color: 'var(--text-primary, #121316)',
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>
      );
      continue;
    }

    // Heading 4: #### ...
    if (line.startsWith('#### ')) {
      flushKeyValues(`line-${i}`);
      flushAdjustments(`line-${i}`);
      flushListItems(`line-${i}`);

      const subtitle = line.replace('#### ', '');
      blocks.push(
        <div
          key={`h4-${i}`}
          style={{
            margin: '18px 0 8px 0',
            fontSize: '0.74rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
            color: 'var(--text-secondary, #58554F)',
          }}
        >
          {subtitle}
        </div>
      );
      continue;
    }

    // Horizontal Rule: ---
    if (line === '---') {
      flushKeyValues(`line-${i}`);
      flushAdjustments(`line-${i}`);
      flushListItems(`line-${i}`);

      blocks.push(
        <hr
          key={`hr-${i}`}
          style={{
            border: 'none',
            borderTop: '1px solid var(--border-hairline, #E4E1D9)',
            margin: '20px 0',
          }}
        />
      );
      continue;
    }

    // Key-Value Line: **Label**: Value
    const kvMatch = line.match(/^\*\*([^*:]+)\*\*:\s*(.+)$/);
    if (kvMatch) {
      currentKeyValues.push({ key: kvMatch[1].trim(), value: kvMatch[2].trim() });
      continue;
    }

    // Bullet with Adjustment Pattern:
    // - **Asset**: ACTION ~$Amount (details)
    const adjMatch = line.match(/^-\s+\*\*([^*]+)\*\*:\s*([A-Z_]+)\s+([~$\d,.]+)\s*\(([^)]+)\)/i);
    if (adjMatch) {
      currentAdjustments.push({
        asset: adjMatch[1].trim(),
        action: adjMatch[2].trim(),
        amount: adjMatch[3].trim(),
        detail: adjMatch[4].trim(),
      });
      continue;
    }

    // Governance or Restriction Alert Banner:
    // 🛡️ **Governance Control Triggered...** or 🚫 **Action Restricted...**
    if (line.includes('🛡️') || line.includes('Governance Control Triggered') || line.includes('🚫') || line.includes('Action Restricted')) {
      flushKeyValues(`line-${i}`);
      flushAdjustments(`line-${i}`);
      flushListItems(`line-${i}`);

      // Gather lines belonging to this callout
      let calloutContent: string[] = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '---' && !lines[j].trim().startsWith('###')) {
        if (lines[j].trim()) {
          calloutContent.push(lines[j].trim());
        }
        j++;
      }
      i = j - 1; // Advance outer pointer

      const calloutText = calloutContent.join('\n');
      const ticketMatch = calloutText.match(/Approval Ticket ID[*\s:]+`?([0-9a-fA-F-]{8,})`?/i);
      const ticketId = ticketMatch ? ticketMatch[1] : null;

      blocks.push(
        <div
          key={`governance-callout-${i}`}
          style={{
            margin: '18px 0',
            padding: '18px 20px',
            borderRadius: '6px',
            background: 'var(--semantic-amber-bg, #FDF7ED)',
            border: '1px solid #ECD9C0',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#92400E',
                marginTop: '2px',
              }}
            >
              <ShieldAlert size={18} />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#92400E',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>Fiduciary Governance Control Triggered (Dual-Approval Required)</span>
              </div>

              <div
                style={{
                  fontSize: '0.84rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary, #58554F)',
                  marginBottom: ticketId ? '14px' : '0',
                }}
              >
                {renderInline(
                  calloutContent
                    .filter((c) => !c.includes('Approval Ticket ID') && !c.includes('Governance Control Triggered'))
                    .join(' ')
                )}
              </div>

              {ticketId && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    border: '1px solid #ECD9C0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Approval Ticket ID:
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {ticketId}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: '#FEF3C7',
                        color: '#92400E',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      Pending Review
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(ticketId)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.74rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-hairline)',
                      background: 'var(--bg-canvas, #FBFBFA)',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                    title="Copy Ticket ID"
                  >
                    {copiedId === ticketId ? (
                      <>
                        <Check size={12} style={{ color: 'var(--semantic-green)' }} />
                        <span style={{ color: 'var(--semantic-green)' }}>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
      continue;
    }

    // Standard Bullet: - ...
    if (line.startsWith('- ') || line.startsWith('* ')) {
      currentListItems.push(line.slice(2));
      continue;
    }

    // Ordinary Paragraph
    flushKeyValues(`line-${i}`);
    flushAdjustments(`line-${i}`);
    flushListItems(`line-${i}`);

    blocks.push(
      <p
        key={`p-${i}`}
        style={{
          margin: '8px 0',
          fontSize: '0.88rem',
          lineHeight: 1.65,
          color: 'var(--text-primary, #121316)',
        }}
      >
        {renderInline(line)}
      </p>
    );
  }

  // Flush any trailing elements
  flushKeyValues('end');
  flushAdjustments('end');
  flushListItems('end');

  return <div className={`institutional-markdown-report ${className || ''}`}>{blocks}</div>;
};
