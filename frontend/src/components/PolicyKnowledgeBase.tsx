import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Database, 
  Sparkles, 
  BookOpen, 
  Shield, 
  CheckCircle2, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { UserRole, PolicyDoc } from '../types';
import { api } from '../api';

interface PolicyKnowledgeBaseProps {
  currentRole: UserRole;
}

export const PolicyKnowledgeBase: React.FC<PolicyKnowledgeBaseProps> = ({ currentRole }) => {
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
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
          <Database size={22} color="var(--accent-cyan)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Policy Knowledge Base & RAG Vector Engine
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Institutional standards governing client asset allocation boundaries, rebalancing SOPs, risk limits, and segregation of duties. Grounded by semantic vector search for agent retrieval.
        </p>

        {/* Semantic Search Tester */}
        <div style={{ marginTop: '1.2rem', display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask a policy question or search vector index..."
              className="input-field"
              style={{ paddingLeft: '38px' }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="btn btn-primary"
            style={{ padding: '0 20px' }}
          >
            <Sparkles size={16} /> Semantic Search
          </button>
        </div>

        {/* Search Results Display */}
        {searchResults.length > 0 && (
          <div style={{
            marginTop: '1.2rem',
            padding: '1rem',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60a5fa', marginBottom: '8px' }}>
              Vector Retrieval Matches (Cosine Similarity):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map((m, idx) => (
                <div key={idx} style={{ padding: '8px 12px', borderRadius: '6px', background: '#0a0f1d', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#f8fafc' }}>
                      {m.title} — {m.section_title}
                    </span>
                    <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
                      Sim: {m.similarity_score}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {m.content_snippet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Document Explorer */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Document List */}
        <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
            Institutional Catalog ({policies.length})
          </h3>
          {policies.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  border: isSelected ? '1px solid #3b82f6' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{doc.category}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.version}</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? '#60a5fa' : '#f8fafc', lineHeight: '1.3' }}>
                  {doc.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Document Content View */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {selectedDoc ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-purple">{selectedDoc.category}</span>
                    <span className="badge badge-blue">{selectedDoc.version}</span>
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc' }}>
                    {selectedDoc.title}
                  </h2>
                </div>
              </div>

              {selectedDoc.summary && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  fontSize: '0.85rem',
                  color: '#93c5fd',
                  marginBottom: '1.5rem',
                  lineHeight: '1.5',
                }}>
                  <strong>Executive Summary:</strong> {selectedDoc.summary}
                </div>
              )}

              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '1.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                lineHeight: '1.7',
                color: '#e2e8f0',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
              }}>
                {selectedDoc.content}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 0' }}>
              Select a policy document to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
