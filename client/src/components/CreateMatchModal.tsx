import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Plus } from 'lucide-react';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchCreated: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  onMatchCreated,
}) => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [sport, setSport] = useState('Football');
  const [status, setStatus] = useState<'live' | 'scheduled' | 'finished'>('live');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await api.createMatch({
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        sport: sport.trim(),
        startTime: new Date().toISOString(),
        status,
        homeScore: 0,
        awayScore: 0,
      });

      onMatchCreated();
      onClose();
      setHomeTeam('');
      setAwayTeam('');
    } catch (err) {
      console.error('Failed to create match:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create New Match</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Sport</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="form-select"
            >
              <option value="Football">Football</option>
              <option value="Cricket">Cricket</option>
              <option value="Basketball">Basketball</option>
              <option value="Tennis">Tennis</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Home Team</label>
              <input
                type="text"
                placeholder="e.g. Manchester City"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Away Team</label>
              <input
                type="text"
                placeholder="e.g. Liverpool"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                required
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <div className="radio-pill-group">
              {(['live', 'scheduled', 'finished'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`status-pill-btn ${status === s ? 'active' : ''}`}
                  onClick={() => setStatus(s)}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !homeTeam || !awayTeam}
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Creating...' : 'Create Match'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
