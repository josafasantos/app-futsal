import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, Goal, AppSettings } from '../types';
import {
  getInitialState,
  insertIntoQueueWithPriority,
  startInitialMatch,
  finishCurrentMatch,
  swapPlayersBetweenTeams,
  substituteCourtPlayer,
  movePlayerToEndOfQueue
} from '../utils/domain';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'app_futsal_state_v1';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface AppContextType {
  state: AppState;
  activeTab: 'court' | 'queue' | 'presence' | 'reports' | 'rules';
  syncStatus: SyncStatus;
  setActiveTab: (tab: 'court' | 'queue' | 'presence' | 'reports' | 'rules') => void;
  // Day actions
  startDay: () => void;
  endDay: () => void;
  // Settings
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  // Player management
  registerPlayer: (name: string, nickname?: string) => void;
  editPlayer: (id: string, name: string, nickname?: string) => void;
  togglePlayerInactive: (id: string) => void;
  deletePlayer: (id: string) => void;
  // Pre-list and check-in
  togglePreparedConfirmed: (playerId: string) => void;
  checkInPlayer: (playerId: string) => void;
  removePresence: (playerId: string) => void;
  deferPlayerInQueue: (playerId: string) => void;
  // Court / Match
  startInitialGame: () => void;
  setTeamName: (team: 'A' | 'B', name: string) => void;
  addGoal: (team: 'A' | 'B', playerId?: string) => void;
  removeLastGoal: (team?: 'A' | 'B') => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  swapPlayers: (playerAId: string, playerBId: string) => void;
  substitutePlayer: (courtPlayerId: string) => void;
  confirmMatchResult: (penaltyWinner?: 'A' | 'B') => void;
  // Historical
  clearAllHistories: () => void;
  updateRules: (newRules: string) => void;
  resetToDemo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to remove any undefined fields before writing to Firestore
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentMatch) {
          if (parsed.currentMatch.teamA?.name === 'Time Colete') {
            parsed.currentMatch.teamA.name = 'Time Azul';
          }
          if (
            parsed.currentMatch.teamB?.name === 'Time Sem Colete' ||
            parsed.currentMatch.teamB?.name === 'Desafiante'
          ) {
            parsed.currentMatch.teamB.name = 'Time Vermelho';
          }
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse state from localStorage', e);
    }
    return getInitialState();
  });

  const [activeTab, setActiveTab] = useState<'court' | 'queue' | 'presence' | 'reports' | 'rules'>('court');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');

  // Keep a ref to latest state to avoid race condition when syncing
  const stateRef = useRef<AppState>(state);
  stateRef.current = state;

  // Real-time listener to Cloud Firestore
  useEffect(() => {
    try {
      const peladaDocRef = doc(db, 'peladas', 'current');
      const unsubscribe = onSnapshot(
        peladaDocRef,
        snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.data() as AppState;
            // Clean up any old team names
            if (data.currentMatch) {
              if (data.currentMatch.teamA?.name === 'Time Colete') {
                data.currentMatch.teamA.name = 'Time Azul';
              }
              if (
                data.currentMatch.teamB?.name === 'Time Sem Colete' ||
                data.currentMatch.teamB?.name === 'Desafiante'
              ) {
                data.currentMatch.teamB.name = 'Time Vermelho';
              }
            }
            setState(data);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch (err) {
              console.warn('LocalStorage save error:', err);
            }
            setSyncStatus('synced');
          } else {
            // First time initialization in Firestore
            const initialClean = sanitizeForFirestore(stateRef.current);
            setDoc(peladaDocRef, initialClean)
              .then(() => setSyncStatus('synced'))
              .catch(err => {
                console.warn('Initial Firestore write notice:', err);
                setSyncStatus('offline');
              });
          }
        },
        error => {
          console.warn('Firestore real-time connection status:', error.message);
          setSyncStatus('offline');
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore init error:', e);
      setSyncStatus('offline');
    }
  }, []);

  // Sync state mutation to localStorage and Firestore
  const updateAndSync = (updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('Failed to persist locally:', err);
      }

      // Sync to Firestore in background
      try {
        setSyncStatus('syncing');
        const cleanData = sanitizeForFirestore(next);
        setDoc(doc(db, 'peladas', 'current'), cleanData)
          .then(() => setSyncStatus('synced'))
          .catch(err => {
            console.warn('Firestore save warning:', err);
            setSyncStatus('offline');
          });
      } catch (err) {
        console.warn('Firestore sync error:', err);
        setSyncStatus('offline');
      }

      return next;
    });
  };

  // Settings
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    updateAndSync(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  // Start Day
  const startDay = () => {
    const dayId = `day-${new Date().toISOString().slice(0, 10)}-${Date.now().toString().slice(-4)}`;
    updateAndSync(prev => ({
      ...prev,
      dayActive: true,
      dayId,
      dayConfirmed: { ...prev.preparedConfirmed },
      preparedConfirmed: {},
      presentPlayers: [],
      queue: [],
      hasPlayedToday: [],
      currentMatch: null
    }));
  };

  // End Day
  const endDay = () => {
    updateAndSync(prev => {
      if (!prev.dayId) return prev;

      const dateStr = new Date().toLocaleDateString('pt-BR');
      const attendanceRecord = {
        dayId: prev.dayId,
        date: dateStr,
        confirmedPlayers: Object.values(prev.dayConfirmed).map(c => ({ id: c.id, name: c.name })),
        presentPlayers: prev.presentPlayers.map(p => ({ id: p.id, name: p.name })),
        completed: true
      };

      return {
        ...prev,
        dayActive: false,
        dayId: null,
        dayConfirmed: {},
        presentPlayers: [],
        queue: [],
        hasPlayedToday: [],
        currentMatch: null,
        attendanceHistory: [attendanceRecord, ...prev.attendanceHistory]
      };
    });
  };

  // Player registration
  const registerPlayer = (name: string, nickname?: string) => {
    const id = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPlayer = {
      id,
      name: name.trim(),
      nickname: nickname?.trim() || undefined,
      createdAt: Date.now()
    };

    updateAndSync(prev => ({
      ...prev,
      players: { ...prev.players, [id]: newPlayer }
    }));
  };

  const editPlayer = (id: string, name: string, nickname?: string) => {
    updateAndSync(prev => {
      if (!prev.players[id]) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [id]: {
            ...prev.players[id],
            name: name.trim(),
            nickname: nickname?.trim() || undefined
          }
        }
      };
    });
  };

  const togglePlayerInactive = (id: string) => {
    updateAndSync(prev => {
      const player = prev.players[id];
      if (!player) return prev;
      return {
        ...prev,
        players: {
          ...prev.players,
          [id]: { ...player, inactive: !player.inactive }
        }
      };
    });
  };

  const deletePlayer = (id: string) => {
    updateAndSync(prev => {
      const nextPlayers = { ...prev.players };
      delete nextPlayers[id];
      return {
        ...prev,
        players: nextPlayers
      };
    });
  };

  // Pre-list toggle
  const togglePreparedConfirmed = (playerId: string) => {
    updateAndSync(prev => {
      const targetMap = prev.dayActive ? prev.dayConfirmed : prev.preparedConfirmed;
      const isAlready = !!targetMap[playerId];
      const player = prev.players[playerId];
      if (!player) return prev;

      if (isAlready) {
        const updated = { ...targetMap };
        delete updated[playerId];
        return prev.dayActive
          ? { ...prev, dayConfirmed: updated }
          : { ...prev, preparedConfirmed: updated };
      } else {
        if (Object.keys(targetMap).length >= prev.settings.maxConfirmed) {
          alert(`Limite de vagas atingido (${prev.settings.maxConfirmed} pessoas).`);
          return prev;
        }
        const updated = {
          ...targetMap,
          [playerId]: { id: player.id, name: player.name, confirmedAt: Date.now() }
        };
        return prev.dayActive
          ? { ...prev, dayConfirmed: updated }
          : { ...prev, preparedConfirmed: updated };
      }
    });
  };

  // Check-in (confirm arrival)
  const checkInPlayer = (playerId: string) => {
    updateAndSync(prev => {
      const player = prev.players[playerId];
      if (!player) return prev;
      if (prev.presentPlayers.some(p => p.id === playerId)) return prev;

      const newPresent = [
        ...prev.presentPlayers,
        { id: player.id, name: player.name, arrivedAt: Date.now() }
      ];

      // If match is already running, insert into queue with priority for first-timers
      let newQueue = prev.queue;
      if (prev.currentMatch) {
        newQueue = insertIntoQueueWithPriority(prev.queue, playerId, prev.hasPlayedToday);
      }

      return {
        ...prev,
        presentPlayers: newPresent,
        queue: newQueue
      };
    });
  };

  // Remove presence
  const removePresence = (playerId: string) => {
    updateAndSync(prev => {
      const newPresent = prev.presentPlayers.filter(p => p.id !== playerId);
      const newQueue = prev.queue.filter(id => id !== playerId);
      return {
        ...prev,
        presentPlayers: newPresent,
        queue: newQueue
      };
    });
  };

  // Defer player to end of queue
  const deferPlayerInQueue = (playerId: string) => {
    updateAndSync(prev => ({
      ...prev,
      queue: movePlayerToEndOfQueue(prev.queue, playerId)
    }));
  };

  // Start initial match
  const startInitialGame = () => {
    updateAndSync(prev => startInitialMatch(prev));
  };

  const setTeamName = (team: 'A' | 'B', name: string) => {
    updateAndSync(prev => {
      if (!prev.currentMatch) return prev;
      const cleanName = name.trim() || (team === 'A' ? 'Time Azul' : 'Time Vermelho');
      return {
        ...prev,
        currentMatch: {
          ...prev.currentMatch,
          teamA: team === 'A' ? { ...prev.currentMatch.teamA, name: cleanName } : prev.currentMatch.teamA,
          teamB: team === 'B' ? { ...prev.currentMatch.teamB, name: cleanName } : prev.currentMatch.teamB
        }
      };
    });
  };

  // Add goal
  const addGoal = (team: 'A' | 'B', playerId?: string) => {
    updateAndSync(prev => {
      if (!prev.currentMatch) return prev;
      const playerName = playerId ? prev.players[playerId]?.name : undefined;
      const accumulated =
        prev.currentMatch.timer.accumulatedSeconds +
        (prev.currentMatch.timer.isRunning && prev.currentMatch.timer.lastStartedAt
          ? Math.max(0, Math.floor((Date.now() - prev.currentMatch.timer.lastStartedAt) / 1000))
          : 0);
      const minute = Math.floor(accumulated / 60) + 1;

      const newGoal: Goal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        team,
        playerId,
        playerName,
        minute,
        timestamp: Date.now()
      };

      const teamA = team === 'A'
        ? { ...prev.currentMatch.teamA, score: prev.currentMatch.teamA.score + 1 }
        : prev.currentMatch.teamA;
      const teamB = team === 'B'
        ? { ...prev.currentMatch.teamB, score: prev.currentMatch.teamB.score + 1 }
        : prev.currentMatch.teamB;

      return {
        ...prev,
        currentMatch: {
          ...prev.currentMatch,
          teamA,
          teamB,
          goals: [...prev.currentMatch.goals, newGoal]
        }
      };
    });
  };

  // Remove last goal (optionally scoped to a specific team)
  const removeLastGoal = (targetTeam?: 'A' | 'B') => {
    updateAndSync(prev => {
      if (!prev.currentMatch || prev.currentMatch.goals.length === 0) return prev;

      let targetIndex = -1;
      if (targetTeam) {
        for (let i = prev.currentMatch.goals.length - 1; i >= 0; i--) {
          if (prev.currentMatch.goals[i].team === targetTeam) {
            targetIndex = i;
            break;
          }
        }
      } else {
        targetIndex = prev.currentMatch.goals.length - 1;
      }

      if (targetIndex === -1) return prev;

      const removedGoal = prev.currentMatch.goals[targetIndex];
      const newGoals = prev.currentMatch.goals.filter((_, i) => i !== targetIndex);

      const teamA = removedGoal.team === 'A'
        ? { ...prev.currentMatch.teamA, score: Math.max(0, prev.currentMatch.teamA.score - 1) }
        : prev.currentMatch.teamA;
      const teamB = removedGoal.team === 'B'
        ? { ...prev.currentMatch.teamB, score: Math.max(0, prev.currentMatch.teamB.score - 1) }
        : prev.currentMatch.teamB;

      return {
        ...prev,
        currentMatch: {
          ...prev.currentMatch,
          teamA,
          teamB,
          goals: newGoals
        }
      };
    });
  };

  const toggleTimer = () => {
    updateAndSync(prev => {
      if (!prev.currentMatch) return prev;
      const isRunning = prev.currentMatch.timer.isRunning;
      const now = Date.now();
      let accumulated = prev.currentMatch.timer.accumulatedSeconds;
      if (isRunning && prev.currentMatch.timer.lastStartedAt) {
        accumulated += Math.max(0, Math.floor((now - prev.currentMatch.timer.lastStartedAt) / 1000));
      }

      return {
        ...prev,
        currentMatch: {
          ...prev.currentMatch,
          timer: {
            ...prev.currentMatch.timer,
            accumulatedSeconds: accumulated,
            isRunning: !isRunning,
            lastStartedAt: !isRunning ? now : null
          }
        }
      };
    });
  };

  const resetTimer = () => {
    updateAndSync(prev => {
      if (!prev.currentMatch) return prev;
      return {
        ...prev,
        currentMatch: {
          ...prev.currentMatch,
          timer: {
            ...prev.currentMatch.timer,
            accumulatedSeconds: 0,
            lastStartedAt: prev.currentMatch.timer.isRunning ? Date.now() : null
          }
        }
      };
    });
  };

  const swapPlayers = (playerAId: string, playerBId: string) => {
    updateAndSync(prev => {
      if (!prev.currentMatch) return prev;
      return {
        ...prev,
        currentMatch: swapPlayersBetweenTeams(prev.currentMatch, playerAId, playerBId)
      };
    });
  };

  const substitutePlayer = (courtPlayerId: string) => {
    updateAndSync(prev => {
      if (!prev.currentMatch) return prev;
      const result = substituteCourtPlayer(
        prev.currentMatch,
        prev.queue,
        courtPlayerId,
        prev.hasPlayedToday
      );
      return {
        ...prev,
        currentMatch: result.updatedMatch,
        queue: result.updatedQueue,
        hasPlayedToday: result.updatedHasPlayed
      };
    });
  };

  const confirmMatchResult = (penaltyWinner?: 'A' | 'B') => {
    updateAndSync(prev => finishCurrentMatch(prev, penaltyWinner));
  };

  const clearAllHistories = () => {
    updateAndSync(prev => ({
      ...prev,
      matchHistory: [],
      attendanceHistory: []
    }));
  };

  const updateRules = (newRules: string) => {
    updateAndSync(prev => ({
      ...prev,
      rules: newRules
    }));
  };

  const resetToDemo = () => {
    const initial = getInitialState();
    updateAndSync(() => initial);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        activeTab,
        syncStatus,
        setActiveTab,
        startDay,
        endDay,
        updateSettings,
        registerPlayer,
        editPlayer,
        togglePlayerInactive,
        deletePlayer,
        togglePreparedConfirmed,
        checkInPlayer,
        removePresence,
        deferPlayerInQueue,
        startInitialGame,
        setTeamName,
        addGoal,
        removeLastGoal,
        toggleTimer,
        resetTimer,
        swapPlayers,
        substitutePlayer,
        confirmMatchResult,
        clearAllHistories,
        updateRules,
        resetToDemo
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
