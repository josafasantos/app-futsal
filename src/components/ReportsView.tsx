import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, BarChart3, Calendar, History, Medal, Clock } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { state } = useApp();
  const [reportTab, setReportTab] = useState<'goals' | 'matches' | 'attendance' | 'history'>('goals');

  const players = state.players;
  const matchHistory = state.matchHistory;
  const attendanceHistory = state.attendanceHistory;

  // 1. Goal Scorers calculation (Artilharia)
  const goalCounts: Record<string, { name: string; count: number }> = {};
  matchHistory.forEach(match => {
    match.goals.forEach(goal => {
      if (goal.playerId) {
        if (!goalCounts[goal.playerId]) {
          goalCounts[goal.playerId] = {
            name: players[goal.playerId]?.name || goal.playerName || goal.playerId,
            count: 0
          };
        }
        goalCounts[goal.playerId].count += 1;
      }
    });
  });

  const sortedScorers = Object.entries(goalCounts)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count);

  // 2. Player Performance (Vitórias, Empates, Derrotas, Aproveitamento)
  const statsMap: Record<
    string,
    { id: string; name: string; matches: number; wins: number; draws: number; losses: number; points: number }
  > = {};

  Object.values(players).forEach(p => {
    statsMap[p.id] = {
      id: p.id,
      name: p.name,
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0
    };
  });

  matchHistory.forEach(match => {
    const winner = match.winner;

    // Team A players
    match.teamA.playerIds.forEach(id => {
      if (!statsMap[id]) {
        statsMap[id] = {
          id,
          name: players[id]?.name || id,
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0
        };
      }
      statsMap[id].matches += 1;
      if (winner === 'A') {
        statsMap[id].wins += 1;
        statsMap[id].points += 3;
      } else if (winner === 'DRAW') {
        statsMap[id].draws += 1;
        statsMap[id].points += 1;
      } else {
        statsMap[id].losses += 1;
      }
    });

    // Team B players
    match.teamB.playerIds.forEach(id => {
      if (!statsMap[id]) {
        statsMap[id] = {
          id,
          name: players[id]?.name || id,
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          points: 0
        };
      }
      statsMap[id].matches += 1;
      if (winner === 'B') {
        statsMap[id].wins += 1;
        statsMap[id].points += 3;
      } else if (winner === 'DRAW') {
        statsMap[id].draws += 1;
        statsMap[id].points += 1;
      } else {
        statsMap[id].losses += 1;
      }
    });
  });

  const sortedStats = Object.values(statsMap)
    .filter(s => s.matches > 0)
    .sort((a, b) => b.wins - a.wins || b.points - a.points);

  // 3. Attendance Calculation
  const attendanceCounts: Record<string, { name: string; presentCount: number }> = {};
  attendanceHistory.forEach(rec => {
    rec.presentPlayers.forEach(p => {
      if (!attendanceCounts[p.id]) {
        attendanceCounts[p.id] = {
          name: players[p.id]?.name || p.name,
          presentCount: 0
        };
      }
      attendanceCounts[p.id].presentCount += 1;
    });
  });

  const sortedAttendance = Object.entries(attendanceCounts)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.presentCount - a.presentCount);

  const formatDuration = (totalSec?: number) => {
    if (totalSec === undefined || totalSec === null) return null;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 md:pb-6">
      {/* Header and Subnavigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mb-3">
          <BarChart3 size={18} className="text-emerald-400" />
          <span>Relatórios e Estatísticas da Pelada</span>
        </h2>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto gap-1">
          {[
            { id: 'goals' as const, label: '⚽ Artilharia', icon: Medal },
            { id: 'matches' as const, label: '🏆 Vitórias & Jogos', icon: Trophy },
            { id: 'attendance' as const, label: '📅 Presenças', icon: Calendar },
            { id: 'history' as const, label: '📜 Histórico', icon: History }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setReportTab(t.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                reportTab === t.id
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content per Tab */}

      {/* Tab: Goals / Artilharia */}
      {reportTab === 'goals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-3.5 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Jogador</span>
            <span>Gols Marcados</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {sortedScorers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhum gol registrado com autor nas partidas concluídas.
              </div>
            ) : (
              sortedScorers.map((s, idx) => (
                <div key={s.id} className="p-3 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40' :
                      idx === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold text-base">
                    <span>{s.count}</span>
                    <span className="text-xs text-slate-400 font-normal">gol{s.count > 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Matches / Vitórias */}
      {reportTab === 'matches' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-3.5 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider grid grid-cols-12">
            <span className="col-span-6">Jogador</span>
            <span className="col-span-2 text-center">Jogos</span>
            <span className="col-span-2 text-center">Vitórias</span>
            <span className="col-span-2 text-right">Aprov.</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {sortedStats.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma partida registrada ainda.
              </div>
            ) : (
              sortedStats.map((s, idx) => {
                const winRate = s.matches > 0 ? Math.round((s.wins / s.matches) * 100) : 0;
                return (
                  <div key={s.id} className="p-3 grid grid-cols-12 items-center text-xs sm:text-sm">
                    <div className="col-span-6 flex items-center gap-2 truncate">
                      <span className="text-xs text-slate-500 font-mono w-4">{idx + 1}.</span>
                      <span className="font-semibold text-white truncate">{s.name}</span>
                    </div>
                    <div className="col-span-2 text-center font-mono text-slate-300">
                      {s.matches}
                    </div>
                    <div className="col-span-2 text-center font-mono text-emerald-400 font-bold">
                      {s.wins}
                    </div>
                    <div className="col-span-2 text-right font-mono font-semibold text-slate-200">
                      {winRate}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab: Attendance */}
      {reportTab === 'attendance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-3.5 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Jogador</span>
            <span>Dias Presente</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
            {sortedAttendance.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhum registro histórico de dia encerrado.
              </div>
            ) : (
              sortedAttendance.map(a => (
                <div key={a.id} className="p-3 flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-white">{a.name}</span>
                  <span className="font-mono text-emerald-400 font-bold">{a.presentCount} dia(s)</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: History */}
      {reportTab === 'history' && (
        <div className="space-y-3">
          {matchHistory.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Nenhuma partida finalizada no histórico.
            </div>
          ) : (
            matchHistory.map((m, idx) => (
              <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Partida #{matchHistory.length - idx}</span>
                    {m.durationSeconds !== undefined && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 text-emerald-400 font-semibold"
                        title="Tempo jogado no cronômetro"
                      >
                        <Clock size={11} className="text-emerald-400" />
                        <span>{formatDuration(m.durationSeconds)} jogados</span>
                      </span>
                    )}
                  </div>
                  <span>{m.playedAt}</span>
                </div>

                <div className="flex items-center justify-between py-1 text-sm">
                  <div className={`font-bold ${m.winner === 'A' ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {m.teamA.name} ({m.teamA.score})
                  </div>
                  <span className="text-slate-500 font-mono text-xs">x</span>
                  <div className={`font-bold ${m.winner === 'B' ? 'text-blue-400' : 'text-slate-300'}`}>
                    ({m.teamB.score}) {m.teamB.name}
                  </div>
                </div>

                {m.goals.length > 0 && (
                  <div className="text-[11px] text-slate-400 pt-1 flex flex-wrap gap-1.5">
                    {m.goals.map(g => (
                      <span key={g.id} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        ⚽ {g.playerName || (g.team === 'A' ? m.teamA.name : m.teamB.name)} ({g.minute}')
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
