import { useState, useEffect, useCallback } from 'react';
import './App.css';
import type { Match, CommentaryItem } from './types';
import { api } from './services/api';
import { useSportsSocket } from './hooks/useSportsSocket';
import { Header } from './components/Header';
import { MatchCard } from './components/MatchCard';
import { LiveCommentaryPanel } from './components/LiveCommentaryPanel';
import { CreateMatchModal } from './components/CreateMatchModal';
import { Plus, Zap } from 'lucide-react';

export function App() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [commentary, setCommentary] = useState<CommentaryItem[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(true);
  const [isLoadingCommentary, setIsLoadingCommentary] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load matches from REST API
  const loadMatches = useCallback(async () => {
    try {
      setIsLoadingMatches(true);
      const data = await api.getMatches(filterStatus);
      setMatches(data);

      // Keep selected match in sync if already selected
      if (selectedMatch) {
        const found = data.find((m) => m.id === selectedMatch.id);
        if (found) setSelectedMatch(found);
      }
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setIsLoadingMatches(false);
    }
  }, [filterStatus, selectedMatch?.id]);

  useEffect(() => {
    loadMatches();
  }, [filterStatus]);

  // Load commentary when a match is selected
  const handleSelectMatch = async (match: Match) => {
    setSelectedMatch(match);
    try {
      setIsLoadingCommentary(true);
      const items = await api.getMatchCommentary(match.id);
      setCommentary(items);
    } catch (err) {
      console.error('Failed to load match commentary:', err);
      setCommentary([]);
    } finally {
      setIsLoadingCommentary(false);
    }
  };

  // Real-time WebSocket event listeners
  const handleScoreUpdated = useCallback((updatedMatch: Match) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m))
    );

    setSelectedMatch((prev) => (prev && prev.id === updatedMatch.id ? { ...prev, ...updatedMatch } : prev));
  }, []);

  const handleCommentaryAdded = useCallback((newCommentary: CommentaryItem) => {
    setSelectedMatch((prevSelected) => {
      if (prevSelected && prevSelected.id === newCommentary.matchId) {
        setCommentary((prevList) => {
          // Avoid duplicate entries if already present
          if (prevList.some((item) => item.id === newCommentary.id)) return prevList;
          return [...prevList, { ...newCommentary, isNew: true }];
        });
      }
      return prevSelected;
    });
  }, []);

  const handleMatchCreated = useCallback((newMatch: Match) => {
    setMatches((prev) => {
      if (prev.some((m) => m.id === newMatch.id)) {
        return prev.map((m) => (m.id === newMatch.id ? newMatch : m));
      }
      return [newMatch, ...prev];
    });
  }, []);

  const { status, reconnect } = useSportsSocket({
    selectedMatchId: selectedMatch?.id,
    onScoreUpdated: handleScoreUpdated,
    onCommentaryAdded: handleCommentaryAdded,
    onMatchCreated: handleMatchCreated,
  });

  // Seed demo data handler
  const handleSeedDemo = async () => {
    try {
      setIsSeeding(true);
      await api.seedDemo();
      await loadMatches();
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Banner Header */}
      <Header
        status={status}
        onReconnect={reconnect}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
      />

      {/* Main Grid: Matches on Left, Live Commentary on Right */}
      <main className="dashboard-grid">
        {/* Left Section: Current Matches */}
        <section className="matches-section">
          <div className="section-header">
            <div className="section-title-wrap">
              <span className="accent-bar" />
              <h2 className="section-title">Current Matches</h2>
            </div>

            <div className="section-actions">
              <span className="api-count-badge" title="Total matches loaded from API">
                API: {matches.length}
              </span>

              <button
                type="button"
                className="create-match-btn"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={14} />
                <span>New Match</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="filter-bar">
            {['all', 'live', 'scheduled', 'finished'].map((filter) => (
              <button
                key={filter}
                type="button"
                className={`filter-pill ${filterStatus === filter ? 'active' : ''}`}
                onClick={() => setFilterStatus(filter)}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Matches Grid */}
          {isLoadingMatches && matches.length === 0 ? (
            <div className="empty-matches-box">
              <p>Loading real-time sports feed...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="empty-matches-box">
              <h3>No Matches Found</h3>
              <p>The database is currently empty. Click below to seed the 4 demo matches from the video!</p>
              <button
                type="button"
                className="seed-cta-btn"
                onClick={handleSeedDemo}
                disabled={isSeeding}
              >
                <Zap size={16} />
                <span>{isSeeding ? 'Seeding...' : 'Seed 4 Demo Matches'}</span>
              </button>
            </div>
          ) : (
            <div className="matches-cards-grid">
              {matches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  isSelected={selectedMatch?.id === m.id}
                  onSelect={handleSelectMatch}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right Section: Commentary & Live Stream details */}
        <LiveCommentaryPanel
          match={selectedMatch}
          commentary={commentary}
          isLoadingCommentary={isLoadingCommentary}
          onClose={() => setSelectedMatch(null)}
        />
      </main>

      {/* Modal to create new match */}
      <CreateMatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onMatchCreated={loadMatches}
      />
    </div>
  );
}

export default App;
