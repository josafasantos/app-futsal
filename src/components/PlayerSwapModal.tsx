import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, ArrowLeftRight, Check } from 'lucide-react';

interface PlayerSwapModalProps {
  onClose: () => void;
}

export const PlayerSwapModal: React.FC<PlayerSwapModalProps> = ({ onClose }) => {
  const { state, swapPlayers } = useApp();
  const match = state.currentMatch;

  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!match) return null;

  const handleConfirmSwap = () => {
    if (!selectedA || !selectedB) return;
    swapPlayers(selectedA, selectedB);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-swap-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-emerald-400" />
            <h2 id="player-swap-title" className="font-bold text-white text-base">Trocar Jogadores de Time</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          <p className="text-slate-400">
            Selecione um jogador de cada time para realizar a troca direta mantendo a contagem e os placares.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Team A List */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <h3 className="font-semibold text-slate-200 mb-2 truncate">{match.teamA.name}</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {match.teamA.playerIds.map(id => {
                  const player = state.players[id];
                  const isSelected = selectedA === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedA(id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate">{player?.name || id}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team B List */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <h3 className="font-semibold text-slate-200 mb-2 truncate">{match.teamB.name}</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {match.teamB.playerIds.map(id => {
                  const player = state.players[id];
                  const isSelected = selectedB === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedB(id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="truncate">{player?.name || id}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 hover:text-white font-medium text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!selectedA || !selectedB}
            onClick={handleConfirmSwap}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Check size={14} />
            <span>Confirmar Troca</span>
          </button>
        </div>
      </div>
    </div>
  );
};
