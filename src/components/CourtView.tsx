import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  ArrowLeftRight,
  UserMinus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trophy,
  Users
} from 'lucide-react';
import { GoalModal } from './GoalModal';
import { PlayerSwapModal } from './PlayerSwapModal';

export const CourtView: React.FC = () => {
  const {
    state,
    startInitialGame,
    setTeamName,
    removeLastGoal,
    toggleTimer,
    resetTimer,
    substitutePlayer,
    confirmMatchResult,
    setActiveTab,
    startDay
  } = useApp();

  const [goalModalTeam, setGoalModalTeam] = useState<'A' | 'B' | null>(null);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  const match = state.currentMatch;
  const teamSize = state.settings.teamSize;
  const neededPlayers = teamSize * 2;
  const presentCount = state.presentPlayers.length;

  // Live timer tick when running
  React.useEffect(() => {
    if (!match?.timer.isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [match?.timer.isRunning]);

  // Format seconds to MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentSeconds = match
    ? match.timer.accumulatedSeconds +
      (match.timer.isRunning && match.timer.lastStartedAt
        ? Math.max(0, Math.floor((now - match.timer.lastStartedAt) / 1000))
        : 0)
    : 0;
  const durationSeconds = state.settings.matchDurationMinutes * 60;
  const isTimeOver = currentSeconds >= durationSeconds;

  // Case 1: Day is closed
  if (!state.dayActive) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4 space-y-4">
        <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-inner border border-slate-700">
          ⚽
        </div>
        <h2 className="text-xl font-bold text-white">Nenhum dia de jogo aberto</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Inicie o dia para abrir o registro de presença, formação dos times e o placar.
        </p>
        <div className="pt-2">
          <button
            onClick={startDay}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-950/50 transition-all inline-flex items-center gap-2 text-sm"
          >
            <Play size={16} />
            <span>Iniciar Dia Agora</span>
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Day is open, but match hasn't started yet
  if (!match) {
    const canStart = presentCount >= neededPlayers;

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-emerald-950/80 border border-emerald-700/50 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            📋
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Preparando Partida Inicial</h2>
            <p className="text-slate-400 text-xs mt-1">
              Formato: <span className="text-emerald-400 font-semibold">{teamSize} contra {teamSize}</span> ({neededPlayers} jogadores em quadra)
            </p>
          </div>

          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 inline-block w-full max-w-sm">
            <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1.5">
              <span>Jogadores presentes no local:</span>
              <span className="font-bold text-white">{presentCount} / {neededPlayers}</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${canStart ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, (presentCount / neededPlayers) * 100)}%` }}
              />
            </div>
            {!canStart && (
              <p className="text-[11px] text-amber-400/90 mt-2 flex items-center justify-center gap-1">
                <AlertCircle size={13} />
                <span>Faltam {neededPlayers - presentCount} jogadores confirmarem chegada</span>
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              disabled={!canStart}
              onClick={startInitialGame}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Trophy size={16} />
              <span>Sortear Times e Iniciar</span>
            </button>
            <button
              onClick={() => setActiveTab('presence')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-5 py-3 rounded-xl border border-slate-700 transition-colors text-sm"
            >
              Confirmar Chegadas na Presença
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Match is in progress
  const nextTeamPlayerIds = state.queue.slice(0, teamSize);

  const getTeamVisuals = (name: string, fallback: 'blue' | 'red') => {
    const isRed = name.toLowerCase().includes('vermelh') || (!name.toLowerCase().includes('azul') && fallback === 'red');
    if (isRed) {
      return {
        dot: 'bg-rose-500 shadow-sm shadow-rose-500/50',
        scoreColor: 'text-rose-400',
        golBtn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/50',
        badge: 'bg-rose-950/80 border-rose-800/80 text-rose-300',
        border: 'border-rose-900/40',
        isRed: true,
        oppositeName: 'Time Azul'
      };
    }
    return {
      dot: 'bg-blue-500 shadow-sm shadow-blue-500/50',
      scoreColor: 'text-blue-400',
      golBtn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/50',
      badge: 'bg-blue-950/80 border-blue-800/80 text-blue-300',
      border: 'border-blue-900/40',
      isRed: false,
      oppositeName: 'Time Vermelho'
    };
  };

  const themeA = getTeamVisuals(match.teamA.name, 'blue');
  const themeB = getTeamVisuals(match.teamB.name, 'red');

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-6">
      {/* Time expired warning */}
      {isTimeOver && (
        <div className="bg-rose-950/80 border border-rose-800/80 text-rose-200 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs sm:text-sm animate-pulse shadow-lg">
          <div className="flex items-center gap-2 font-semibold">
            <Clock size={16} className="text-rose-400" />
            <span>Tempo regulamentar esgotado ({state.settings.matchDurationMinutes} min)!</span>
          </div>
          <button
            onClick={() => setConfirmModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm"
          >
            Finalizar Partida
          </button>
        </div>
      )}

      {/* Main Scoreboard & Timer Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

        {/* Match Header Info */}
        <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800/70 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Partida em Andamento</span>
          </div>

          <div className="text-slate-400">
            Formato: <span className="text-emerald-400 font-semibold">{teamSize}x{teamSize}</span>
          </div>
        </div>

        {/* Score & Timer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Team A */}
          <div className={`bg-slate-950/70 border ${themeA.border} rounded-2xl p-4 text-center space-y-2 relative shadow-lg`}>
            <div className="flex items-center justify-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${themeA.dot} inline-block`} />
              <h3 className="font-bold text-white text-base sm:text-lg truncate">
                {match.teamA.name}
              </h3>
              <button
                type="button"
                onClick={() => setTeamName('A', themeA.oppositeName)}
                title="Trocar cor/nome do time"
                className="text-[10px] text-slate-500 hover:text-slate-300 ml-0.5 px-1 rounded bg-slate-900 border border-slate-800"
              >
                ⇄
              </button>
            </div>
            <div className={`inline-block ${themeA.badge} border text-[11px] px-2 py-0.5 rounded-full font-medium`}>
              {match.teamA.consecutiveMatches === 0 ? '1º Jogo' : '2º Jogo consecutivo'}
            </div>

            <div className={`text-5xl sm:text-6xl font-black ${themeA.scoreColor} tracking-tight py-1 font-mono`}>
              {match.teamA.score}
            </div>

            <div className="flex justify-center gap-2 pt-1">
              <button
                onClick={() => setGoalModalTeam('A')}
                className={`flex-1 ${themeA.golBtn} font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1`}
              >
                <Plus size={15} />
                <span>GOL</span>
              </button>
              {match.goals.some(g => g.team === 'A') && (
                <button
                  onClick={() => removeLastGoal('A')}
                  title="Desfazer último gol do Time A"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700"
                >
                  <Minus size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Center: Live Timer */}
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Clock size={13} />
              <span>Cronômetro</span>
            </div>

            <div className={`font-mono text-4xl sm:text-5xl font-black tracking-wider ${
              isTimeOver
                ? 'text-rose-500 animate-pulse'
                : match.timer.isRunning
                ? 'text-emerald-400'
                : 'text-slate-300'
            }`}>
              {formatTimer(currentSeconds)}
            </div>

            <div className="text-[11px] text-slate-400">
              Duração: {state.settings.matchDurationMinutes} min
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={toggleTimer}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all ${
                  match.timer.isRunning
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                }`}
              >
                {match.timer.isRunning ? <Pause size={14} /> : <Play size={14} />}
                <span>{match.timer.isRunning ? 'Pausar' : 'Iniciar'}</span>
              </button>

              <button
                onClick={resetTimer}
                title="Zerar cronômetro"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Team B */}
          <div className={`bg-slate-950/70 border ${themeB.border} rounded-2xl p-4 text-center space-y-2 relative shadow-lg`}>
            <div className="flex items-center justify-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full ${themeB.dot} inline-block`} />
              <h3 className="font-bold text-white text-base sm:text-lg truncate">
                {match.teamB.name}
              </h3>
              <button
                type="button"
                onClick={() => setTeamName('B', themeB.oppositeName)}
                title="Trocar cor/nome do time"
                className="text-[10px] text-slate-500 hover:text-slate-300 ml-0.5 px-1 rounded bg-slate-900 border border-slate-800"
              >
                ⇄
              </button>
            </div>
            <div className={`inline-block ${themeB.badge} border text-[11px] px-2 py-0.5 rounded-full font-medium`}>
              {match.teamB.consecutiveMatches === 0 ? '1º Jogo' : '2º Jogo consecutivo'}
            </div>

            <div className={`text-5xl sm:text-6xl font-black ${themeB.scoreColor} tracking-tight py-1 font-mono`}>
              {match.teamB.score}
            </div>

            <div className="flex justify-center gap-2 pt-1">
              <button
                onClick={() => setGoalModalTeam('B')}
                className={`flex-1 ${themeB.golBtn} font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1`}
              >
                <Plus size={15} />
                <span>GOL</span>
              </button>
              {match.goals.some(g => g.team === 'B') && (
                <button
                  onClick={() => removeLastGoal('B')}
                  title="Desfazer último gol do Time B"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700"
                >
                  <Minus size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Goals List (Recent actions) */}
        {match.goals.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap gap-2 items-center text-xs">
            <span className="text-slate-400 font-semibold">Gols:</span>
            {match.goals.map(g => (
              <span
                key={g.id}
                className="bg-slate-800/90 border border-slate-700/70 px-2.5 py-1 rounded-lg text-slate-200 flex items-center gap-1.5"
              >
                <span>⚽</span>
                <span className="font-medium">{g.playerName || (g.team === 'A' ? match.teamA.name : match.teamB.name)}</span>
                <span className="text-[10px] text-slate-400">{g.minute}'</span>
              </span>
            ))}
          </div>
        )}

        {/* Actions bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setShowSwapModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeftRight size={14} className="text-emerald-400" />
            <span>Trocar jogadores entre os times</span>
          </button>

          <button
            onClick={() => setConfirmModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all ml-auto"
          >
            <CheckCircle2 size={16} />
            <span>Confirmar Resultado e Rodar Fila</span>
          </button>
        </div>
      </div>

      {/* Lineups and Substitutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team A Lineup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${themeA.dot}`} />
              <h4 className="font-bold text-white text-sm">{match.teamA.name}</h4>
            </div>
            <span className="text-xs text-slate-400">{match.teamA.playerIds.length} jogadores</span>
          </div>

          <div className="space-y-1.5">
            {match.teamA.playerIds.map(id => {
              const player = state.players[id];
              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                >
                  <div className="font-medium text-slate-200 truncate">
                    {player?.name || id}
                    {player?.nickname && <span className="text-slate-400 ml-1">({player.nickname})</span>}
                  </div>
                  <button
                    onClick={() => substitutePlayer(id)}
                    disabled={state.queue.length === 0}
                    title="Substituir pelo 1º da fila"
                    className="p-1 text-slate-400 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team B Lineup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${themeB.dot}`} />
              <h4 className="font-bold text-white text-sm">{match.teamB.name}</h4>
            </div>
            <span className="text-xs text-slate-400">{match.teamB.playerIds.length} jogadores</span>
          </div>

          <div className="space-y-1.5">
            {match.teamB.playerIds.map(id => {
              const player = state.players[id];
              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                >
                  <div className="font-medium text-slate-200 truncate">
                    {player?.name || id}
                    {player?.nickname && <span className="text-slate-400 ml-1">({player.nickname})</span>}
                  </div>
                  <button
                    onClick={() => substitutePlayer(id)}
                    disabled={state.queue.length === 0}
                    title="Substituir pelo 1º da fila"
                    className="p-1 text-slate-400 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition-colors"
                  >
                    <UserMinus size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Next Team Waiting Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-amber-400" />
            <h4 className="font-bold text-white text-sm">Próximo Time a Entrar</h4>
          </div>
          <button
            onClick={() => setActiveTab('queue')}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            Ver fila completa ({state.queue.length})
          </button>
        </div>

        {nextTeamPlayerIds.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">Nenhum jogador na fila de espera.</p>
        ) : (
          <div>
            <div className="flex flex-wrap gap-2 pt-1">
              {nextTeamPlayerIds.map((id, index) => {
                const player = state.players[id];
                const isFirstTimer = !state.hasPlayedToday.includes(id);
                return (
                  <span
                    key={id}
                    className="bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-200 font-medium flex items-center gap-1.5"
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] text-slate-400 flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span>{player?.name || id}</span>
                    {isFirstTimer && (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                        1ª Partida
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
            {nextTeamPlayerIds.length < teamSize && (
              <p className="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1">
                <AlertCircle size={12} />
                <span>Time incompleto: faltam {teamSize - nextTeamPlayerIds.length} jogadores na fila</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {goalModalTeam && (
        <GoalModal team={goalModalTeam} onClose={() => setGoalModalTeam(null)} />
      )}
      {showSwapModal && (
        <PlayerSwapModal onClose={() => setShowSwapModal(false)} />
      )}

      {/* Confirm Result Dialog */}
      {confirmModalOpen && (() => {
        const isDraw = match.teamA.score === match.teamB.score;
        const isFirstMatchForBoth = match.teamA.consecutiveMatches === 0 && match.teamB.consecutiveMatches === 0;
        const teamAMatchesAfter = match.teamA.consecutiveMatches + 1;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-finish-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmModalOpen(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
              <h3 id="confirm-finish-title" className="font-bold text-white text-base">Finalizar Partida</h3>
              
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center space-y-1">
                <div className="text-xs text-slate-400">Placar Final</div>
                <div className="text-xl font-black text-white">
                  <span className={themeA.scoreColor}>{match.teamA.name} ({match.teamA.score})</span>
                  <span className="text-slate-500 mx-2">x</span>
                  <span className={themeB.scoreColor}>({match.teamB.score}) {match.teamB.name}</span>
                </div>

                {!isDraw && (
                  <div className="text-xs font-semibold text-emerald-400 pt-1">
                    {match.teamA.score > match.teamB.score
                      ? `Vitória do ${match.teamA.name}`
                      : `Vitória do ${match.teamB.name}`}
                  </div>
                )}
              </div>

              {/* Case A: Tie on 1st match -> Penalty Decision! */}
              {isDraw && isFirstMatchForBoth ? (
                <div className="space-y-3 pt-1">
                  <div className="bg-amber-950/60 border border-amber-800/80 p-3 rounded-xl text-center space-y-1">
                    <div className="text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5">
                      <span>⚽ Decisão por Pênaltis</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Empate no 1º jogo! Pela regra, quem vencer nos pênaltis fica em quadra.
                    </p>
                    <p className="text-xs text-amber-200 font-semibold pt-0.5">
                      Quem venceu a disputa de pênaltis?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        confirmMatchResult('A');
                        setConfirmModalOpen(false);
                      }}
                      className={`py-2.5 px-2 rounded-xl ${themeA.golBtn} font-bold text-xs truncate shadow-sm`}
                    >
                      ⚽ {match.teamA.name}
                    </button>
                    <button
                      onClick={() => {
                        confirmMatchResult('B');
                        setConfirmModalOpen(false);
                      }}
                      className={`py-2.5 px-2 rounded-xl ${themeB.golBtn} font-bold text-xs truncate shadow-sm`}
                    >
                      ⚽ {match.teamB.name}
                    </button>
                  </div>
                </div>
              ) : isDraw ? (
                /* Case B: Tie in subsequent matches -> 2-game rotation rule */
                <div className="space-y-3 pt-1">
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center space-y-1">
                    <div className="text-xs font-semibold text-amber-400">
                      Empate • Regra dos 2 jogos
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {teamAMatchesAfter >= 2
                        ? `${match.teamA.name} completou 2 jogos e sai. ${match.teamB.name} permanece.`
                        : `${match.teamB.name} completou 2 jogos e sai. ${match.teamA.name} permanece.`}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      confirmMatchResult();
                      setConfirmModalOpen(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirmar e Rodar Fila</span>
                  </button>
                </div>
              ) : (
                /* Case C: Normal victory by score */
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      confirmMatchResult();
                      setConfirmModalOpen(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={16} />
                    <span>Confirmar Resultado e Rodar Fila</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setConfirmModalOpen(false)}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                Voltar à quadra
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
