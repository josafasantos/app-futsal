export interface Player {
  id: string;
  name: string;
  nickname?: string;
  inactive?: boolean;
  createdAt: number;
}

export interface ConfirmedPlayer {
  id: string;
  name: string;
  confirmedAt: number;
}

export interface PresentPlayer {
  id: string;
  name: string;
  arrivedAt: number;
}

export interface Goal {
  id: string;
  team: 'A' | 'B';
  playerId?: string;
  playerName?: string;
  minute: number;
  timestamp: number;
}

export interface Team {
  name: string;
  playerIds: string[];
  score: number;
  consecutiveMatches: number;
}

export interface MatchTimer {
  accumulatedSeconds: number;
  lastStartedAt: number | null;
  isRunning: boolean;
}

export interface CurrentMatch {
  id: string;
  teamA: Team;
  teamB: Team;
  goals: Goal[];
  timer: MatchTimer;
}

export interface MatchResult {
  id: string;
  dayId: string;
  playedAt: string;
  timestamp: number;
  durationSeconds?: number;
  teamA: {
    name: string;
    playerIds: string[];
    playerNames: string[];
    score: number;
  };
  teamB: {
    name: string;
    playerIds: string[];
    playerNames: string[];
    score: number;
  };
  winner: 'A' | 'B' | 'DRAW';
  goals: Goal[];
}

export interface DayAttendanceRecord {
  dayId: string;
  date: string;
  confirmedPlayers: { id: string; name: string }[];
  presentPlayers: { id: string; name: string }[];
  completed: boolean;
}

export interface AppSettings {
  teamSize: number; // 4, 5 or 6 (default 5)
  matchDurationMinutes: number; // e.g. 10
  maxConsecutiveMatches: number; // default 2
  maxConfirmed: number; // capacity limit, default 30
}

export interface AppState {
  dayActive: boolean;
  dayId: string | null;
  players: Record<string, Player>;
  preparedConfirmed: Record<string, ConfirmedPlayer>; // pre-list for next session
  dayConfirmed: Record<string, ConfirmedPlayer>; // confirmed for active day
  presentPlayers: PresentPlayer[]; // currently present
  queue: string[]; // queue of player IDs waiting for next match
  hasPlayedToday: string[]; // IDs that already stepped on court today
  currentMatch: CurrentMatch | null;
  matchHistory: MatchResult[];
  attendanceHistory: DayAttendanceRecord[];
  rules: string;
  settings: AppSettings;
}
