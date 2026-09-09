import React, { useState, useEffect } from 'react';
import { UserRole, PolicyDoc } from '../types';
import { api } from '../api';

interface InstitutionalPoliciesProps {
  currentRole: UserRole;
}

export const InstitutionalPolicies: React.FC<InstitutionalPoliciesProps> = ({ currentRole }) => {
  const [policies, setPolicies] = useState<PolicyDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PolicyDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState('rebalancing drift dual approval limits SOP');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPolicies = async () => {
      setIsLoading(true);
      try {
        const docs = await api.getPolicies(currentRole);
        setPolicies(docs);
        if (docs.length > 0) setSelectedDoc(docs[0]);
      } catch (err) {
        console.error('Failed to load policies', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicies();
  }, [currentRole]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.searchPolicies(searchQuery, currentRole);
      setSearchResults(res.results || []);
    } catch (err) {
      console.error('Policy search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 0 80px 0' }}>
      {/* Title & Masthead */}
      <section style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '20px', marginBottom: '32px' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: '6px',
        }}>
          Governance & Operating Framework
        </div>
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '2.2rem',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
        }}>
          Institutional Policy Repository & RAG Engine
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
          Documented investment limits, rebalancing standard operating procedures, and dual-approval matrices.
        </p>

        {/* Semantic Vector Search Bar */}
        <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policy knowledge base via cosine vector similarity..."
            style={{
              flex: 1,
              maxWidth: '560px',
              padding: '10px 14px',
              fontSize: '0.85rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-muted)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="btn-institutional btn-institutional-primary"
            style={{ padding: '8px 20px', fontSize: '0.82rem' }}
          >
            {isSearching ? 'Querying Vector Index...' : 'Semantic Search'}
          </button>
        </div>

        {/* Vector Search Results */}
        {searchResults.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-hairline)',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
              Vector Search Results (Ranked by Cosine Similarity):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {searchResults.map((r, idx) => (
                <div key={idx} style={{ padding: '10px 14px', background: 'var(--bg-surface-subdued)', borderRadius: '3px', border: '1px solid var(--border-hairline)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      {r.title} — {r.section_title}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-bronze)', fontWeight: 600 }}>
                      Similarity: {r.similarity_score}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {r.content_snippet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Main Two-Column Document Browser */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px' }}>
        {/* Left: Document Navigation */}
        <div style={{
          border: '1px solid var(--border-hairline)',
          borderRadius: '4px',
          background: 'var(--bg-surface)',
          overflow: 'hidden',
          height: 'fit-content',
        }}>
          <div style={{
            padding: '12px 16px',
            fontSize: '0.72rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border-hairline)',
            background: 'var(--bg-canvas)',
          }}>
            Institutional Documents ({policies.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {policies.map((doc) => {
              const isSelected = selectedDoc?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-hairline)',
                    background: isSelected ? 'var(--bg-hover)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--accent-bronze)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="status-pill status-pill-neutral" style={{ fontSize: '0.62rem' }}>
                      {doc.category}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {doc.version}
                    </span>
                  </div>
                  <div style={{ fontWeight: isSelected ? 600 : 500, fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {doc.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Document Content View */}
        <div style={{
          border: '1px solid var(--border-hairline)',
          borderRadius: '4px',
          background: 'var(--bg-surface)',
          padding: '32px 40px',
        }}>
          {selectedDoc ? (
            <div>
              <div style={{ borderBottom: '1px solid var(--border-hairline)', paddingBottom: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span className="status-pill status-pill-neutral">{selectedDoc.category}</span>
                  <span className="status-pill status-pill-neutral">{selectedDoc.version}</span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 400, color: 'var(--text-primary)' }}>
                  {selectedDoc.title}
                </h2>
                {selectedDoc.summary && (
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                    {selectedDoc.summary}
                  </p>
                )}
              </div>

              <div style={{
                fontSize: '0.9rem',
                lineHeight: 1.75,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
              }}>
                {selectedDoc.content}
              </div>
            </div>
          ) : (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a policy document to view specifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
