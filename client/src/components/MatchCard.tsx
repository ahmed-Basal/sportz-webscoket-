import React, { useEffect, useState } from 'react';
import type { Match } from '../types';

interface MatchCardProps {
  match: Match;
  isSelected: boolean;
  onSelect: (match: Match) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, isSelected, onSelect }) => {
  const [scoreChanged, setScoreChanged] = useState(false);

  // Trigger brief flash when score changes in real time
  useEffect(() => {
    setScoreChanged(true);
    const timer = setTimeout(() => setScoreChanged(false), 800);
    return () => clearTimeout(timer);
  }, [match.homeScore, match.awayScore]);

  const formatMatchTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return '03:37 PM';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '03:37 PM';
    }
  };

  const isLive = match.status === 'live';

  return (
    <div className={`match-card ${isSelected ? 'selected' : ''}`}>
      {/* Top Header: Sport Pill and Status */}
      <div className="match-card-header">
        <span className="sport-pill">
          ({match.sport ? match.sport.toUpperCase() : 'FOOTBALL'})
        </span>

        <div className={`match-status-badge ${match.status}`}>
          {isLive && <span className="live-dot" />}
          <span className="status-text">
            {match.status === 'live' ? 'Live' : match.status.charAt(0).toUpperCase() + match.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Teams and Scores */}
      <div className="match-teams-list">
        {/* Home Team */}
        <div className="team-row">
          <span className="team-name" title={match.homeTeam}>
            {match.homeTeam}
          </span>
          <div className={`score-box ${scoreChanged ? 'pop' : ''}`}>
            {match.homeScore}
          </div>
        </div>

        {/* Away Team */}
        <div className="team-row">
          <span className="team-name" title={match.awayTeam}>
            {match.awayTeam}
          </span>
          <div className={`score-box ${scoreChanged ? 'pop' : ''}`}>
            {match.awayScore}
          </div>
        </div>
      </div>

      {/* Card Footer: Time and Action Button */}
      <div className="match-card-footer">
        <span className="match-time">{formatMatchTime(match.startTime)}</span>

        <button
          type="button"
          className={`watch-live-btn ${isSelected ? 'active' : ''}`}
          onClick={() => onSelect(match)}
        >
          {isSelected ? 'Watching' : 'Watch Live'}
        </button>
      </div>
    </div>
  );
};
