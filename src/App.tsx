import React, { useState, useEffect } from 'react';
import { INITIAL_LEVELS } from './levels';
import { Level } from './types';
import MainMenu from './components/MainMenu';
import GameCanvas from './components/GameCanvas';
import LevelEditor from './components/LevelEditor';
import { Sparkles, Calendar, Clock, RotateCcw } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'menu' | 'playing' | 'editor'>('menu');
  const [levels, setLevels] = useState<Level[]>(INITIAL_LEVELS);
  const [activeLevelIdx, setActiveLevelIdx] = useState<number>(0);
  const [bestTimes, setBestTimes] = useState<{ [id: number]: number }>({});
  const [customLevel, setCustomLevel] = useState<Level | null>(null);

  // Load progression history on mount
  useEffect(() => {
    try {
      const saved: { [id: number]: number } = {};
      INITIAL_LEVELS.forEach(lvl => {
        const score = localStorage.getItem(`time_stitch_best_time_${lvl.id}`);
        if (score) {
          saved[lvl.id] = parseFloat(score);
        }
      });
      setBestTimes(saved);
    } catch (e) {
      console.warn('LocalStorage access blocked:', e);
    }
  }, []);

  // Set selected level and launch
  const handleSelectLevel = (idx: number) => {
    setActiveLevelIdx(idx);
    setCurrentView('playing');
  };

  const handleLaunchEditor = () => {
    setCurrentView('editor');
  };

  // Trigger when current level completes
  const handleStageCleared = (timeElapsed: number) => {
    const currentLvl = levels[activeLevelIdx];
    
    // Save record if it is better
    const prevBest = bestTimes[currentLvl.id];
    if (!prevBest || timeElapsed < prevBest) {
      try {
        localStorage.setItem(`time_stitch_best_time_${currentLvl.id}`, timeElapsed.toString());
        setBestTimes(prev => ({
          ...prev,
          [currentLvl.id]: timeElapsed
        }));
      } catch (err) {
        console.warn('Unable to persist time score:', err);
      }
    }

    // Advance level automatically if not the last stage or custom stage
    if (currentLvl.id === 999) {
      // Custom stage completed, return to editor
      setTimeout(() => {
        setCurrentView('editor');
      }, 1500);
    } else if (activeLevelIdx < INITIAL_LEVELS.length - 1) {
      setTimeout(() => {
        setActiveLevelIdx(prev => prev + 1);
      }, 1500);
    } else {
      // Whole campaign completed
      setTimeout(() => {
        setCurrentView('menu');
      }, 1500);
    }
  };

  const handleSaveAndPlayCustomLevel = (createdLevel: Level) => {
    setCustomLevel(createdLevel);
    
    // Supplement levels array
    const updatedLevels = [...INITIAL_LEVELS];
    const customIndex = updatedLevels.length;
    updatedLevels.push(createdLevel);
    setLevels(updatedLevels);

    setActiveLevelIdx(customIndex);
    setCurrentView('playing');
  };

  const handleResetProgress = () => {
    try {
      INITIAL_LEVELS.forEach(lvl => {
        localStorage.removeItem(`time_stitch_best_time_${lvl.id}`);
      });
      setBestTimes({});
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      
      {/* Decorative Top header */}
      <header className="border-b border-slate-900 bg-slate-950/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 active:scale-98 transition"
            onClick={() => setCurrentView('menu')}
            id="heading-logo-nav"
          >
            <div className="bg-gradient-to-tr from-teal-400 to-emerald-500 rounded-lg p-1.5 shadow-lg shadow-teal-500/10">
              <Sparkles className="w-4 h-4 text-slate-950 font-bold" />
            </div>
            <span className="font-black text-sm tracking-[0.2em] font-mono text-white">
              TIME STITCH
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5 text-teal-500" />
              <span>UTC: 2026-06-10</span>
            </div>
            <span className="text-teal-400 font-semibold text-[10px] bg-teal-950/40 border border-teal-900/60 rounded-full px-2.5 py-0.5">
              PROTOTYPE v1.1
            </span>
          </div>
        </div>
      </header>

      {/* Main Dynamic Workspace Frame */}
      <main className="flex-grow flex items-center justify-center p-3 md:p-8">
        {currentView === 'menu' && (
          <MainMenu
            levels={INITIAL_LEVELS}
            onSelectLevel={handleSelectLevel}
            onOpenEditor={handleLaunchEditor}
            bestTimes={bestTimes}
            onResetProgress={handleResetProgress}
          />
        )}

        {currentView === 'playing' && (
          <GameCanvas
            currentLevel={levels[activeLevelIdx]}
            onStageCleared={handleStageCleared}
            onExitToMenu={() => {
              if (levels[activeLevelIdx].id === 999) {
                setCurrentView('editor');
              } else {
                setCurrentView('menu');
              }
            }}
            isCustomLevel={levels[activeLevelIdx].id === 999}
          />
        )}

        {currentView === 'editor' && (
          <LevelEditor
            onSaveAndPlay={handleSaveAndPlayCustomLevel}
            onClose={() => setCurrentView('menu')}
          />
        )}
      </main>

      {/* Humble Minimal Footer (Anti-AI-Slop strict constraint) */}
      <footer className="border-t border-slate-900 py-6 bg-slate-950 text-center text-xs text-slate-600 font-mono tracking-wider">
        <div className="max-w-7xl mx-auto px-6">
          <p>© 2026 TIME STITCH. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
