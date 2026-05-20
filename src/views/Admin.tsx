/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  TrendingUp, 
  Check, 
  X, 
  ArrowLeft, 
  DollarSign, 
  RefreshCw, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  CornerDownRight, 
  LogOut, 
  Sparkles,
  ChevronRight,
  Database,
  Calendar,
  AlertCircle,
  Star,
  ShieldCheck
} from 'lucide-react';
import { db } from '../lib/supabase';
import { Transaction, MissionSubmission, User, Mission } from '../types';

interface AdminProps {
  onLogout: () => void;
  onNavigate: (view: 'dashboard' | 'withdraw' | 'mission_review' | 'admin_login') => void;
}

export default function Admin({ onLogout, onNavigate }: AdminProps) {
  // Database States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [submissions, setSubmissions] = useState<MissionSubmission[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [missionsList, setMissionsList] = useState<Mission[]>([]);
  
  // Tab states: 'overview' | 'withdrawals' | 'missions' | 'database_users' | 'missions_crud' | 'create_mission' | 'change_password'
  const [activeTab, setActiveTab] = useState<'overview' | 'withdrawals' | 'missions' | 'database_users' | 'missions_crud' | 'create_mission' | 'change_password'>('overview');
  
  // Admin credentials modifying states
  const [adminUsernameInput, setAdminUsernameInput] = useState(() => localStorage.getItem('cash_arcoverde_admin_username') || 'admin');
  const [adminPasswordInput, setAdminPasswordInput] = useState(() => localStorage.getItem('cash_arcoverde_admin_password') || 'admin');

  // Micro feedback states
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  
  // Custom feedback inputs for mission validation
  const [adminComments, setAdminComments] = useState<{ [subId: string]: string }>({});

  // Inputs for creating custom missions (crira misao)
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStore, setNewStore] = useState('');
  const [newCategory, setNewCategory] = useState('Lojas da Cidade');
  const [newAmount, setNewAmount] = useState('3.00');
  const [newColor, setNewColor] = useState('from-purple-605 to-indigo-550');

  const handleCreateMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newStore.trim()) {
      alert('Favor preencher os campos com dados válidos.');
      return;
    }
    const valObj = parseFloat(newAmount) || 3.00;
    db.createMission(newTitle, newDescription, newStore, valObj, newCategory, newColor);
    
    // reset form fields
    setNewTitle('');
    setNewDescription('');
    setNewStore('');
    setNewCategory('Lojas da Cidade');
    setNewAmount('3.00');
    setNewColor('from-purple-605 to-indigo-550');
    
    showNotification('success', 'Nova pesquisa criada com sucesso comercial!');
    loadDatabase();
    setActiveTab('missions_crud');
  };

  const handleDeleteMission = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover a pesquisa de "${name}"?`)) {
      db.deleteMission(id);
      loadDatabase();
      showNotification('info', `Pesquisa "${name}" excluída do banco de dados.`);
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir o cadastro de "${name}" do banco de dados?`)) {
      db.deleteUser(id);
      loadDatabase();
      showNotification('info', `Usuário "${name}" foi desvinculado.`);
    }
  };

  // Loaded metadata
  useEffect(() => {
    loadDatabase();
  }, []);

  const loadDatabase = () => {
    const allTxs = db.getTransactions();
    const allSubs = db.getSubmissions();
    const allUsers = db.getUsers();
    const allMissions = db.getMissions();
    
    setTransactions(allTxs);
    setSubmissions(allSubs);
    setUsersList(allUsers);
    setMissionsList(allMissions);
  };

  const showNotification = (type: 'success' | 'info', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Action: Approve PIX Saque
  const handleApproveWithdrawal = (txId: string, amount: number) => {
    db.adminApproveWithdrawal(txId);
    loadDatabase();
    showNotification('success', `Saque PIX de R$ ${amount.toFixed(2)} aprovado e enviado com sucesso!`);
  };

  // Action: Reject PIX Saque
  const handleRejectWithdrawal = (txId: string, amount: number) => {
    db.adminRejectWithdrawal(txId);
    loadDatabase();
    showNotification('info', `Saque de R$ ${amount.toFixed(2)} recusado e estornado.`);
  };

  // Action: Evaluate Comprovante
  const handleEvaluateSub = (subId: string, action: 'approve' | 'reject', cashbackAmount: number, storeName: string) => {
    const comment = adminComments[subId] || '';
    db.adminEvaluateMission(subId, action, comment);
    
    // Clear feedback input
    setAdminComments(prev => {
      const copy = { ...prev };
      delete copy[subId];
      return copy;
    });

    loadDatabase();
    if (action === 'approve') {
      showNotification('success', `Missão aprovada! Cashback de R$ ${cashbackAmount.toFixed(2)} Creditado para o Usuário.`);
    } else {
      showNotification('info', `Envio da loja ${storeName} rejeitado com sucesso.`);
    }
  };

  // Reset to factory mock state for easy evaluation
  const handleResetApplicationData = () => {
    if (window.confirm('Deseja restaurar as transações, saques e missões de teste originais de Arcoverde?')) {
      db.resetData();
      loadDatabase();
      showNotification('success', 'Tabelas do Banco de Dados local redefinidos para o estado original.');
    }
  };

  // Computed values
  const totalVolumeApproved = transactions
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  const cashbackApprovedSum = transactions
    .filter(t => t.type === 'cashback' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const withdrawalsSum = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  // Custom Chart Data: Compute last 5 days transaction values dynamically!
  const getChartData = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data: { label: string; cashback: number; withdrawal: number }[] = [];

    // Let's build metrics for the last 5 days
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStringYmd = d.toISOString().split('T')[0];
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1} (${days[d.getDay()]})`;

      // Filter transactions matching this day
      const dayTxs = transactions.filter(t => {
        const txDate = t.created_at.split('T')[0];
        return txDate === dateStringYmd && t.status === 'completed';
      });

      const dayCashbacks = dayTxs
        .filter(t => t.type === 'cashback')
        .reduce((sum, t) => sum + t.amount, 0);

      const dayWithdrawals = dayTxs
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);

      data.push({
        label: dayLabel,
        cashback: dayCashbacks,
        withdrawal: dayWithdrawals
      });
    }
    return data;
  };

  const chartPoints = getChartData();
  const maxValInChart = Math.max(...chartPoints.map(p => Math.max(p.cashback, p.withdrawal, 10)), 30);

  return (
    <div className="space-y-8 font-sans" id="admin-view">
      {/* Upper Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25">
            <Building className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#10b981]/85">PAINEL DE AUDITORIA</p>
            <h1 className="font-display font-black text-2xl text-white tracking-tight mt-0.5">Auditores Arcoverde</h1>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="btn-nav-citizen"
            onClick={() => onNavigate('dashboard')}
            className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 text-[#10b981]" /> Ir para Carteira
          </button>
          <button
            id="btn-logout"
            onClick={onLogout}
            className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-rose-500/10 hover:border-transparent hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" /> Desconectar
          </button>
        </div>
      </div>

      {/* Slide notification toasts */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border text-xs flex gap-3 items-center shadow-lg ${
              feedbackMsg.type === 'success'
                ? 'bg-[#10b981]/15 border-[#10b981]/20 text-[#10b981]'
                : 'bg-indigo-950/45 border-indigo-500/20 text-indigo-400'
            }`}
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span className="font-mono font-bold">{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
          <div className="p-3.5 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/10">
            <DollarSign className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Cashback Total Pago</p>
            <h3 className="text-xl font-display font-black text-white mt-1 font-mono">
              R$ {cashbackApprovedSum.toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
            <TrendingUp className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Total de Saques PIX</p>
            <h3 className="text-xl font-display font-black text-white mt-1 font-mono">
              R$ {withdrawalsSum.toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-xl font-sans">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/10">
            <Clock className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Pendentes Transferência</p>
            <h3 className="text-xl font-display font-black text-white mt-1 font-mono">
              R$ {pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
          <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10">
            <FileText className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">Auditoria de Missões</p>
            <h3 className="text-xl font-display font-black text-white mt-1 font-mono">
              {pendingSubmissions.length} Pendentes
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-white/5 gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-4 font-display font-black text-xs uppercase tracking-wider border-b-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#10b981] text-[#10b981]'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
          id="tab-overview"
        >
          Painel Resumo
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`py-3 px-4 font-display font-black text-xs uppercase tracking-wider border-b-2 transition-all relative duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            activeTab === 'withdrawals'
              ? 'border-[#10b981] text-[#10b981]'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
          id="tab-withdrawals"
        >
          Aprovação de Saques {pendingWithdrawals.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 rounded bg-[#10b981] text-black text-[9px] font-mono font-black animate-pulse">
              {pendingWithdrawals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`py-3 px-4 font-display font-black text-xs uppercase tracking-wider border-b-2 transition-all relative duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            activeTab === 'missions'
              ? 'border-[#10b981] text-[#10b981]'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
          id="tab-missions"
        >
          Pesquisas Respondidas
        </button>
        <button
          onClick={() => setActiveTab('database_users')}
          className={`py-3 px-4 font-display font-black text-xs uppercase tracking-wider border-b-2 transition-all relative duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            activeTab === 'database_users'
              ? 'border-[#10b981] text-[#10b981]'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
          id="tab-database-users"
        >
          Banco de Dados (Clientes)
        </button>
        <button
          onClick={() => setActiveTab('missions_crud')}
          className={`py-3 px-4 font-display font-black text-xs uppercase tracking-wider border-b-2 transition-all relative duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            activeTab === 'missions_crud'
              ? 'border-[#10b981] text-[#10b981]'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
          id="tab-missions-crud"
        >
          Visualizar Pesquisas
        </button>
        <button
          onClick={() => setActiveTab('create_mission')}
          className={`py-3 px-4 font-display font-black text-xs uppercase tracking-wider border-b-2 transition-all relative duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            activeTab === 'create_mission'
              ? 'border-purple-400 text-purple-400'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
          id="tab-create-mission"
        >
          Criar Pesquisa ✨
        </button>
        <button
          onClick={() => setActiveTab('change_password')}
          className={`py-3 px-4 font-display font-black text-xs uppercase tracking-wider border-b-2 transition-all relative duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            activeTab === 'change_password'
              ? 'border-yellow-400 text-yellow-400'
              : 'border-transparent text-white/40 hover:text-white'
          }`}
          id="tab-change-password"
        >
          Mudar Senha Admin 🔑
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Custom Interactive SVG Chart (Vite / React 19 stable) */}
            <div className="lg:col-span-7 bg-[#111] border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-black text-lg text-white tracking-tight">Fluxo de Transações Ativas</h3>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">Últimos 5 dias de faturamento na cidade</p>
                </div>
                {/* Legend indicator */}
                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full" />
                    <span className="text-white/40">Cashback</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                    <span className="text-white/40">Saques</span>
                  </div>
                </div>
              </div>

              {/* Native SVG Graph Render */}
              <div className="relative pt-2 h-48 w-full select-none" id="custom-svg-chart">
                <svg className="w-full h-full" viewBox="0 0 500 150">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />

                  {/* Left axes markings */}
                  <text x="5" y="25" fill="rgba(255,255,255,0.3)" className="text-[10px] font-mono leading-none" textAnchor="start">
                    R$ {maxValInChart.toFixed(0)}
                  </text>
                  <text x="5" y="75" fill="rgba(255,255,255,0.3)" className="text-[10px] font-mono leading-none" textAnchor="start">
                    R$ {(maxValInChart / 2).toFixed(0)}
                  </text>
                  <text x="5" y="125" fill="rgba(255,255,255,0.3)" className="text-[10px] font-mono leading-none" textAnchor="start">
                    R$ 0
                  </text>

                  {/* Render Columns & Lines */}
                  {chartPoints.map((point, index) => {
                    const xCoord = 50 + index * 100;
                    
                    // Scale values representing height from bottom line (120 px is zero, 20 px is maximum height)
                    const cashbackHeight = (point.cashback / maxValInChart) * 100;
                    const withdrawalHeight = (point.withdrawal / maxValInChart) * 100;

                    const cashbackY = 120 - cashbackHeight;
                    const withdrawalY = 120 - withdrawalHeight;

                    return (
                      <g key={index} className="group">
                        {/* Cashback bar (emerald green) */}
                        <rect
                          x={xCoord - 12}
                          y={cashbackY}
                          width="10"
                          height={Math.max(cashbackHeight, 2)}
                          rx="3"
                          className="fill-[#10b981] hover:fill-[#10b981]/80 cursor-pointer transition-colors"
                        />
                        {/* Tooltip hover tag for Cashback */}
                        <text
                          x={xCoord - 7}
                          y={cashbackY - 4}
                          fill="#10b981"
                          textAnchor="middle"
                          className="text-[9px] font-mono font-bold hidden group-hover:block"
                        >
                          R$ {point.cashback.toFixed(0)}
                        </text>

                        {/* Withdrawal bar (indigo blue) */}
                        <rect
                          x={xCoord + 2}
                          y={withdrawalY}
                          width="10"
                          height={Math.max(withdrawalHeight, 2)}
                          rx="3"
                          className="fill-indigo-550 fill-indigo-500 hover:fill-indigo-400 cursor-pointer transition-colors"
                        />
                        {/* Tooltip hover tag for Withdrawal */}
                        <text
                          x={xCoord + 7}
                          y={withdrawalY - 4}
                          fill="#6366f1"
                          textAnchor="middle"
                          className="text-[9px] font-mono font-bold hidden group-hover:block"
                        >
                          R$ {point.withdrawal.toFixed(0)}
                        </text>

                        {/* Bottom day label */}
                        <text
                          x={xCoord}
                          y="140"
                          fill="rgba(255,255,255,0.4)"
                          textAnchor="middle"
                          className="text-[9px] font-display font-medium font-mono"
                        >
                          {point.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-[10px] font-mono text-white/40">
                <span>Passe o cursor sobre os grids para ver valores exatos.</span>
                <span className="text-[#10b981] font-bold">ARCOVERDE SANDBOX LOG</span>
              </div>
            </div>

            {/* General Log / Analytics Audited Status */}
            <div className="lg:col-span-5 bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4 shadow-xl">
              <div>
                <h3 className="font-display font-black text-lg text-white tracking-tight">Atividades Recentes</h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">Últimos acontecimentos do ecossistema comercial</p>
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {transactions.slice(0, 8).map((t, idx) => (
                  <div key={t.id} className="text-xs flex gap-3 text-white/50 hover:text-white transition-colors">
                    <span className="text-[10px] text-white/30 font-mono mt-0.5">
                      {new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="space-y-1 flex-1 select-none">
                      <p className="font-semibold text-white/80">
                        {t.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-white/30">
                        <span className="uppercase">{t.type}</span>
                        <span>•</span>
                        <span className={`font-bold ${t.type === 'cashback' ? 'text-[#10b981]/80' : 'text-rose-400/80'}`}>
                          R$ {t.amount.toFixed(2)}
                        </span>
                        <span>•</span>
                        <span className="uppercase">{t.status}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {transactions.length === 0 && (
                  <p className="text-center py-6 text-xs text-white/30">Sem atividades registradas.</p>
                )}
              </div>

              {/* Reset Sandbox */}
              <div className="pt-4 border-t border-white/5">
                <button
                  id="btn-factory-reset"
                  onClick={handleResetApplicationData}
                  className="w-full py-2.5 rounded-xl border border-dashed border-rose-500/10 hover:border-rose-500/30 text-rose-400/80 hover:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-mono font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Database className="w-3.5 h-3.5" /> Restaurar Banco de Dados Local
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Panel: PIX withdrawals approval queue */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-5" id="withdrawals-tab-content">
            <div className="flex items-baseline justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-display font-black text-lg text-white tracking-tight">Solicitações de Transferência PIX</h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">Análise e liberação de cashouts para contas pessoais dos usuários</p>
              </div>
              <span className="text-[10px] font-mono text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded">
                {pendingWithdrawals.length} pendentes do lote
              </span>
            </div>

            <div className="space-y-4">
              {pendingWithdrawals.map((w) => (
                <div 
                  key={w.id} 
                  className="p-5 bg-[#111] border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-white/10 transition-all shadow"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[9px] font-mono bg-white/5 text-white/40 px-2 py-0.5 rounded uppercase tracking-wider">
                        ID: {w.id.substring(0, 8)}
                      </span>
                      <span className="text-white/20">•</span>
                      <span className="text-[11px] font-mono text-white/40">
                        {new Date(w.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <h4 className="text-white text-base font-black font-display tracking-tight">{w.description}</h4>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-white/55 font-mono">
                      <span>Destinatário: <b className="text-white font-black text-xs">{w.user_name || "Cidadão de Arcoverde"}</b></span>
                      <span className="text-white/20">|</span>
                      <span>Chave PIX ({w.pix_key_type}): <b className="text-[#10b981]">{w.pix_key}</b></span>
                    </div>
                  </div>

                  {/* Operational Controls side */}
                  <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 md:bg-transparent md:p-0 md:border-0 shrink-0 self-start md:self-center justify-between w-full md:w-auto">
                    <div className="flex flex-col items-start md:items-end">
                      <p className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Valor Transferência</p>
                      <p className="text-xl font-mono font-black text-rose-400 mt-0.5">
                        - R$ {w.amount.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id={`btn-reject-withdraw-${w.id}`}
                        onClick={() => handleRejectWithdrawal(w.id, w.amount)}
                        className="p-2.5 rounded-xl hover:bg-rose-500 hover:text-black hover:scale-105 active:scale-95 text-rose-400 bg-rose-500/10 border border-rose-500/10 hover:border-transparent transition-all duration-200 cursor-pointer"
                        title="Rejeitar Saque PIX"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        id={`btn-approve-withdraw-${w.id}`}
                        onClick={() => handleApproveWithdrawal(w.id, w.amount)}
                        className="py-2.5 px-4 rounded-xl bg-[#10b981] hover:scale-105 hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] active:scale-95 text-black font-black text-xs flex items-center gap-1 cursor-pointer transition-all duration-200 shadow-md shadow-emerald-950/20"
                        title="Aprovar e Liquidar via PIX"
                      >
                        <Check className="w-4 h-4" /> Aprovar Saque
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {pendingWithdrawals.length === 0 && (
                <div className="p-12 text-center bg-[#111] border border-white/5 rounded-2xl" id="no-withdrawals-view">
                  <CheckCircle className="w-10 h-10 text-[#10b981] mx-auto animate-pulse" />
                  <h4 className="font-display font-black text-white mt-3 text-lg tracking-tight">Tudo em Ordem!</h4>
                  <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto leading-relaxed">
                    Não existem requisições de saques PIX pendentes de auditoria para Arcoverde no momento.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Panel: User Feedbacks and Survey reviews verification */}
        {activeTab === 'missions' && (
          <div className="space-y-5" id="missions-tab-content">
            <div className="flex items-baseline justify-between border-b border-white/5 pb-3">
              <div>
                <h3 className="font-display font-black text-lg text-white tracking-tight">Avaliações & Pesquisas Recebidas</h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">Veja a satisfação dos moradores com as lojas físicas parceiras de Arcoverde</p>
              </div>
              <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-1 rounded">
                {submissions.length} avaliações registradas
              </span>
            </div>

            <div className="space-y-5">
              {submissions.map((sub) => (
                <div 
                  key={sub.id}
                  className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all space-y-4"
                  id={`review-item-${sub.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="bg-emerald-500/10 text-[#10b981] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#10b981]/15">
                          PESQUISA ADQUIRIDA
                        </span>
                        <span className="text-[11px] font-mono text-white/40">
                          {new Date(sub.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <h4 className="font-display font-black text-lg text-white mt-2 tracking-tight">
                        {sub.store_name} — <span className="text-white/60 font-medium font-sans text-sm">{sub.mission_title || "Pesquisa Premiada 10 Perguntas"}</span>
                      </h4>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Prêmio Pago</p>
                      <p className="text-lg font-mono font-black text-[#10b981]">
                        R$ 1,00 Pago
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Notes & File representation panel */}
                    <div className="space-y-3 font-sans text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-mono text-white/40 font-bold tracking-wider">Nota / Estrelas</p>
                        <div className="mt-1.5 p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0 border border-white/10 text-yellow-400">
                            <Star className="w-5 h-5 fill-current" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white font-mono">{sub.rating || 5} de 5 Estrelas</p>
                            <p className="text-[9px] text-white/30 uppercase font-mono tracking-wider">Aprovação local</p>
                          </div>
                        </div>
                      </div>

                      {sub.notes && (
                        <div>
                          <p className="text-[10px] uppercase font-mono text-white/40 font-bold tracking-wider">Comentário Sincero do Cliente</p>
                          <p className="mt-1.5 bg-white/5 p-3 rounded-xl border border-white/5 leading-normal text-white/80 italic font-mono">
                            "{sub.notes}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Verification operations panel */}
                    <div className="space-y-3.5 bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-[10px] font-mono text-[#10b981] font-bold uppercase tracking-wider">Controle Administrativo</p>
                      <p className="text-xs text-white/40 leading-relaxed font-sans">
                        Este feedback foi validado mecanicamente pela prefeitura de Arcoverde. O pagamento de R$ 1,00 foi depositado e compensado instantaneamente na carteira sob o regime Sandbox.
                      </p>
                      
                      <div className="pt-2 text-[10px] font-mono text-white/30">
                        Status do crédito: <span className="text-[#10b981] font-bold">Consolidado e Sacável</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {submissions.length === 0 && (
                <div className="p-12 text-center bg-[#111] border border-[#10b981]/15 rounded-2xl" id="no-submissions-view">
                  <CheckCircle className="w-10 h-10 text-[#10b981] mx-auto animate-pulse" />
                  <h4 className="font-display font-black text-white mt-3 text-lg tracking-tight">Fila Prontificada!</h4>
                  <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto leading-relaxed">
                    Nenhuma pesquisa enviada foi gravada no LocalStorage ainda. Realize pesquisas para polir este painel de auditoria.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Banco de Dados de Clientes Panel */}
        {activeTab === 'database_users' && (
          <div className="space-y-6">
            <div className="bg-[#111] border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-display font-black text-xl text-white tracking-tight">Banco de Dados (Clientes Cadastrados)</h3>
                  <p className="text-xs text-white/40 font-mono mt-1">Status de segurança: <span className="text-[#10b981] font-bold">1 Cadastro por celular/IP Ativado</span></p>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10 font-mono text-[11px] font-bold">
                  Total de Contas: {usersList.length}
                </div>
              </div>

              {/* Alert banner for security */}
              <div className="bg-amber-500/10 border border-amber-505/20 text-amber-300 rounded-2xl p-4 text-xs leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block text-amber-200">Enforcamento de IP Ativo (Regra Antifraude)</span>
                  Para assegurar que haja uma distribuição justa de orçamentos, o Cash Arcoverde permite apenas 1 cadastro para cada endereço IP coletado de forma transparente. Se precisar cadastrar um novo usuário de teste no mesmo IP, exclua a conta anterior abaixo.
                </div>
              </div>

              <div className="overflow-x-auto border border-white/5 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 font-mono text-[10px] text-white/40 uppercase tracking-wider">
                      <th className="py-4 px-4 font-black">Cidadão / Nome</th>
                      <th className="py-4 px-4 font-black">Usuário (Username)</th>
                      <th className="py-4 px-4 font-black">Chave PIX Cadastrada</th>
                      <th className="py-4 px-4 font-black">IP da Conexão</th>
                      <th className="py-4 px-4 font-black">Senha de Acesso</th>
                      <th className="py-4 px-4 font-black text-right">Controles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-semibold text-white block text-sm font-sans">{user.name}</span>
                          <span className="text-[10px] text-white/30 font-mono block mt-0.5">{user.id}</span>
                        </td>
                        <td className="py-4 px-4 text-emerald-300 font-bold">
                          @{user.username}
                        </td>
                        <td className="py-4 px-4 text-white/80">
                          {user.pixKey ? (
                            <span className="px-2 py-0.5 rounded bg-white/5 text-[11px] border border-white/10">
                              🔑 {user.pixKey}
                            </span>
                          ) : (
                            <span className="text-white/20 italic">Sem chave cadastrada</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-purple-300">
                          {user.ip || '127.0.0.1'}
                        </td>
                        <td className="py-4 px-4 text-gray-300">
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[11px] font-bold">
                            {user.password || '123'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="bg-red-900/15 text-red-400 hover:bg-red-900/40 border border-red-500/20 rounded-lg px-2.5 py-1 text-[10px] transition-all font-mono font-bold hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            Excluir Registro
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-white/30 italic">
                          Nenhum cliente registrado no banco de dados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Visualizar e Gerenciar Pesquisas (Missions CRUD) Panel */}
        {activeTab === 'missions_crud' && (
          <div className="space-y-6">
            <div className="bg-[#111] border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-display font-black text-xl text-white tracking-tight">Gerenciar Pesquisas Ativas</h3>
                  <p className="text-xs text-white/40 font-mono mt-1">Crie, visualize e remova as campanhas de pesquisa para os moradores de Arcoverde</p>
                </div>
                <button
                  onClick={() => setActiveTab('create_mission')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 shadow"
                >
                  Criar Nova Pesquisa +
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {missionsList.map((mission) => (
                  <div key={mission.id} className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#10b981] to-emerald-500" />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] font-mono text-white/50 border border-white/5 uppercase">
                          {mission.category}
                        </span>
                        <span className="text-xs text-[#10b981] font-mono font-black bg-emerald-500/10 border border-[#10b981]/15 px-2 py-0.5 rounded-lg">
                          Paga R$ {mission.cashback_amount.toFixed(2)}
                        </span>
                      </div>

                      <h4 className="font-display font-black text-white text-base leading-snug group-hover:text-emerald-300 transition-colors">
                        {mission.title}
                      </h4>
                      <p className="text-xs text-white/40 font-mono">
                        Estabelecimento: <span className="text-white font-sans">{mission.store_name}</span>
                      </p>
                      <p className="text-xs text-white/60 font-sans line-clamp-2 leading-relaxed">
                        {mission.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px] font-mono mt-2">
                      <span className="text-white/30">ID: {mission.id}</span>
                      <button
                        onClick={() => handleDeleteMission(mission.id, mission.title)}
                        className="bg-red-900/15 text-red-400 hover:bg-red-900/40 border border-red-500/25 rounded-md px-2.5 py-1.5 transition-all font-mono font-bold hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        Excluir Pesquisa
                      </button>
                    </div>
                  </div>
                ))}
                {missionsList.length === 0 && (
                  <div className="col-span-2 p-12 text-center border border-dashed border-white/10 rounded-2xl">
                    <p className="text-white/40 italic text-xs">Nenhuma pesquisa disponível no momento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Survey (Mission) Tab Panel Form */}
        {activeTab === 'create_mission' && (
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl relative" id="create-mission-form">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <h3 className="font-display font-black text-xl text-white tracking-tight">Cadastrar Nova Pesquisa</h3>
              <p className="text-xs text-white/40 font-mono mt-1">Insira uma nova pesquisa de satisfação para lojistas de Arcoverde</p>
            </div>

            <form onSubmit={handleCreateMissionSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                    Nome do Estabelecimento / Loja
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Farmácia Aliança, Pizzaria do Vale"
                    value={newStore}
                    onChange={(e) => setNewStore(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                    Título da Pesquisa Premiada
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Avaliação de Atendimento Farmácia"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                  Descrição dos Objetivos ou Regras
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Seja descritivo: Diga o que o usuário deve avaliar para se qualificar para o prêmio."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-sans text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                    Categoria da Loja
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-[#10b981] transition-colors"
                  >
                    <option value="Supermercado">Supermercado</option>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Lojas da Cidade">Lojas da Cidade</option>
                    <option value="Combustível">Combustível</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                    Valor Pago (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-[#10b981] font-bold focus:outline-none focus:border-[#10b981] transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                    Gradiente de Negócios (Estilo)
                  </label>
                  <select
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-[#10b981]"
                  >
                    <option value="from-emerald-600 to-teal-600">Esmeralda Mística</option>
                    <option value="from-amber-600 to-orange-500">Pôr do Sol Quente</option>
                    <option value="from-red-600 to-rose-500">Carmesim Rubi</option>
                    <option value="from-yellow-650 to-amber-500">Armazém Amarelo</option>
                    <option value="from-blue-600 to-cyan-500">Azul Oceano</option>
                    <option value="from-purple-600 to-indigo-500">Roxo Crepúsculo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="py-3 px-5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-[#10b981] hover:bg-emerald-405 hover:scale-[1.03] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] active:scale-[0.97] text-black font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow"
                >
                  Confirmar Cadastro da Pesquisa
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Change Administrative Password Panel */}
        {activeTab === 'change_password' && (
          <div className="bg-[#111] border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl relative" id="change-admin-password-panel">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <h3 className="font-display font-black text-xl text-white tracking-tight animate-fade-in">Alterar Credenciais Administrativas</h3>
              <p className="text-xs text-white/40 font-mono mt-1">Mude o usuário e a senha para acessar este portal e protegê-lo de acessos indesejados</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!adminUsernameInput.trim() || !adminPasswordInput.trim()) {
                  alert('Usuário ou senha não podem ficar em branco.');
                  return;
                }
                localStorage.setItem('cash_arcoverde_admin_username', adminUsernameInput.trim());
                localStorage.setItem('cash_arcoverde_admin_password', adminPasswordInput);
                showNotification('success', 'Credenciais administrativas salvas com sucesso absoluto!');
                setActiveTab('overview');
              }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                    Novo Usuário de Login
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: admin"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                  />
                  <span className="text-[10px] text-white/20 font-mono block">Nome usado para acessar o Painel Admin (Padrão: admin)</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                    Nova Senha de Acesso
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sua senha secreta"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-yellow-300 font-bold focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-colors"
                  />
                  <span className="text-[10px] text-white/20 font-mono block">Mantenha anotada esta chave em local seguro (Padrão: admin)</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="py-3 px-5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-3 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-350 hover:scale-[1.03] hover:shadow-[0_4px_25px_rgba(250,204,21,0.35)] active:scale-[0.97] text-black font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow"
                >
                  Salvar Novas Credenciais
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
