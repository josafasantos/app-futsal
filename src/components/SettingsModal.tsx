import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, RotateCcw, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { state, updateSettings, resetToDemo, clearAllHistories } = useApp();

  const [teamSize, setTeamSize] = useState(state.settings.teamSize);
  const [matchDuration, setMatchDuration] = useState(state.settings.matchDurationMinutes);
  const [maxConsecutive, setMaxConsecutive] = useState(state.settings.maxConsecutiveMatches);

  const [showResetDemoConfirm, setShowResetDemoConfirm] = useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    updateSettings({
      teamSize,
      matchDurationMinutes: matchDuration,
      maxConsecutiveMatches: maxConsecutive
    });
    onClose();
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 id="settings-modal-title" className="font-bold text-white text-base">Configurações da Pelada</h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5 text-sm">
            {/* Team Size */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Jogadores por time na quadra
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[4, 5, 6].map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setTeamSize(size)}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      teamSize === size
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-sm'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-base font-bold text-white">{size} x {size}</div>
                    <div className="text-[11px] text-slate-400">
                      {size === 5 ? 'Padrão futsal' : size === 4 ? 'Quadra pequena' : 'Society/Médio'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Match Duration */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex justify-between">
                <span>Duração da Partida</span>
                <span className="text-emerald-400 font-bold">{matchDuration} minutos</span>
              </label>
              <input
                type="range"
                min={5}
                max={20}
                step={1}
                value={matchDuration}
                onChange={e => setMatchDuration(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>5 min</span>
                <span>10 min (recomendado)</span>
                <span>20 min</span>
              </div>
            </div>

            {/* Max Consecutive Matches */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Limite de permanência em quadra
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[2, 3].map(count => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setMaxConsecutive(count)}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-all ${
                      maxConsecutive === count
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 shadow-sm'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-white">Máximo {count} jogos</div>
                    <div className="text-[11px] text-slate-400">
                      {count === 2 ? 'Regra clássica (sai no 2º)' : 'Revezamento longo'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <button
                type="button"
                onClick={() => setShowResetDemoConfirm(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Restaurar dados de demonstração (Jogadores modelo)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowClearHistoryConfirm(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-900/60 text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <AlertTriangle size={14} />
                <span>Apagar todos os históricos arquivados</span>
              </button>
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
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check size={14} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>

      {showResetDemoConfirm && (
        <ConfirmModal
          title="Restaurar Demonstração"
          message={`Deseja resetar todos os dados para a demonstração inicial?\n\n• Os jogadores serão substituídos pela lista modelo.\n• O dia atual será reiniciado.\n• A fila será zerada.`}
          confirmLabel="Sim, Restaurar"
          cancelLabel="Cancelar"
          isDanger={true}
          onConfirm={() => {
            resetToDemo();
            onClose();
          }}
          onClose={() => setShowResetDemoConfirm(false)}
        />
      )}

      {showClearHistoryConfirm && (
        <ConfirmModal
          title="Apagar Históricos Arquivados"
          message={`Tem certeza que deseja apagar permanentemente todos os registros de partidas anteriores e histórico de presenças?\n\nEsta ação não poderá ser desfeita.`}
          confirmLabel="Sim, Apagar Históricos"
          cancelLabel="Cancelar"
          isDanger={true}
          onConfirm={() => {
            clearAllHistories();
            onClose();
          }}
          onClose={() => setShowClearHistoryConfirm(false)}
        />
      )}
    </>
  );
};
