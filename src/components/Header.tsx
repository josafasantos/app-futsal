import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Square, Settings as SettingsIcon, Download, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { PasswordPromptModal, isSessionUnlocked } from './PasswordPromptModal';
import { ConfirmModal } from './ConfirmModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const Header: React.FC = () => {
  const { state, syncStatus, startDay, endDay } = useApp();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEndDayConfirm, setShowEndDayConfirm] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (PWA installed)
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(checkStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // iOS / generic instructions
      alert('Para instalar no celular:\n\n• No Android/Chrome: use o menu (⋮) e toque em "Instalar aplicativo".\n• No iPhone (Safari): toque no botão Compartilhar (⎋) e selecione "Adicionar à Tela de Início".');
    }
  };

  const handleEndDayClick = () => {
    setShowEndDayConfirm(true);
  };

  const handleOpenSettingsClick = () => {
    if (isSessionUnlocked()) {
      setShowSettings(true);
    } else {
      setShowPasswordPrompt(true);
    }
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPrompt(false);
    setShowSettings(true);
  };

  return (
    <>
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <span className="text-xl">⚽</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base md:text-lg text-white tracking-tight">
                  Na Quadra <span className="text-emerald-400 font-semibold text-xs md:text-sm uppercase tracking-wider bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">Futsal</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Gerenciador de Pelada • {state.settings.teamSize}x{state.settings.teamSize} • {state.settings.matchDurationMinutes} min
              </p>
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center gap-2">
            {/* Install PWA Button (when not already running standalone) */}
            {!isStandalone && (
              <button
                onClick={handleInstallClick}
                className="bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-700/70 text-emerald-300 font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                title="Instalar como aplicativo no celular ou computador"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}

            {/* Cloud Sync Status */}
            {syncStatus === 'synced' && (
              <div
                className="text-[11px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-1 rounded-full flex items-center gap-1.5"
                title="Sincronizado com a nuvem"
              >
                <Cloud size={13} className="text-emerald-400" />
                <span className="hidden md:inline font-medium">Sincronizado</span>
              </div>
            )}
            {syncStatus === 'syncing' && (
              <div
                className="text-[11px] text-amber-400 bg-amber-950/70 border border-amber-800/60 px-2 py-1 rounded-full flex items-center gap-1.5 animate-pulse"
                title="Sincronizando dados..."
              >
                <RefreshCw size={12} className="animate-spin text-amber-400" />
                <span className="hidden md:inline font-medium">Salvando...</span>
              </div>
            )}
            {syncStatus === 'offline' && (
              <div
                className="text-[11px] text-slate-400 bg-slate-800/70 border border-slate-700 px-2 py-1 rounded-full flex items-center gap-1.5"
                title="Operando no modo local"
              >
                <CloudOff size={13} />
                <span className="hidden md:inline font-medium">Offline</span>
              </div>
            )}

            {/* Day Status Badge */}
            <div className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
              state.dayActive
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${state.dayActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="hidden xs:inline">{state.dayActive ? 'Dia Aberto' : 'Dia Fechado'}</span>
            </div>

            {/* Start / End Day buttons */}
            {!state.dayActive ? (
              <button
                onClick={startDay}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Play size={14} />
                <span>Iniciar Dia</span>
              </button>
            ) : (
              <button
                onClick={handleEndDayClick}
                className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 font-medium text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                title="Finalizar o dia de pelada"
              >
                <Square size={13} className="text-rose-400" />
                <span>Finalizar <span className="hidden sm:inline">Dia</span></span>
              </button>
            )}

            {/* Settings button protected by password */}
            <button
              onClick={handleOpenSettingsClick}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              title="Configurações (Requer Senha)"
            >
              <SettingsIcon size={16} />
            </button>
          </div>
        </div>
      </header>

      {showPasswordPrompt && (
        <PasswordPromptModal
          title="Configurações da Pelada"
          description="Informe a senha de administrador para acessar as configurações:"
          onSuccess={handlePasswordSuccess}
          onClose={() => setShowPasswordPrompt(false)}
        />
      )}

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {showEndDayConfirm && (
        <ConfirmModal
          title="Finalizar o Dia?"
          message={`Tem certeza que deseja encerrar o dia de hoje?\n\n• As partidas de hoje serão arquivadas no histórico.\n• As presenças do dia serão consolidadas.\n• A fila e o placar ativo serão limpos.`}
          confirmLabel="Sim, Finalizar Dia"
          cancelLabel="Continuar Jogando"
          isDanger={true}
          onConfirm={endDay}
          onClose={() => setShowEndDayConfirm(false)}
        />
      )}
    </>
  );
};
