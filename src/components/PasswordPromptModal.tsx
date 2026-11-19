import React, { useState, useEffect } from 'react';
import { Lock, X, Check } from 'lucide-react';

interface PasswordPromptModalProps {
  title?: string;
  description?: string;
  onSuccess: () => void;
  onClose: () => void;
}

// SHA-256 hash of the password - prevents plaintext password from appearing in production bundle
const PASSWORD_HASH = 'b87353e9aa90f389c4aee46d773afae9b35ac4e8f8ccc43ec958aab1c5b97650';
const SESSION_AUTH_KEY = 'app_futsal_unlocked_v1';

async function hashString(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const isSessionUnlocked = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setSessionUnlocked = () => {
  try {
    sessionStorage.setItem(SESSION_AUTH_KEY, 'true');
  } catch {
    // ignore
  }
};

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  title = 'Acesso Restrito',
  description = 'Informe a senha para continuar:',
  onSuccess,
  onClose
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const computedHash = await hashString(password.trim());
      if (computedHash === PASSWORD_HASH) {
        setError(false);
        setSessionUnlocked();
        onSuccess();
      } else {
        setError(true);
        setPassword('');
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-prompt-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-emerald-400" />
            <h2 id="password-prompt-title" className="font-bold text-white text-base">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-300">{description}</p>

          <div>
            <input
              type="password"
              placeholder="Digite a senha..."
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              autoFocus
              className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                error
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-emerald-500'
              }`}
            />
            {error && (
              <p className="text-xs text-rose-400 mt-1.5 font-medium">
                Senha incorreta. Tente novamente.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check size={14} />
              <span>{loading ? 'Verificando...' : 'Confirmar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
