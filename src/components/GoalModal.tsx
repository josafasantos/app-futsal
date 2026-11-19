import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, HelpCircle } from 'lucide-react';

interface GoalModalProps {
  team: 'A' | 'B';
  onClose: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({ team, onClose }) => {
  const { state, addGoal } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const match = state.currentMatch;
  if (!match) return null;

  const targetTeam = team === 'A' ? match.teamA : match.teamB;
  const isRed = targetTeam.name.toLowerCase().includes('vermelh') || (team === 'B' && !targetTeam.name.toLowerCase().includes('azul'));

  const handleSelectPlayer = (playerId?: string) => {
    addGoal(team, playerId);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3.5 h-3.5 rounded-full ${isRed ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-blue-500 shadow-sm shadow-blue-500/50'}`} />
            <h2 id="goal-modal-title" className="font-bold text-white text-base">
              Gol do <span className={isRed ? 'text-rose-400' : 'text-blue-400'}>{targetTeam.name}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-400">
            Quem marcou o gol? (Opcional — contabiliza para o ranking de artilharia)
          </p>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {targetTeam.playerIds.map(id => {
              const player = state.players[id];
              return (
                <button
                  key={id}
                  onClick={() => handleSelectPlayer(id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-200 font-medium text-sm flex items-center justify-between transition-colors group ${
                    isRed
                      ? 'hover:bg-rose-950/60 hover:border-rose-700/60 hover:text-rose-200'
                      : 'hover:bg-blue-950/60 hover:border-blue-700/60 hover:text-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-white ${
                      isRed ? 'group-hover:bg-rose-800' : 'group-hover:bg-blue-800'
                    }`}>
                      ⚽
                    </span>
                    <span>{player?.name || id}</span>
                    {player?.nickname && (
                      <span className="text-xs text-slate-400">({player.nickname})</span>
                    )}
                  </div>
                  <span className={`text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${
                    isRed ? 'text-rose-400' : 'text-blue-400'
                  }`}>
                    Confirmar
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleSelectPlayer(undefined)}
            className="w-full mt-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <HelpCircle size={15} />
            <span>Gol Anônimo / Contra (apenas somar placar)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
