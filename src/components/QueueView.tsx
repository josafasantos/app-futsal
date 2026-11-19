import React from 'react';
import { useApp } from '../context/AppContext';
import { ArrowDown, Users, AlertCircle, Flame } from 'lucide-react';

export const QueueView: React.FC = () => {
  const { state, deferPlayerInQueue } = useApp();
  const teamSize = state.settings.teamSize;
  const queue = state.queue;

  const nextTeam = queue.slice(0, teamSize);
  const remainingQueue = queue.slice(teamSize);

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20 md:pb-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-emerald-400" />
            <span>Fila de Espera da Quadra</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Os próximos <span className="text-emerald-400 font-semibold">{teamSize}</span> formam o time que entra na próxima partida.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">{queue.length}</div>
          <div className="text-[11px] text-slate-400">na fila</div>
        </div>
      </div>

      {/* Priority Legend */}
      <div className="bg-slate-950/70 border border-slate-800/60 rounded-xl px-3.5 py-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
        <span className="font-semibold text-slate-300">Prioridade:</span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>1ª Partida (entra na frente de quem já jogou)</span>
        </span>
        <span className="flex items-center gap-1 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>Já jogou (rodízio normal)</span>
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm text-slate-400">Nenhum jogador aguardando na fila no momento.</p>
          <p className="text-xs text-slate-500">
            {state.presentPlayers.length > 0
              ? 'Todos os presentes estão em quadra.'
              : 'Faça o check-in dos jogadores na aba Presença.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Next Team Section */}
          <div className="bg-slate-900 border border-emerald-900/60 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-2xl pointer-events-none rounded-full" />

            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-amber-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Próximo Time a Entrar ({nextTeam.length}/{teamSize})
                </h3>
              </div>
              {nextTeam.length < teamSize && (
                <span className="text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <AlertCircle size={11} />
                  <span>Incompleto</span>
                </span>
              )}
            </div>

            <div className="space-y-2">
              {nextTeam.map((id, index) => {
                const player = state.players[id];
                const hasPlayed = state.hasPlayedToday.includes(id);

                return (
                  <div
                    key={id}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-xs">
                        {index + 1}
                      </span>
                      <div className="font-semibold text-white">
                        {player?.name || id}
                        {player?.nickname && (
                          <span className="text-xs text-slate-400 ml-1.5 font-normal">
                            ({player.nickname})
                          </span>
                        )}
                      </div>
                      {!hasPlayed && (
                        <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-full font-semibold">
                          1ª Partida
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => deferPlayerInQueue(id)}
                      title="Adiar vez (mandar para o fim da fila)"
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
                    >
                      <ArrowDown size={14} />
                      <span className="hidden sm:inline text-[11px]">Fim da fila</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remaining Queue Section */}
          {remainingQueue.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
              <h3 className="font-bold text-slate-300 text-xs sm:text-sm uppercase tracking-wider mb-3">
                Aguardando Próximas Rodadas ({remainingQueue.length})
              </h3>

              <div className="space-y-1.5">
                {remainingQueue.map((id, index) => {
                  const player = state.players[id];
                  const hasPlayed = state.hasPlayedToday.includes(id);
                  const queuePosition = teamSize + index + 1;

                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[11px]">
                          {queuePosition}
                        </span>
                        <span className="font-medium text-slate-300">
                          {player?.name || id}
                          {player?.nickname && (
                            <span className="text-slate-400 ml-1">({player.nickname})</span>
                          )}
                        </span>
                        {!hasPlayed && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            1ª Partida
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => deferPlayerInQueue(id)}
                        title="Mandar para o fim da fila"
                        className="p-1 text-slate-400 hover:text-amber-400 rounded transition-colors"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
