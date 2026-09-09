import React from 'react';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  FileText, 
  Activity, 
  Cpu, 
  Users, 
  Lock, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { UserRole } from '../types';
import { USER_PROFILES } from '../api';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingApprovalsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  pendingApprovalsCount,
}) => {
  const profile = USER_PROFILES[currentRole];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(8, 12, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 1.5rem',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
          }}>
            <Shield size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                WealthOps
              </span>
              <span style={{
                background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}>
                AGENT
              </span>
              <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                v1.0 ENTERPRISE
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Wealth Management Operations Automation Platform
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { id: 'console', label: 'Operations Console', icon: Cpu },
            { id: 'approvals', label: 'Approval Queue', icon: CheckCircle, badge: pendingApprovalsCount },
            { id: 'portfolios', label: 'Client Universe', icon: Users },
            { id: 'policies', label: 'Policy Knowledge Base', icon: FileText },
            { id: 'automation', label: 'Automation & Process', icon: Layers },
            { id: 'audit', label: 'Audit & Observability', icon: Activity },
            { id: 'eval', label: 'AI Governance', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#60a5fa' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    background: '#f43f5e',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    borderRadius: '999px',
                    padding: '1px 6px',
                    marginLeft: '2px',
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* RBAC Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
              {profile.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <span className={`badge ${
                currentRole === 'RISK_OFFICER' ? 'badge-amber' : 
                currentRole === 'ADMIN' ? 'badge-purple' : 
                currentRole === 'OPERATIONS_ANALYST' ? 'badge-blue' :
                currentRole === 'ADVISOR' ? 'badge-emerald' : 'badge-rose'
              }`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                {currentRole.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              style={{
                appearance: 'none',
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 32px 8px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="OPERATIONS_ANALYST">Operations Analyst (Rishi Sharma)</option>
              <option value="RISK_OFFICER">Risk Officer (Elena Rostova)</option>
              <option value="ADVISOR">Senior Advisor (Marcus Vance)</option>
              <option value="ADMIN">Platform Admin (Sarah Jenkins)</option>
              <option value="VIEWER">Read-Only Viewer (Alex Morgan)</option>
            </select>
            <ChevronDown size={14} color="#94a3b8" style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      </div>
    </header>
  );
};
