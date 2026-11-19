import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  UserCheck,
  Users,
  Search,
  Check,
  Edit2,
  Trash2,
  EyeOff,
  Eye,
  Plus,
  X,
  Lock
} from 'lucide-react';
import { PasswordPromptModal, isSessionUnlocked } from './PasswordPromptModal';
import { ConfirmModal } from './ConfirmModal';

export const PresenceView: React.FC = () => {
  const {
    state,
    registerPlayer,
    editPlayer,
    togglePlayerInactive,
    deletePlayer,
    checkInPlayer,
    removePresence
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showManageModal, setShowManageModal] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNickname, setNewPlayerNickname] = useState('');

  // Editing state inside manage modal
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [playerToDelete, setPlayerToDelete] = useState<{ id: string; name: string } | null>(null);

  const presentCount = state.presentPlayers.length;
  const allPlayers = Object.values(state.players);
  const activePlayersCount = allPlayers.filter(p => !p.inactive).length;

  const handleOpenManageClick = () => {
    if (isSessionUnlocked()) {
      setShowManageModal(true);
    } else {
      setShowPasswordPrompt(true);
    }
  };

  const handlePasswordSuccess = () => {
    setShowPasswordPrompt(false);
    setShowManageModal(true);
  };

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    registerPlayer(newPlayerName, newPlayerNickname);
    setNewPlayerName('');
    setNewPlayerNickname('');
  };

  const handleStartEdit = (id: string, name: string, nickname?: string) => {
    setEditingId(id);
    setEditName(name);
    setEditNickname(nickname || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    editPlayer(id, editName, editNickname);
    setEditingId(null);
  };

  // Filter player list
  const filteredPlayers = allPlayers.filter(player => {
    if (player.inactive && activeTabFilter !== 'all') return false;

    // Search filter
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.nickname && player.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    const isPresent = state.presentPlayers.some(p => p.id === player.id);

    if (activeTabFilter === 'present') return isPresent;
    if (activeTabFilter === 'absent') return !isPresent;

    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20 md:pb-6">
      {/* Presence Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <UserCheck size={18} className="text-emerald-400" />
              <span>Presença na Quadra</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {state.dayActive
                ? 'Marque quem chegou no local para entrar no sorteio e na fila da quadra.'
                : 'Inicie o dia para começar a registrar a presença dos jogadores.'}
            </p>
          </div>

          <button
            onClick={handleOpenManageClick}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Lock size={13} className="text-emerald-400" />
            <span>Cadastros & Jogadores</span>
          </button>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-950/70 border border-emerald-900/50 p-3 rounded-xl text-center">
            <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Presentes na Quadra</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">
              {presentCount}
            </div>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-center">
            <div className="text-xs text-slate-400 font-medium">Jogadores Cadastrados</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-300 mt-1">
              {activePlayersCount}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar jogador por nome ou apelido..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'all' as const, label: 'Todos' },
            { id: 'present' as const, label: `Presentes (${presentCount})` },
            { id: 'absent' as const, label: 'Ausentes' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveTabFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTabFilter === f.id
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Players List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
          <span>Jogador</span>
          <span>Presença</span>
        </div>

        <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
          {filteredPlayers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum jogador encontrado.
            </div>
          ) : (
            filteredPlayers.map(player => {
              const isPresent = state.presentPlayers.some(p => p.id === player.id);

              return (
                <div
                  key={player.id}
                  className="p-3 flex items-center justify-between gap-2 hover:bg-slate-800/40 transition-colors text-xs sm:text-sm"
                >
                  {/* Name and Tags */}
                  <div className="flex items-center gap-3 truncate">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isPresent
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-white truncate flex items-center gap-1.5">
                        <span>{player.name}</span>
                        {player.nickname && (
                          <span className="text-xs text-slate-400 font-normal">({player.nickname})</span>
                        )}
                        {player.inactive && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isPresent ? (
                          <span className="text-emerald-400 font-medium">✓ Presente na quadra</span>
                        ) : (
                          <span>Ainda não chegou</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isPresent ? (
                      <button
                        onClick={() => removePresence(player.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/70 border border-emerald-800 text-emerald-300 hover:bg-rose-950/70 hover:border-rose-800 hover:text-rose-300 transition-colors"
                        title="Clique para retirar presença"
                      >
                        ✓ Presente
                      </button>
                    ) : (
                      <button
                        onClick={() => checkInPlayer(player.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors flex items-center gap-1"
                      >
                        <Check size={13} />
                        <span>Chegou</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Gerenciar Cadastros */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Users size={18} className="text-emerald-400" />
                <span>Cadastros de Jogadores</span>
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {/* Form Add New Player */}
              <form onSubmit={handleCreatePlayer} className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  + Cadastrar Novo Jogador
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome completo ou 1º nome"
                    value={newPlayerName}
                    onChange={e => setNewPlayerName(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Apelido na quadra (opcional)"
                    value={newPlayerNickname}
                    onChange={e => setNewPlayerNickname(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Salvar Cadastro</span>
                </button>
              </form>

              {/* Existing Players List */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Jogadores Cadastrados ({allPlayers.length})
                </h4>
                {allPlayers.map(p => {
                  const isEditing = editingId === p.id;

                  if (isEditing) {
                    return (
                      <div key={p.id} className="p-2.5 bg-slate-800/80 border border-emerald-600/60 rounded-xl space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                          />
                          <input
                            type="text"
                            value={editNickname}
                            placeholder="Apelido"
                            onChange={e => setEditNickname(e.target.value)}
                            className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 text-slate-400 hover:text-white"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded font-semibold"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={p.id}
                      className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <span className={`font-semibold ${p.inactive ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {p.name}
                        </span>
                        {p.nickname && <span className="text-slate-400 ml-1">({p.nickname})</span>}
                        {p.inactive && <span className="ml-1 text-[10px] text-amber-500">(Inativo)</span>}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(p.id, p.name, p.nickname)}
                          title="Editar cadastro"
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => togglePlayerInactive(p.id)}
                          title={p.inactive ? 'Reativar jogador' : 'Inativar jogador'}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                        >
                          {p.inactive ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <button
                          onClick={() => setPlayerToDelete({ id: p.id, name: p.name })}
                          title="Excluir cadastro"
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowManageModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordPrompt && (
        <PasswordPromptModal
          title="Cadastros de Jogadores"
          description="Informe a senha para gerenciar ou cadastrar jogadores:"
          onSuccess={handlePasswordSuccess}
          onClose={() => setShowPasswordPrompt(false)}
        />
      )}

      {playerToDelete && (
        <ConfirmModal
          title="Excluir Jogador"
          message={`Deseja realmente excluir permanentemente o cadastro de "${playerToDelete.name}"?\n\nEsta ação removerá o jogador da lista geral.`}
          confirmLabel="Excluir"
          cancelLabel="Cancelar"
          isDanger={true}
          onConfirm={() => {
            deletePlayer(playerToDelete.id);
            setPlayerToDelete(null);
          }}
          onClose={() => setPlayerToDelete(null)}
        />
      )}
    </div>
  );
};
