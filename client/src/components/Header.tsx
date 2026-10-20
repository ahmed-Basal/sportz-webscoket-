import React from 'react';
import type { ConnectionStatus } from '../types';
import { X, RefreshCw, Zap } from 'lucide-react';

interface HeaderProps {
  status: ConnectionStatus;
  onReconnect: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  onReconnect,
  onSeedDemo,
  isSeeding,
}) => {
  return (
    <header className="spotrz-header">
      <div className="header-left">
        <div className="brand-wrap">
          <h1 className="brand-title">Spotrz</h1>
        </div>
        <p className="brand-subtitle">Real-time match data demo</p>
      </div>

      <div className="header-right">
        <button
          type="button"
          onClick={onSeedDemo}
          disabled={isSeeding}
          className="seed-btn"
          title="Seed realistic match demo data from video"
        >
          <Zap size={15} />
          <span>{isSeeding ? 'Seeding...' : 'Seed Demo Data'}</span>
        </button>

        <div
          className={`connection-badge ${status}`}
          onClick={status === 'disconnected' ? onReconnect : undefined}
          title={status === 'disconnected' ? 'Click to reconnect' : 'WebSocket status'}
        >
          <span className={`status-dot ${status}`} />
          <span className="status-label">
            {status === 'connected' && 'LIVE CONNECTED'}
            {status === 'connecting' && 'CONNECTING...'}
            {status === 'disconnected' && 'DISCONNECTED'}
          </span>
          {status === 'disconnected' && <RefreshCw size={12} className="spin" />}
        </div>

        <button
          type="button"
          className="header-icon-btn"
          title="Clear / Close"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <X size={18} />
        </button>
      </div>
    </header>
  );
};
