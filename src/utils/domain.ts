import type { AppState, CurrentMatch, MatchResult, Player } from '../types/index.ts';

export const DEFAULT_RULES = `REGRAS DA PELADA DE FUTSAL

1. CRITÉRIO DE JOGOS E RODÍZIO
- No primeiro jogo: o vencedor fica e o perdedor sai. Se empatar, é decidido no pênalti (quem vencer os pênaltis fica).
- No restante: é feito o rodízio clássico — joga dois jogos e sai (ao completar 2 partidas consecutivas, a equipe sai da quadra).
- Em caso de empate nos jogos seguintes: quem já completou 2 jogos sai da quadra, e o time que jogou apenas 1 permanece.
- Quem sai vai individualmente para o fim da fila na ordem de escalação.

2. DURAÇÃO E TEMPO
- Partidas cronometradas pelo app (padrão de 10 minutos corridos).
- O cronômetro pode ser pausado em paralisações demoradas.

3. PRIORIDADE NA FILA (PRIMEIRA PARTICIPAÇÃO)
- Quem chega e ainda não jogou no dia entra na fila na frente de quem já jogou.
- O botão de adiar (seta para baixo) empurra o jogador para o fim da fila voluntariamente mantendo a presença.

4. REGRAS DE QUADRA
- Laterais e escanteios cobrados exclusivamente com os pés e sobre a linha.
- Goleiro: sem recuo com as mãos. Tiro de meta com as mãos.
- Faltas: sem carrinho. Toda falta violenta ou antidesportiva resulta em tiro livre direto.
- Respeito mútuo e fair play acima de tudo!`;

export const INITIAL_DEMO_PLAYERS: Player[] = [
  { id: 'p1', name: 'Lucas Silva', nickname: 'Lucão', createdAt: 1 },
  { id: 'p2', name: 'Gabriel Santos', nickname: 'Gabi', createdAt: 2 },
  { id: 'p3', name: 'Matheus Oliveira', nickname: 'Theus', createdAt: 3 },
  { id: 'p4', name: 'Felipe Souza', nickname: 'Lipe', createdAt: 4 },
  { id: 'p5', name: 'Rafael Costa', nickname: 'Rafa', createdAt: 5 },
  { id: 'p6', name: 'Bruno Alves', nickname: 'Brunão', createdAt: 6 },
  { id: 'p7', name: 'Thiago Pereira', nickname: 'Thiaguinho', createdAt: 7 },
  { id: 'p8', name: 'Rodrigo Lima', nickname: 'Digo', createdAt: 8 },
  { id: 'p9', name: 'Leonardo Ribeiro', nickname: 'Léo', createdAt: 9 },
  { id: 'p10', name: 'Diego Ferreira', nickname: 'Dieguinho', createdAt: 10 },
  { id: 'p11', name: 'Vinicius Barbosa', nickname: 'Vini', createdAt: 11 },
  { id: 'p12', name: 'Eduardo Ramos', nickname: 'Dudu', createdAt: 12 },
  { id: 'p13', name: 'Guilherme Castro', nickname: 'Gui', createdAt: 13 },
  { id: 'p14', name: 'André Martins', nickname: 'Dedé', createdAt: 14 }
];

export function getInitialState(): AppState {
  const playersMap: Record<string, Player> = {};
  INITIAL_DEMO_PLAYERS.forEach(p => {
    playersMap[p.id] = p;
  });

  return {
    dayActive: false,
    dayId: null,
    players: playersMap,
    preparedConfirmed: {},
    dayConfirmed: {},
    presentPlayers: [],
    queue: [],
    hasPlayedToday: [],
    currentMatch: null,
    matchHistory: [],
    attendanceHistory: [],
    rules: DEFAULT_RULES,
    settings: {
      teamSize: 5,
      matchDurationMinutes: 10,
      maxConsecutiveMatches: 2,
      maxConfirmed: 30
    }
  };
}

/**
 * Inserts a player into queue with priority for first-timers
 */
export function insertIntoQueueWithPriority(
  currentQueue: string[],
  playerId: string,
  hasPlayedToday: string[]
): string[] {
  // Already in queue? Return as is
  if (currentQueue.includes(playerId)) return currentQueue;

  const playerHasPlayed = hasPlayedToday.includes(playerId);

  // If already played today, goes directly to the very end
  if (playerHasPlayed) {
    return [...currentQueue, playerId];
  }

  // If hasn't played today, insert before the first player who HAS played today
  const firstPlayedIndex = currentQueue.findIndex(id => hasPlayedToday.includes(id));
  if (firstPlayedIndex === -1) {
    // No one in queue has played yet, so append to end of queue
    return [...currentQueue, playerId];
  }

  // Insert just before the first player who has played
  const newQueue = [...currentQueue];
  newQueue.splice(firstPlayedIndex, 0, playerId);
  return newQueue;
}

/**
 * Shuffle array utility (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Starts initial match of the day with lottery/shuffle
 */
export function startInitialMatch(state: AppState): AppState {
  const teamSize = state.settings.teamSize;
  const needed = teamSize * 2;

  if (state.presentPlayers.length < needed) {
    throw new Error(`São necessários pelo menos ${needed} jogadores presentes para iniciar.`);
  }

  // First 2*teamSize players who arrived participate in initial draw
  const candidateIds = state.presentPlayers.slice(0, needed).map(p => p.id);
  const remainingPresentIds = state.presentPlayers.slice(needed).map(p => p.id);

  const shuffled = shuffleArray(candidateIds);
  const teamAPlayers = shuffled.slice(0, teamSize);
  const teamBPlayers = shuffled.slice(teamSize, needed);

  const newHasPlayed = Array.from(new Set([...state.hasPlayedToday, ...teamAPlayers, ...teamBPlayers]));

  const currentMatch: CurrentMatch = {
    id: `match-${Date.now()}`,
    teamA: {
      name: 'Time Azul',
      playerIds: teamAPlayers,
      score: 0,
      consecutiveMatches: 0
    },
    teamB: {
      name: 'Time Vermelho',
      playerIds: teamBPlayers,
      score: 0,
      consecutiveMatches: 0
    },
    goals: [],
    timer: {
      accumulatedSeconds: 0,
      lastStartedAt: null,
      isRunning: false
    }
  };

  return {
    ...state,
    currentMatch,
    queue: remainingPresentIds,
    hasPlayedToday: newHasPlayed
  };
}

/**
 * Rotates match according to user rules:
 * - Winner stays unless reached maxConsecutiveMatches (2)
 * - Loser exits
 * - In case of draw: team that reached 2 matches exits; if both are at 1st match, Team A stays
 * - Exiting players go to the end of queue in team order
 * - Next team of size teamSize enters from front of queue
 */
export function finishCurrentMatch(
  state: AppState,
  penaltyWinner?: 'A' | 'B'
): AppState {
  const match = state.currentMatch;
  if (!match) return state;

  const teamSize = state.settings.teamSize;
  const maxConsecutive = state.settings.maxConsecutiveMatches;

  let winner: 'A' | 'B' | 'DRAW';
  if (match.teamA.score > match.teamB.score) {
    winner = 'A';
  } else if (match.teamB.score > match.teamA.score) {
    winner = 'B';
  } else {
    winner = 'DRAW';
  }

  // Create match result record
  const getPlayerName = (id: string) => state.players[id]?.name || id;

  const durationSeconds =
    match.timer.accumulatedSeconds +
    (match.timer.isRunning && match.timer.lastStartedAt
      ? Math.max(0, Math.floor((Date.now() - match.timer.lastStartedAt) / 1000))
      : 0);

  const resultRecord: MatchResult = {
    id: match.id,
    dayId: state.dayId || 'day-unknown',
    playedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    timestamp: Date.now(),
    durationSeconds,
    teamA: {
      name: match.teamA.name,
      playerIds: match.teamA.playerIds,
      playerNames: match.teamA.playerIds.map(getPlayerName),
      score: match.teamA.score
    },
    teamB: {
      name: match.teamB.name,
      playerIds: match.teamB.playerIds,
      playerNames: match.teamB.playerIds.map(getPlayerName),
      score: match.teamB.score
    },
    winner,
    goals: match.goals
  };

  const updatedHistory = [resultRecord, ...state.matchHistory];

  // Determine which team stays and which team leaves
  let teamAStays = false;
  let teamBStays = false;

  const teamAMatchesAfterThis = match.teamA.consecutiveMatches + 1;
  const teamBMatchesAfterThis = match.teamB.consecutiveMatches + 1;

  if (winner === 'A') {
    if (teamAMatchesAfterThis < maxConsecutive) {
      teamAStays = true;
    }
    // Team B lost, so team B leaves
  } else if (winner === 'B') {
    if (teamBMatchesAfterThis < maxConsecutive) {
      teamBStays = true;
    }
    // Team A lost, so team A leaves
  } else {
    // DRAW:
    const isFirstMatchForBoth = match.teamA.consecutiveMatches === 0 && match.teamB.consecutiveMatches === 0;

    if (isFirstMatchForBoth) {
      // Regra 1: "No primeiro jogo o vencedor fica e perdedor sai, se empatar e decidido no penalti"
      if (penaltyWinner === 'B') {
        teamBStays = true;
        teamAStays = false;
      } else {
        teamAStays = true;
        teamBStays = false;
      }
    } else {
      // Regra 2: "No restante é feito um rodizio, joga dois jogos e sai"
      if (teamAMatchesAfterThis >= maxConsecutive && teamBMatchesAfterThis >= maxConsecutive) {
        teamAStays = false;
        teamBStays = false;
      } else if (teamAMatchesAfterThis >= maxConsecutive) {
        // Team A já jogou 2 partidas, sai da quadra! Team B jogou 1, permanece.
        teamAStays = false;
        teamBStays = true;
      } else if (teamBMatchesAfterThis >= maxConsecutive) {
        // Team B já jogou 2 partidas, sai da quadra! Team A jogou 1, permanece.
        teamAStays = true;
        teamBStays = false;
      } else {
        if (penaltyWinner === 'B') {
          teamBStays = true;
          teamAStays = false;
        } else {
          teamAStays = true;
          teamBStays = false;
        }
      }
    }
  }

  // Calculate new queue
  let currentQueue = [...state.queue];

  // Add exiting teams to end of queue
  if (!teamAStays) {
    currentQueue.push(...match.teamA.playerIds);
  }
  if (!teamBStays) {
    currentQueue.push(...match.teamB.playerIds);
  }

  // Now create the next match
  let nextMatch: CurrentMatch | null = null;
  const newHasPlayed = new Set(state.hasPlayedToday);

  if (teamAStays) {
    // Team A stays, takes next teamSize players from queue for Team B
    const incomingB = currentQueue.slice(0, teamSize);
    currentQueue = currentQueue.slice(teamSize);
    incomingB.forEach(id => newHasPlayed.add(id));

    const opponentName = match.teamA.name === 'Time Azul' ? 'Time Vermelho' : 'Time Azul';

    nextMatch = {
      id: `match-${Date.now()}`,
      teamA: {
        name: match.teamA.name,
        playerIds: match.teamA.playerIds,
        score: 0,
        consecutiveMatches: teamAMatchesAfterThis
      },
      teamB: {
        name: opponentName,
        playerIds: incomingB,
        score: 0,
        consecutiveMatches: 0
      },
      goals: [],
      timer: {
        accumulatedSeconds: 0,
        lastStartedAt: null,
        isRunning: false
      }
    };
  } else if (teamBStays) {
    // Team B stays, takes next teamSize players from queue for Team A
    const incomingA = currentQueue.slice(0, teamSize);
    currentQueue = currentQueue.slice(teamSize);
    incomingA.forEach(id => newHasPlayed.add(id));

    const opponentName = match.teamB.name === 'Time Azul' ? 'Time Vermelho' : 'Time Azul';

    nextMatch = {
      id: `match-${Date.now()}`,
      teamA: {
        name: match.teamB.name,
        playerIds: match.teamB.playerIds,
        score: 0,
        consecutiveMatches: teamBMatchesAfterThis
      },
      teamB: {
        name: opponentName,
        playerIds: incomingA,
        score: 0,
        consecutiveMatches: 0
      },
      goals: [],
      timer: {
        accumulatedSeconds: 0,
        lastStartedAt: null,
        isRunning: false
      }
    };
  } else {
    // Both teams exited! Next 2 * teamSize players enter
    const incomingA = currentQueue.slice(0, teamSize);
    const incomingB = currentQueue.slice(teamSize, teamSize * 2);
    currentQueue = currentQueue.slice(teamSize * 2);
    incomingA.forEach(id => newHasPlayed.add(id));
    incomingB.forEach(id => newHasPlayed.add(id));

    if (incomingA.length > 0) {
      nextMatch = {
        id: `match-${Date.now()}`,
        teamA: {
          name: 'Time Azul',
          playerIds: incomingA,
          score: 0,
          consecutiveMatches: 0
        },
        teamB: {
          name: 'Time Vermelho',
          playerIds: incomingB,
          score: 0,
          consecutiveMatches: 0
        },
        goals: [],
        timer: {
          accumulatedSeconds: 0,
          lastStartedAt: null,
          isRunning: false
        }
      };
    }
  }

  return {
    ...state,
    currentMatch: nextMatch,
    queue: currentQueue,
    hasPlayedToday: Array.from(newHasPlayed),
    matchHistory: updatedHistory
  };
}

/**
 * Swaps two players between Team A and Team B
 */
export function swapPlayersBetweenTeams(
  match: CurrentMatch,
  playerAId: string,
  playerBId: string
): CurrentMatch {
  if (!match.teamA.playerIds.includes(playerAId) || !match.teamB.playerIds.includes(playerBId)) {
    return match;
  }

  const newTeamAPlayers = match.teamA.playerIds.map(id => id === playerAId ? playerBId : id);
  const newTeamBPlayers = match.teamB.playerIds.map(id => id === playerBId ? playerAId : id);

  return {
    ...match,
    teamA: { ...match.teamA, playerIds: newTeamAPlayers },
    teamB: { ...match.teamB, playerIds: newTeamBPlayers }
  };
}

/**
 * Substitutes an active court player with the first player in queue
 */
export function substituteCourtPlayer(
  match: CurrentMatch,
  queue: string[],
  courtPlayerId: string,
  hasPlayedToday: string[]
): { updatedMatch: CurrentMatch; updatedQueue: string[]; updatedHasPlayed: string[] } {
  if (queue.length === 0) {
    return { updatedMatch: match, updatedQueue: queue, updatedHasPlayed: hasPlayedToday };
  }

  const subInPlayerId = queue[0];
  const newQueue = [...queue.slice(1), courtPlayerId];
  const newHasPlayed = Array.from(new Set([...hasPlayedToday, subInPlayerId]));

  let updatedMatch = { ...match };
  if (match.teamA.playerIds.includes(courtPlayerId)) {
    updatedMatch.teamA = {
      ...match.teamA,
      playerIds: match.teamA.playerIds.map(id => id === courtPlayerId ? subInPlayerId : id)
    };
  } else if (match.teamB.playerIds.includes(courtPlayerId)) {
    updatedMatch.teamB = {
      ...match.teamB,
      playerIds: match.teamB.playerIds.map(id => id === courtPlayerId ? subInPlayerId : id)
    };
  }

  return {
    updatedMatch,
    updatedQueue: newQueue,
    updatedHasPlayed: newHasPlayed
  };
}

/**
 * Moves a player to the very end of the queue (voluntary deferral)
 */
export function movePlayerToEndOfQueue(queue: string[], playerId: string): string[] {
  if (!queue.includes(playerId)) return queue;
  return [...queue.filter(id => id !== playerId), playerId];
}
