import React, { useState } from 'react';
import type { Match, CommentaryItem } from '../types';
import { Video, Send, Radio, Trophy } from 'lucide-react';
import { api } from '../services/api';

interface LiveCommentaryPanelProps {
  match: Match | null;
  commentary: CommentaryItem[];
  isLoadingCommentary: boolean;
  onClose: () => void;
}

export const LiveCommentaryPanel: React.FC<LiveCommentaryPanelProps> = ({
  match,
  commentary,
  isLoadingCommentary,
  onClose,
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [customActor, setCustomActor] = useState('');
  const [customMinute, setCustomMinute] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);

  // If no match selected, show the exact empty state from the screenshot!
  if (!match) {
    return (
      <aside className="commentary-panel empty">
        <div className="empty-state-content">
          <div className="video-icon-circle">
            <Video size={36} strokeWidth={2.2} />
          </div>
          <h2 className="empty-title">No Match Selected</h2>
          <p className="empty-subtitle">
            Select a match from the list to view live commentary and real-time updates.
          </p>
        </div>
      </aside>
    );
  }

  // Quick score increment handler (triggers PATCH -> triggers WebSocket broadcast)
  const handleScoreChange = async (team: 'home' | 'away') => {
    try {
      setIsUpdatingScore(true);
      const newHomeScore = team === 'home' ? match.homeScore + 1 : match.homeScore;
      const newAwayScore = team === 'away' ? match.awayScore + 1 : match.awayScore;
      await api.updateMatch(match.id, {
        homeScore: newHomeScore,
        awayScore: newAwayScore,
      });
    } catch (err) {
      console.error('Failed to update score:', err);
    } finally {
      setIsUpdatingScore(false);
    }
  };

  // Quick commentary sender
  const handleSendCommentary = async (
    messageText: string,
    actorName: string,
    minuteNum?: number,
    eventType: string = 'generic'
  ) => {
    if (!messageText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await api.addCommentary(match.id, {
        actor: actorName.trim() || undefined,
        message: messageText.trim(),
        minute: minuteNum !== undefined ? minuteNum : Math.floor(Math.random() * 85) + 1,
        details: { eventType },
      });
      setCustomMessage('');
      setCustomActor('');
      setCustomMinute('');
    } catch (err) {
      console.error('Failed to add commentary:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="commentary-panel active">
      {/* Active Match Banner Header */}
      <div className="active-match-header">
        <div className="match-meta-top">
          <span className="sport-pill">({match.sport ? match.sport.toUpperCase() : 'FOOTBALL'})</span>
          <div className="live-pill">
            <Radio size={14} className="animate-pulse-dot" />
            <span>LIVE STREAM</span>
          </div>
          <button type="button" className="close-panel-btn" onClick={onClose} title="Deselect match">
            ✕
          </button>
        </div>

        {/* Big Score Board */}
        <div className="scoreboard-hero">
          <div className="hero-team home">
            <span className="hero-team-name">{match.homeTeam}</span>
            <div className="hero-score-box">{match.homeScore}</div>
            <button
              type="button"
              className="quick-score-btn"
              onClick={() => handleScoreChange('home')}
              disabled={isUpdatingScore}
              title="Add 1 to home score via WebSocket broadcast"
            >
              +1 Goal
            </button>
          </div>

          <div className="hero-divider">VS</div>

          <div className="hero-team away">
            <span className="hero-team-name">{match.awayTeam}</span>
            <div className="hero-score-box">{match.awayScore}</div>
            <button
              type="button"
              className="quick-score-btn"
              onClick={() => handleScoreChange('away')}
              disabled={isUpdatingScore}
              title="Add 1 to away score via WebSocket broadcast"
            >
              +1 Goal
            </button>
          </div>
        </div>
      </div>

      {/* Quick Interactive Triggers for Live Testing */}
      <div className="interactive-triggers-bar">
        <span className="triggers-label">Live Event Triggers:</span>
        <div className="triggers-buttons">
          <button
            type="button"
            className="trigger-pill"
            onClick={() =>
              handleSendCommentary(
                `GOAAAL! Sensational finish into the top corner!`,
                match.homeTeam.split(' ')[0],
                undefined,
                'goal'
              )
            }
          >
            ⚽ Goal
          </button>
          <button
            type="button"
            className="trigger-pill"
            onClick={() =>
              handleSendCommentary(
                `Yellow card issued for an aggressive tactical foul.`,
                'Referee',
                undefined,
                'card'
              )
            }
          >
            🟨 Card
          </button>
          <button
            type="button"
            className="trigger-pill"
            onClick={() =>
              handleSendCommentary(
                `Unbelievable diving save! Keeps the ball out of the net.`,
                'Goalkeeper',
                undefined,
                'save'
              )
            }
          >
            🧤 Save
          </button>
        </div>
      </div>

      {/* Commentary Feed Header */}
      <div className="commentary-feed-header">
        <div className="feed-title-wrap">
          <Trophy size={16} />
          <h3>Live Commentary</h3>
        </div>
        <span className="feed-counter">{commentary.length} events</span>
      </div>

      {/* Commentary Timeline List */}
      <div className="commentary-list">
        {isLoadingCommentary && commentary.length === 0 ? (
          <div className="loading-feed">Loading live stream commentary...</div>
        ) : commentary.length === 0 ? (
          <div className="empty-feed">
            No commentary events recorded yet. Click one of the quick trigger buttons above or write one below!
          </div>
        ) : (
          commentary.map((item) => (
            <div
              key={item.id || item.sequenceNo}
              className={`commentary-item ${item.isNew ? 'animate-highlight' : ''}`}
            >
              <div className="item-meta">
                {item.minute !== null && item.minute !== undefined && (
                  <span className="minute-badge">{item.minute}&apos;</span>
                )}
                {item.actor && <span className="actor-badge">{item.actor}</span>}
                <span className="seq-badge">#{item.sequenceNo}</span>
              </div>
              <p className="item-message">{item.message}</p>
            </div>
          ))
        )}
      </div>

      {/* Custom Commentary Composer */}
      <form
        className="commentary-composer"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendCommentary(
            customMessage,
            customActor,
            customMinute ? Number(customMinute) : undefined,
            'custom'
          );
        }}
      >
        <div className="composer-inputs">
          <input
            type="text"
            placeholder="Actor (e.g. Referee, Player)"
            value={customActor}
            onChange={(e) => setCustomActor(e.target.value)}
            className="actor-input"
          />
          <input
            type="number"
            placeholder="Min"
            value={customMinute}
            onChange={(e) => setCustomMinute(e.target.value)}
            className="min-input"
            min={0}
            max={180}
          />
        </div>
        <div className="composer-action">
          <input
            type="text"
            placeholder="Type live narration..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="message-input"
            required
          />
          <button
            type="submit"
            disabled={!customMessage.trim() || isSubmitting}
            className="send-commentary-btn"
            title="Post live event (broadcasts immediately via WebSocket)"
          >
            <Send size={15} />
          </button>
        </div>
      </form>
    </aside>
  );
};
