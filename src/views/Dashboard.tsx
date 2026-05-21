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
  
  const [cooldownData, setCooldownData] = useState<{ onCooldown: boolean; remainingMs?: number }>({ onCooldown: false });
  
  // Accumulated Stats
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [totalEarned, setTotalEarned] = useState<number>(0);

  useEffect(() => {
    loadData();

    // Setup active countdown update interval
    const countdownInterval = setInterval(() => {
      setCooldownData(db.isUserOnCooldown());
    }, 1000);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cash_arcoverde_missions') {
        loadData();
      }
    };

    // Setup event listener for real-time mission updates
    window.addEventListener('missions_updated', loadData);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(countdownInterval);
      window.removeEventListener('missions_updated', loadData);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadData = () => {
    const currentBalance = db.getWalletBalance();
    const currentMissions = db.getMissions();
    const allTxs = db.getTransactions();
    const completedSurveys = db.getSubmissions().filter(s => s.status === 'completed');
    
    setBalance(currentBalance);
    setMissions(currentMissions);
    setRecentTransactions(allTxs.slice(0, 4));
    setCooldownData(db.isUserOnCooldown());
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

  const regularMissions = missions.filter(m => !m.is_premium).slice(0, 10);
  const premiumMissions = missions.filter(m => m.is_premium).slice(0, 10);

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
                const isLocked = cooldownData.onCooldown || balance >= 1.0;

                const getImageUrl = (storeName: string) => {
                  if (storeName.includes('Bonanza')) return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600&h=300';
                  if (storeName.includes('Atacarejo')) return 'https://images.unsplash.com/photo-1583258298656-9a259c98bb0a?auto=format&fit=crop&q=80&w=600&h=300';
                  if (storeName.includes('Shell')) return 'https://images.unsplash.com/photo-1590481062970-13f56d0ea47f?auto=format&fit=crop&q=80&w=600&h=300';
                  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600&h=300';
                };

                return (
                  <div
                    key={mission.id}
                    className={`bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative ${
                      isLocked 
                        ? 'opacity-60' 
                        : 'hover:border-emerald-200'
                    }`}
                    id={`mission-card-${mission.id}`}
                  >
                    
                    {/* Mission Image */}
                    <img 
                      src={mission.image_url || getImageUrl(mission.store_name)} 
                      alt={mission.title}
                      className="w-full h-40 object-cover"
                    />

                    <div className="p-6 flex flex-col flex-1 gap-3">
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                        {mission.category}
                      </div>

                      <h3 className="font-display font-bold text-xl text-gray-900 group-hover:text-[#10b981] transition-colors leading-tight">
                        {mission.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                        <Check className="w-4 h-4" />
                        Recompensa Total: R$ {mission.cashback_amount.toFixed(2)}
                      </div>

                      <div className="mt-auto pt-4">
                        {isLocked ? (
                          <div className="w-full py-4 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm flex items-center justify-center gap-2 select-none">
                            <Clock className="w-5 h-5 animate-pulse" /> 
                            {balance >= 1.0 ? "Saldo atingido! Saque para continuar." : (() => {
                              const ms = cooldownData.remainingMs || 0;
                              const h = Math.floor(ms / (1000 * 60 * 60));
                              const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
                              const s = Math.floor((ms % (1000 * 60)) / 1000);
                              return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                            })()}
                          </div>
                        ) : (
                          <button
                            id={`btn-complete-${mission.id}`}
                            onClick={() => {
                              localStorage.setItem('active_survey_mission_id', mission.id);
                              onNavigate('mission_review');
                            }}
                            className="w-full py-4 rounded-2xl bg-[#065f46] hover:bg-[#10b981] text-white font-black text-sm transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/30 uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            INICIAR PESQUISA
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
                // Premium missions are locked if on cooldown OR if balance >= 1.0
                const isLocked = cooldownText !== null || balance >= 1.0;

                const getImageUrl = (storeName: string) => {
                  if (storeName.includes('Bonanza')) return 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600&h=300';
                  if (storeName.includes('Atacarejo')) return 'https://images.unsplash.com/photo-1583258298656-9a259c98bb0a?auto=format&fit=crop&q=80&w=600&h=300';
                  if (storeName.includes('Shell')) return 'https://images.unsplash.com/photo-1590481062970-13f56d0ea47f?auto=format&fit=crop&q=80&w=600&h=300';
                  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600&h=300';
                };

                return (
                  <div
                    key={mission.id}
                    className={`bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full relative ${
                      isLocked ? 'opacity-60' : 'hover:border-purple-200'
                    }`}
                    id={`mission-card-${mission.id}`}
                  >
                    
                    {/* Visual premium overlay lock screen */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                        <Lock className="w-10 h-10 text-purple-500 mb-3" />
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">Pesquisa Bloqueada</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {balance >= 1.0 ? "Saldo atingido! Saque para continuar." : `Libera em: ${cooldownText || "08:00:00"}`}
                        </p>
                      </div>
                    )}

                    {/* Mission Image */}
                    <img 
                      src={getImageUrl(mission.store_name)}
                      alt={mission.title}
                      className="w-full h-40 object-cover"
                    />

                    <div className="p-6 flex flex-col flex-1 gap-3">
                      <div className="text-[11px] font-bold text-purple-400 uppercase tracking-widest font-mono">
                        {mission.store_name}
                      </div>

                      <h3 className="font-display font-bold text-xl text-gray-900 group-hover:text-purple-600 transition-colors leading-tight">
                        {mission.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-purple-600 font-bold text-sm">
                        <Check className="w-4 h-4" />
                        Recompensa Total: R$ {mission.cashback_amount.toFixed(2)}
                      </div>

                      <div className="mt-auto pt-4">
                        <button
                          onClick={() => {
                            localStorage.setItem('active_survey_mission_id', mission.id);
                            onNavigate('mission_review');
                          }}
                          className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm transition-all duration-300 cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          INICIAR PESQUISA
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
