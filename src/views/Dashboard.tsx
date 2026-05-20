/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  Check, 
  AlertCircle,
  ShoppingBag,
  Utensils,
  PlusCircle,
  HelpCircle,
  Droplet,
  Coffee,
  Activity,
  ChevronRight,
  Gift,
  Building,
  DollarSign,
  Lock,
  Clock,
  ThumbsUp,
  Award
} from 'lucide-react';
import { db } from '../lib/supabase';
import { Mission, Transaction } from '../types';

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'withdraw' | 'mission_review' | 'admin_login') => void;
  onOpenRules: (mission: Mission) => void;
}

export default function Dashboard({ onNavigate, onOpenRules }: DashboardProps) {
  const [balance, setBalance] = useState<number>(0);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [surveyCooldowns, setSurveyCooldowns] = useState<Record<string, string>>({});
  
  // Accumulated Stats
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);

  useEffect(() => {
    loadData();

    // Setup active countdown update interval
    const countdownInterval = setInterval(() => {
      setSurveyCooldowns(db.getSurveyCooldowns());
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  const loadData = () => {
    const currentBalance = db.getWalletBalance();
    const currentMissions = db.getMissions();
    const allTxs = db.getTransactions();
    const completedSurveys = db.getSubmissions().filter(s => s.status === 'completed');
    
    setBalance(currentBalance);
    setMissions(currentMissions);
    setRecentTransactions(allTxs.slice(0, 4));
    setSurveyCooldowns(db.getSurveyCooldowns());
    setAnsweredCount(completedSurveys.length);
    
    // Accumulate actual cashback values instead of assuming a flat R$1.00
    const calculatedEarned = completedSurveys.reduce((acc, curr) => acc + (curr.cashback_amount || 0), 0);
    setTotalEarned(calculatedEarned);
  };

  const getCooldownText = (missionId: string): string | null => {
    const limitStr = surveyCooldowns[missionId];
    if (!limitStr) return null;
    const remainingMs = new Date(limitStr).getTime() - Date.now();
    if (remainingMs <= 0) return null;

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((remainingMs % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'alimentação':
        return <Utensils className="w-4 h-4 text-emerald-400" />;
      case 'supermercado':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'saúde':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'combustível':
        return <Droplet className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
    }
  };

  const regularMissions = missions.filter(m => !m.is_premium);
  const premiumMissions = missions.filter(m => m.is_premium);

  const targetThreshold = 1.00;
  const progressPercent = Math.min(100, (balance / targetThreshold) * 100);
  const isRedeemable = balance >= targetThreshold;

  return (
    <div className="space-y-8 font-sans" id="dashboard-view">
      
      {/* Visual Header Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono text-[#10b981] font-bold tracking-widest uppercase bg-[#10b981]/15 border border-[#10b981]/20 px-3 py-1 rounded-full">
            Painel Sincronizado do Cidadão
          </span>
          <h1 className="font-display font-black text-3xl md:text-4xl text-white tracking-tight mt-2.5">
            Pesquisas Premiadas <span className="text-[#10b981]">Cash Arcoverde</span>
          </h1>
          <p className="text-white/40 text-xs mt-1 font-sans">
            Cada pesquisa respondida paga o valor indicado direto na sua conta. Acumule até completar o saldo mínimo para resgatar.
          </p>
        </div>
      </div>

      {/* Main Two-Column Master Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: WALLET ACCUMULATOR & PROGRESS BAR */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Gold coin balance indicator (matches VoceOpina aesthetic) */}
            <div className="flex items-center gap-4.5 mb-5">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)] shrink-0">
                <span className="text-amber-500 font-display font-black text-2xl select-none">$</span>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white font-mono">
                    R$ {balance.toFixed(2)}
                  </span>
                  <span className="text-xs text-white/40 font-mono">
                    / R$ {targetThreshold.toFixed(2)}
                  </span>
                </div>
                <p className="text-[9px] font-mono text-white/40 tracking-wider uppercase font-black">Saldo acumulado</p>
              </div>
            </div>

            {/* Slider progress bar */}
            <div className="space-y-2">
              <div className="h-3.5 w-full bg-white/5 border border-white/5 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-[#10b981] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-white/30">
                <span>R$ 0,00</span>
                <span>R$ {targetThreshold.toFixed(2)} Meta de Saque</span>
              </div>
            </div>

            {/* Centered Large Trigger button */}
            <div className="pt-6">
              <button
                id="btn-withdraw-dashboard"
                onClick={() => onNavigate('withdraw')}
                disabled={!isRedeemable}
                className={`w-full py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 duration-300 ${
                  isRedeemable
                    ? 'bg-[#10b981] hover:bg-[#10b981]/90 hover:scale-[1.03] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] active:scale-[0.97] text-black shadow-[0_4px_20px_rgba(16,185,129,0.3)] cursor-pointer'
                    : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                <DollarSign className="w-4 h-4 stroke-[3px]" /> Resgatar Saldo
              </button>
            </div>

            {/* Terms sub-info */}
            <p className="text-[10px] text-white/40 leading-relaxed font-sans mt-4 text-center border-t border-white/5 pt-4">
              Sua conta deve ter pelo menos <b className="text-white">R$ {targetThreshold.toFixed(2)}</b> de saldo para que você resgate o valor real imediatamente via PIX.
            </p>
          </div>

          {/* Mini Rewards Tiers Table */}
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#10b981]">Métodos de Envio Disponíveis</h4>
            
            <div className="space-y-3">
              <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-white">💰 Transferência PIX Imediata</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Saque via PIX sem tarifas</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-black text-emerald-400">R$ 1,00 +</p>
                  <p className="text-[8px] text-white/30 font-mono">Disponível</p>
                </div>
              </div>

              <div className="p-3.5 bg-white/[0.02] border border-white/[0.02] rounded-2xl flex items-center justify-between opacity-60">
                <div>
                  <p className="font-bold text-xs text-white">💳 Cupom Comercial local</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Vale-compras no Bonanza</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-black text-rose-400">R$ 5,00</p>
                  <p className="text-[8px] text-white/30 font-mono">Requer Saldo</p>
                </div>
              </div>

              <div className="p-3.5 bg-white/[0.02] border border-white/[0.02] rounded-2xl flex items-center justify-between opacity-60">
                <div>
                  <p className="font-bold text-xs text-white">🛍️ Vale-Presente Arcoverde</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Lojas do Centro unificadas</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-black text-rose-400">R$ 10,00</p>
                  <p className="text-[8px] text-white/30 font-mono">Requer Saldo</p>
                </div>
              </div>
            </div>
          </div>

          {/* User activity log of wallet */}
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-baseline border-b border-white/5 pb-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#10b981]">Registro de Atividades</h3>
              <span className="text-[9px] font-mono text-white/30 uppercase">Local-First</span>
            </div>

            <div className="space-y-3" id="transactions-list">
              {recentTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="p-3 bg-white/5 border border-white/[0.02] rounded-xl flex items-center justify-between gap-2.5 transition-colors"
                  id={`tx-row-${tx.id}`}
                >
                  <div className="min-w-0">
                    <h5 className="text-[11px] font-bold text-white truncate">{tx.description}</h5>
                    <p className="text-[9px] font-mono text-white/30 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-black font-mono ${
                      tx.type === 'cashback' ? 'text-[#10b981]' : 'text-rose-455'
                    }`}>
                      {tx.type === 'cashback' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                    </p>
                    <span className="text-[8px] font-mono text-white/30 uppercase">
                      {tx.status === 'completed' ? 'Faturado' : tx.status === 'pending' ? 'Análise' : 'Recusado'}
                    </span>
                  </div>
                </div>
              ))}

              {recentTransactions.length === 0 && (
                <div className="p-4 text-center text-white/30 font-mono text-[10px] leading-relaxed">
                  Avalie as lojas disponíveis para faturar e acumular saldo de resgate!
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: DISCOVER & PREMIUM GRIDS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Regular available surveys (0.10 and 0.02) */}
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-white/5 pb-3.5">
              <div>
                <h2 className="font-display font-black text-2xl text-white tracking-tight">Pesquisas Disponíveis</h2>
                <p className="text-white/30 text-xs mt-0.5">Faça avaliações rápidas para somar centavos até completar a meta de R$ 1,00!</p>
              </div>
              <span className="text-[10px] font-mono bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded-full uppercase">
                {regularMissions.length} pesquisas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="regular-missions-grid">
              {regularMissions.map((mission, index) => {
                const cooldownText = getCooldownText(mission.id);
                const isLocked = cooldownText !== null;

                return (
                  <div
                    key={mission.id}
                    className={`bg-[#111] border rounded-2xl overflow-hidden hover:shadow-2xl transition-all flex flex-col justify-between group h-full relative ${
                      isLocked 
                        ? 'border-white/[0.02] opacity-75' 
                        : 'border-white/5 hover:border-[#10b981]/30'
                    }`}
                    id={`mission-card-${mission.id}`}
                  >
                    
                    {/* Header info */}
                    <div className="p-4 bg-white/[0.02] border-b border-white/5 flex justify-between items-center text-[10px] font-mono">
                      <div className="bg-black/30 border border-white/5 px-2 py-0.5 rounded text-white/50 flex items-center gap-1">
                        {getCategoryIcon(mission.category)}
                        {mission.category}
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/25 px-2 py-0.5 rounded">
                        Ganhe R$ {mission.cashback_amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
                      <div>
                        <h3 className="font-display font-bold text-sm text-white group-hover:text-[#10b981] transition-colors">
                          {mission.title}
                        </h3>
                        <p className="text-[#10b981]/70 font-mono text-[10.5px] mt-1 font-bold">{mission.store_name}</p>
                        <p className="text-xs text-white/45 leading-relaxed mt-2.5 line-clamp-2">
                          {mission.description}
                        </p>
                      </div>

                      <div className="pt-3.5 border-t border-white/[0.03] flex justify-between items-center gap-3">
                        <button
                          onClick={() => onOpenRules(mission)}
                          className="py-1 px-2.5 rounded bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95 text-white/60 hover:text-white text-[10px] font-mono border border-white/5 transition-all duration-200 cursor-pointer"
                        >
                          Mais Info
                        </button>

                        {isLocked ? (
                          <div className="py-1 px-2.5 rounded bg-[#222] text-amber-500 font-mono text-[10px] font-bold border border-amber-500/10 flex items-center gap-1 shrink-0 select-none">
                            <Clock className="w-3.5 h-3.5 animate-pulse" /> {cooldownText}
                          </div>
                        ) : (
                          <button
                            id={`btn-complete-${mission.id}`}
                            onClick={() => {
                              localStorage.setItem('active_survey_mission_id', mission.id);
                              onNavigate('mission_review');
                            }}
                            className="py-1.5 px-3 rounded bg-emerald-500/10 hover:bg-[#10b981] text-emerald-400 hover:text-black font-black text-[10px] transition-all duration-200 cursor-pointer border border-emerald-500/20 hover:border-transparent hover:scale-105 active:scale-95 uppercase tracking-wider font-mono flex items-center gap-1 shrink-0"
                          >
                            Responder <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Premium blocked surveys (Paying R$ 3.00) with 6h lock */}
          <div className="space-y-5 pt-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-3.5">
              <div>
                <h2 className="font-display font-black text-2xl text-white tracking-tight flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400 shrink-0" />
                  Pesquisas Promo Premium (<span className="text-purple-400">Bloqueadas</span>)
                </h2>
                <p className="text-white/30 text-xs mt-0.5">Complete o cadastro e aguarde o cronograma de 6 horas para liberar estas pesquisas de R$ 3,00!</p>
              </div>
              <span className="text-[10px] font-mono bg-purple-950/20 border border-purple-500/20 text-purple-400 px-2.5 py-1 rounded-full uppercase font-bold">
                PROMO ATIVA
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="premium-locked-missions-grid">
              {premiumMissions.map((mission, index) => {
                const cooldownText = getCooldownText(mission.id);
                const isLocked = cooldownText !== null;

                return (
                  <div
                    key={mission.id}
                    className={`bg-indigo-950/10 border transition-all duration-350 rounded-2xl overflow-hidden relative group flex flex-col justify-between h-full ${
                      isLocked ? 'border-purple-900/15 opacity-85' : 'border-purple-500/35 hover:border-purple-400 shadow-lg shadow-purple-950/10 hover:shadow-purple-950/30'
                    }`}
                    id={`mission-card-${mission.id}`}
                  >
                    
                    {/* Visual premium overlay lock screen */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-20">
                        <div className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-1.5 rounded-full">
                          <Lock className="w-4 h-4 animate-pulse" />
                        </div>
                        <p className="text-[11px] font-black text-purple-400 uppercase tracking-wider font-mono">Promo Bloqueada</p>
                        <p className="text-[9px] text-white/40 mt-0.5 max-w-[200px]">Libera automaticamente em 6h ou pule a espera:</p>
                        
                        {/* Live Ticking Cooldown countdown */}
                        <span className="mt-2 px-2.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono text-[10px] font-black rounded-lg tracking-wider flex items-center gap-1">
                          <Clock className="w-3 h-3 text-purple-400" /> {cooldownText || "06:00:00"}
                        </span>

                        {/* Bypass/unlock button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            db.removeSurveyCooldown(mission.id);
                            loadData();
                          }}
                          className="mt-3.5 px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-450 hover:scale-[1.03] active:scale-95 text-black font-mono text-[9px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-lg shadow-purple-500/20 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300 animate-spin" /> Liberar Pesquisa R$ 3,00
                        </button>
                      </div>
                    )}

                    {/* Background card layout */}
                    <div className="p-4 bg-purple-950/15 border-b border-white/[0.03] flex justify-between items-center text-[10px] font-mono select-none">
                      <div className="bg-black/30 border border-white/5 px-2 py-0.5 rounded text-white/40">
                        {mission.store_name}
                      </div>
                      <span className="bg-purple-500/15 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-bold">
                        R$ {mission.cashback_amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4 select-none">
                      <div>
                        <h3 className="font-display font-bold text-sm text-white/80 group-hover:text-purple-400 transition-colors">
                          {mission.title}
                        </h3>
                        <p className="text-white/35 text-xs mt-2 line-clamp-2">
                          {mission.description}
                        </p>
                      </div>

                      <div className="pt-3.5 border-t border-white/[0.02] flex justify-between items-center">
                        <span className="text-[10px] font-mono text-purple-400/70 uppercase tracking-wider font-bold">Super Cashback!</span>
                        <button
                          onClick={() => {
                            localStorage.setItem('active_survey_mission_id', mission.id);
                            onNavigate('mission_review');
                          }}
                          className="py-1 px-2.5 rounded bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-black font-black text-[10px] transition-all duration-200 cursor-pointer border border-purple-500/20 hover:border-transparent hover:scale-105 active:scale-95 uppercase tracking-wider font-mono flex items-center gap-1 shrink-0"
                        >
                          Responder <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
