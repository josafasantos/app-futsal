import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getInitialState,
  insertIntoQueueWithPriority,
  startInitialMatch,
  finishCurrentMatch,
  substituteCourtPlayer,
  swapPlayersBetweenTeams,
  movePlayerToEndOfQueue
} from '../src/utils/domain.ts';

test('Queue Priority: new arrival who hasn\'t played enters before players who already played', () => {
  const hasPlayed = ['p1', 'p2'];
  const currentQueue = ['p1', 'p2'];

  // p3 has NOT played today
  const newQueue = insertIntoQueueWithPriority(currentQueue, 'p3', hasPlayed);
  // p3 must be inserted before p1 and p2!
  assert.deepEqual(newQueue, ['p3', 'p1', 'p2']);

  // p4 has also NOT played today -> should be placed after p3, but before p1 and p2
  const updatedQueue = insertIntoQueueWithPriority(newQueue, 'p4', hasPlayed);
  assert.deepEqual(updatedQueue, ['p3', 'p4', 'p1', 'p2']);

  // p5 HAS played today -> goes straight to the end
  const queueWithP5 = insertIntoQueueWithPriority(updatedQueue, 'p5', [...hasPlayed, 'p5']);
  assert.deepEqual(queueWithP5, ['p3', 'p4', 'p1', 'p2', 'p5']);
});

test('Initial Match: draws 2 teams of size 5 when 10+ present, remainder to queue', () => {
  const state = getInitialState();
  state.dayActive = true;
  state.dayId = 'day-1';
  state.settings.teamSize = 5;

  // Add 12 players
  state.presentPlayers = Array.from({ length: 12 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    arrivedAt: i + 1
  }));

  const nextState = startInitialMatch(state);
  assert.ok(nextState.currentMatch);
  assert.equal(nextState.currentMatch.teamA.playerIds.length, 5);
  assert.equal(nextState.currentMatch.teamB.playerIds.length, 5);
  assert.equal(nextState.queue.length, 2);
  assert.equal(nextState.hasPlayedToday.length, 10);
});

test('Rotation: Winner stays for 2nd match, loser exits to end of queue', () => {
  let state = getInitialState();
  state.dayActive = true;
  state.dayId = 'day-1';
  state.settings.teamSize = 5;
  state.settings.maxConsecutiveMatches = 2;

  state.presentPlayers = Array.from({ length: 15 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    arrivedAt: i + 1
  }));

  state = startInitialMatch(state);
  // Team A: 5 players, Team B: 5 players, Queue: p11, p12, p13, p14, p15 (5 players)
  assert.ok(state.currentMatch);

  const teamAPlayers = [...state.currentMatch.teamA.playerIds];
  const teamBPlayers = [...state.currentMatch.teamB.playerIds];

  // Team A scores 2, Team B scores 1
  state.currentMatch.teamA.score = 2;
  state.currentMatch.teamB.score = 1;

  // Finish match 1
  state = finishCurrentMatch(state);

  // Check match history recorded with durationSeconds
  assert.equal(state.matchHistory.length, 1);
  assert.ok(state.matchHistory[0].durationSeconds !== undefined);

  // Team A won and was on match 0 -> now on match 1 (consecutiveMatches: 1)
  assert.ok(state.currentMatch);
  assert.equal(state.currentMatch.teamA.consecutiveMatches, 1);
  assert.deepEqual(state.currentMatch.teamA.playerIds, teamAPlayers);

  // Team B lost -> must be at the end of the queue
  assert.equal(state.queue.length, 5);
  assert.deepEqual(state.queue, teamBPlayers);
});

test('Rotation: Team exits on reaching 2 consecutive matches even if they win again', () => {
  let state = getInitialState();
  state.dayActive = true;
  state.dayId = 'day-1';
  state.settings.teamSize = 5;
  state.settings.maxConsecutiveMatches = 2;

  // 20 players = 4 teams (A, B, C, D)
  state.presentPlayers = Array.from({ length: 20 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    arrivedAt: i + 1
  }));

  state = startInitialMatch(state);
  const teamAPlayers = [...state.currentMatch!.teamA.playerIds];

  // Match 1: Team A wins
  state.currentMatch!.teamA.score = 3;
  state.currentMatch!.teamB.score = 0;
  state = finishCurrentMatch(state);

  // Match 2: Team A plays their 2nd match and wins again
  assert.equal(state.currentMatch!.teamA.consecutiveMatches, 1);
  state.currentMatch!.teamA.score = 2;
  state.currentMatch!.teamB.score = 1;
  state = finishCurrentMatch(state);

  // Because maxConsecutiveMatches = 2, Team A must EXIT after 2nd match!
  // Team A cannot be teamA or teamB in match 3 (which will be Team D vs Team B)
  assert.ok(state.currentMatch);
  assert.ok(!state.currentMatch.teamA.playerIds.some(id => teamAPlayers.includes(id)));
  assert.ok(!state.currentMatch.teamB.playerIds.some(id => teamAPlayers.includes(id)));
  // In the queue, Team A must be present waiting their turn
  assert.ok(teamAPlayers.every(id => state.queue.includes(id)));
});

test('Draw handling: team with 2 matches exits; team on 1st match stays', () => {
  let state = getInitialState();
  state.dayActive = true;
  state.dayId = 'day-1';
  state.settings.teamSize = 5;
  state.settings.maxConsecutiveMatches = 2;

  state.presentPlayers = Array.from({ length: 15 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    arrivedAt: i + 1
  }));

  state = startInitialMatch(state);
  // Match 1: Team A wins
  state.currentMatch!.teamA.score = 2;
  state.currentMatch!.teamB.score = 0;
  state = finishCurrentMatch(state);

  // Match 2: Team A has 1 match played; Challenger (Team B) has 0 matches played
  assert.equal(state.currentMatch!.teamA.consecutiveMatches, 1);
  assert.equal(state.currentMatch!.teamB.consecutiveMatches, 0);

  // Both tie 1 x 1!
  state.currentMatch!.teamA.score = 1;
  state.currentMatch!.teamB.score = 1;

  // By rule "joga 2 jogos e sai": Team A has now completed 2 matches and exits!
  // Team B (challenger) was only on match 1, so Team B STAYS!
  const teamBChallengerIds = [...state.currentMatch!.teamB.playerIds];
  state = finishCurrentMatch(state);

  assert.ok(state.currentMatch);
  assert.deepEqual(state.currentMatch.teamA.playerIds, teamBChallengerIds);
  assert.equal(state.currentMatch.teamA.consecutiveMatches, 1);
});

test('First match draw: winner decided by penalties', () => {
  let state = getInitialState();
  state.dayActive = true;
  state.dayId = 'day-1';
  state.settings.teamSize = 5;
  state.settings.maxConsecutiveMatches = 2;

  state.presentPlayers = Array.from({ length: 15 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    arrivedAt: i + 1
  }));

  state = startInitialMatch(state);
  // Match 1 ties 2 x 2
  state.currentMatch!.teamA.score = 2;
  state.currentMatch!.teamB.score = 2;

  const teamBPlayers = [...state.currentMatch!.teamB.playerIds];

  // Team B wins penalties
  state = finishCurrentMatch(state, 'B');

  // Team B stays with 1 consecutive match; Team A went to queue
  assert.ok(state.currentMatch);
  assert.deepEqual(state.currentMatch.teamA.playerIds, teamBPlayers);
  assert.equal(state.currentMatch.teamA.consecutiveMatches, 1);
});

test('Substitutions: active court player replaced by 1st in queue', () => {
  let state = getInitialState();
  state.settings.teamSize = 5;
  state.presentPlayers = Array.from({ length: 11 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    arrivedAt: i + 1
  }));
  state = startInitialMatch(state);

  const subInId = state.queue[0]; // p11
  const courtPlayerId = state.currentMatch!.teamA.playerIds[0];

  const { updatedMatch, updatedQueue, updatedHasPlayed } = substituteCourtPlayer(
    state.currentMatch!,
    state.queue,
    courtPlayerId,
    state.hasPlayedToday
  );

  assert.ok(updatedMatch.teamA.playerIds.includes(subInId));
  assert.ok(!updatedMatch.teamA.playerIds.includes(courtPlayerId));
  assert.equal(updatedQueue[updatedQueue.length - 1], courtPlayerId);
  assert.ok(updatedHasPlayed.includes(subInId));
});

test('Voluntary deferral: move player to end of queue', () => {
  const queue = ['p1', 'p2', 'p3'];
  const deferred = movePlayerToEndOfQueue(queue, 'p1');
  assert.deepEqual(deferred, ['p2', 'p3', 'p1']);
});

test('Player swap between teams during match', () => {
  let state = getInitialState();
  state.settings.teamSize = 5;
  state.presentPlayers = Array.from({ length: 10 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    arrivedAt: i + 1
  }));
  state = startInitialMatch(state);

  const playerA = state.currentMatch!.teamA.playerIds[0];
  const playerB = state.currentMatch!.teamB.playerIds[0];

  const swapped = swapPlayersBetweenTeams(state.currentMatch!, playerA, playerB);
  assert.ok(swapped.teamA.playerIds.includes(playerB));
  assert.ok(swapped.teamB.playerIds.includes(playerA));
});
