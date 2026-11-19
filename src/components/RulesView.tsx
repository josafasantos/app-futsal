import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Check, RotateCcw, Lock } from 'lucide-react';
import { DEFAULT_RULES } from '../utils/domain';
import { PasswordPromptModal, isSessionUnlocked } from './PasswordPromptModal';
import { ConfirmModal } from './ConfirmModal';

export const RulesView: React.FC = () => {
  const { state, updateRules } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [rulesText, setRulesText] = useState(state.rules);

  const handleStartEditClick = () => {
    if (isSessionUnlocked()) {
      setRulesText(state.rules);
      setIsEditing(true);
    } else {
      setShowPasswordPrompt(true);
    }
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPrompt(false);
    setRulesText(state.rules);
    setIsEditing(true);
  };

  const handleSave = () => {
    updateRules(rulesText);
    setIsEditing(false);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmResetRules = () => {
    setRulesText(DEFAULT_RULES);
    updateRules(DEFAULT_RULES);
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 md:pb-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Regras da Pelada</h2>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleReset}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-white rounded-lg text-xs flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={13} />
                  <span>Padrão</span>
                </button>
                <button
                  onClick={handleSave}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Check size={14} />
                  <span>Salvar</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleStartEditClick}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Lock size={13} className="text-emerald-400" />
                <span>Editar Regras</span>
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={rulesText}
            onChange={e => setRulesText(e.target.value)}
            rows={18}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-500 leading-relaxed"
          />
        ) : (
          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {state.rules}
          </div>
        )}
      </div>

      {showPasswordPrompt && (
        <PasswordPromptModal
          title="Editar Regras da Pelada"
          description="Informe a senha para alterar o texto oficial das regras:"
          onSuccess={handlePasswordSuccess}
          onClose={() => setShowPasswordPrompt(false)}
        />
      )}

      {showResetConfirm && (
        <ConfirmModal
          title="Restaurar Regras Padrão"
          message="Deseja restaurar as regras padrão do futsal? Todas as personalizações de texto atuais serão substituídas pelas regras originais."
          confirmLabel="Restaurar"
          cancelLabel="Cancelar"
          isDanger={true}
          onConfirm={confirmResetRules}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
};
