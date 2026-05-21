/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Wallet, 
  Sparkles, 
  ShieldAlert, 
  BookOpen, 
  TrendingUp, 
  Compass, 
  Clock, 
  User, 
  ShieldCheck, 
  HelpCircle,
  X,
  MapPin,
  Calendar,
  Layers,
  Flame,
  CheckCircle2
} from 'lucide-react';

// Import Views
import Dashboard from './views/Dashboard';
import Withdraw from './views/Withdraw';
import MissionReview from './views/MissionReview';
import AdminLogin from './views/AdminLogin';
import Admin from './views/Admin';
import CitizenAuth from './views/CitizenAuth';

import { Mission, User as UserType } from './types';
import { db } from './lib/supabase';

type AppView = 'dashboard' | 'withdraw' | 'mission_review' | 'admin_login' | 'admin_dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [citizenSession, setCitizenSession] = useState<UserType | null>(null);
  const [selectedMissionRule, setSelectedMissionRule] = useState<Mission | null>(null);
  
  // Real-time details for local PE citizens
  const [currentTime, setCurrentTime] = useState<string>('15:22:30');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  // Real-time simulated withdrawal notifications with audio feedback
  const [activeToast, setActiveToast] = useState<{ id: string; name: string; amount: number } | null>(null);

  const playChimeSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      
      // Note 1: High crisp frequency
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain1.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.3);

      // Note 2: Higher crisp frequency slightly delayed
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
      gain2.gain.setValueAtTime(0.04, audioCtx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc2.start(audioCtx.currentTime + 0.08);
      osc2.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Silently catch browser autoplay prevention blockages until first interaction
    }
  };

  useEffect(() => {
    const listNames = ['Simone', 'Leandro', 'João', 'Maria', 'Alison', 'Emerson', 'Aline', 'Lucas', 'Bruno', 'Camila', 'Patrícia', 'Renato', 'Vanessa'];
    const listAmounts = [1.00, 5.00, 6.00, 10.00, 15.00];

    const interval = setInterval(() => {
      const rName = listNames[Math.floor(Math.random() * listNames.length)];
      const rAmount = listAmounts[Math.floor(Math.random() * listAmounts.length)];
      
      setActiveToast({
        id: `toast-${Date.now()}`,
        name: rName,
        amount: rAmount
      });
      
      playChimeSound();

      // Clear after 4 seconds
      setTimeout(() => {
        setActiveToast(null);
      }, 4500);

    }, 20000); // Trigger every 20 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const session = db.getCurrentUser();
    if (session) {
      setCitizenSession(session);
    }
  }, []);

  useEffect(() => {
    setWalletBalance(db.getWalletBalance());
    
    // Smooth time ticking
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR'));
    }, 1000);

    const handleStorageChange = () => {
      setWalletBalance(db.getWalletBalance());
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentView, citizenSession]);

  const handleNavigate = (view: AppView | 'admin_login') => {
    if (view === 'admin_login') {
      if (isAdminAuthenticated) {
        setCurrentView('admin_dashboard');
      } else {
        setCurrentView('admin_login');
      }
    } else {
      setCurrentView(view);
    }
    // Pull fresh balance when switching screens
    setWalletBalance(db.getWalletBalance());
  };

  const handleAdminSuccess = () => {
    setIsAdminAuthenticated(true);
    setCurrentView('admin_dashboard');
    setWalletBalance(db.getWalletBalance());
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentView('dashboard');
    setWalletBalance(db.getWalletBalance());
  };

  const closeRulesModal = () => {
    setSelectedMissionRule(null);
  };  const isViewingAdmin = currentView === 'admin_login' || currentView === 'admin_dashboard';
  const showAuth = !citizenSession && !isViewingAdmin;

  return (
    <div className="min-h-screen w-full bg-[#070b13] flex items-center justify-center font-sans text-slate-300 selection:bg-emerald-500/30 selection:text-white md:p-6 lg:p-8 relative overflow-x-hidden">
      
      {/* Dynamic ambient blur spots in high fidelity for desktop backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none hidden md:block" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none hidden md:block" />

      {/* Styled Responsive Container Instead of Smartphone Mockup */}
      <div className="w-full min-h-screen bg-[#070b13] flex flex-col justify-between overflow-hidden relative">
        
        {/* Scrollable Main Viewport */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-between pt-0 relative xs:text-xs">
          
          {showAuth ? (
            <CitizenAuth 
              onAuthSuccess={(user) => {
                setCitizenSession(user);
                setWalletBalance(db.getWalletBalance());
              }} 
              onAdminClick={() => handleNavigate('admin_login')}
            />
          ) : (
            <>
              {/* Top Ticker: Local Sandbox status */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 border-b border-slate-900/60 py-2 px-3 shadow">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[9px] text-slate-400 font-mono">
                      <b className="text-emerald-400">Arcoverde-PE Offline Sandbox Ready</b>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                    <span>{currentTime}</span>
                  </div>
                </div>
              </div>

              {/* Redesigned Compact Mobile Friendly Header */}
              <header className="bg-slate-950/90 backdrop-blur-md sticky top-0 border-b border-slate-905 z-40 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div 
                    onClick={() => handleNavigate('dashboard')}
                    className="flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all duration-200 group select-none"
                    id="brand-logo"
                  >
                    <div className="w-8 h-8 bg-gradient-to-tr from-emerald-600 to-emerald-500 text-slate-950 rounded-xl flex items-center justify-center font-bold shadow-md shadow-emerald-950/20 group-hover:rotate-6 transition-transform duration-300 shrink-0">
                      <Wallet className="w-4 h-4 text-slate-950 font-black" />
                    </div>
                    <div>
                      <span className="font-display font-black text-xs tracking-tight text-white block">
                        Cash <span className="text-emerald-400">Arcoverde</span>
                      </span>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-semibold block leading-none">
                        Fidelidade PE
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-400 font-mono font-bold">
                        R$ {walletBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        db.logOutUser();
                        setCitizenSession(null);
                        handleNavigate('dashboard');
                      }}
                      className="w-7 h-7 rounded-lg bg-red-950/20 border border-red-900/30 flex items-center justify-center text-rose-450 hover:bg-rose-900/30 hover:border-rose-500 active:scale-90 cursor-pointer transition-all duration-200"
                      title="Sair"
                    >
                      <User className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                </div>
              </header>

              {/* Main Compact Scroll container for screens */}
              <main className="px-3 py-4 flex-1 flex flex-col" id="main-content-area">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentView}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    className="w-full flex-1 flex flex-col"
                  >
                    {currentView === 'dashboard' && (
                      <Dashboard 
                        onNavigate={handleNavigate} 
                        onOpenRules={(m) => setSelectedMissionRule(m)}
                      />
                    )}
                    
                    {currentView === 'withdraw' && (
                      <Withdraw onNavigate={handleNavigate} />
                    )}

                    {currentView === 'mission_review' && (
                      <MissionReview onNavigate={handleNavigate} />
                    )}

                    {currentView === 'admin_login' && (
                      <AdminLogin 
                        onLoginSuccess={handleAdminSuccess}
                        onNavigate={handleNavigate}
                      />
                    )}

                    {currentView === 'admin_dashboard' && (
                      <Admin 
                        onLogout={handleAdminLogout}
                        onNavigate={handleNavigate}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* Compact Phone Friendly Footer */}
              <footer 
                className="bg-slate-950 border-t border-slate-900/60 py-3 px-3 text-center text-[8.5px] font-mono text-slate-500 shrink-0 cursor-pointer"
                onClick={(e) => {
                  if (e.detail === 3) {
                    handleNavigate('admin_login');
                  }
                }}
              >
                <p className="font-semibold text-slate-400">Cash Arcoverde — Rede Fidelidade</p>
                <p className="text-[7.5px] mt-0.5 text-slate-650">Arcoverde PE • Sandbox Mode</p>
              </footer>
            </>
          )}

        </div>

        {/* Smartphone Navigation Tabs (Always active on bottom of bezel mockup) */}
        {!showAuth && (
          <nav className="bg-slate-950 border-t border-slate-900/80 py-2 z-40 backdrop-blur-md px-3 flex items-center justify-around gap-1 shrink-0 select-none">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`flex-1 py-1 flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
                currentView === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-500'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="text-[8.5px] font-mono">Pesquisas</span>
            </button>

            {citizenSession && (
              <button
                onClick={() => handleNavigate('withdraw')}
                className={`flex-1 py-1 flex flex-col items-center gap-0.5 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${
                  currentView === 'withdraw' ? 'text-emerald-400 font-bold' : 'text-slate-500'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span className="text-[8.5px] font-mono">Sacar PIX</span>
              </button>
            )}
          </nav>
        )}

      </div>

      {/* Rules dialog modal */}
      <AnimatePresence>
        {selectedMissionRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" id="rules-modal">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-900 rounded-3xl p-5 max-w-xs w-full space-y-4 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10 uppercase tracking-wider leading-none">
                    Pesquisa Premiada
                  </span>
                  <h3 className="font-display font-black text-sm text-white mt-1">
                    {selectedMissionRule.store_name}
                  </h3>
                </div>
                <button
                  id="btn-close-modal"
                  onClick={closeRulesModal}
                  className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-[10px] leading-relaxed text-slate-300">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-900">
                  <p className="font-semibold text-white">Objetivo:</p>
                  <p className="text-slate-400 text-[9.5px] mt-0.5 leading-normal">{selectedMissionRule.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900">
                    <p className="text-[8px] font-mono text-slate-500 uppercase font-black">Pesquisa</p>
                    <p className="text-[10px] font-bold text-slate-205 mt-0.5 font-mono">10 Perguntas</p>
                  </div>
                  <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-900">
                    <p className="text-[8px] font-mono text-slate-500 uppercase font-black">Ganho</p>
                    <p className="text-[10px] font-bold text-emerald-400 mt-0.5 font-mono">R$ 1,00 total</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-white">Etapas para resgate:</p>
                  <div className="space-y-1.5 text-[9.5px] text-slate-400">
                    <div className="flex gap-2 items-start">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center font-bold shrink-0 text-[8px]">1</span>
                      <p>Responda as 10 perguntas fáceis sobre o estabelecimento.</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center font-bold shrink-0 text-[8px]">2</span>
                      <p>Avalie com estrelas e envie o seu feedback sincero.</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-4 h-4 rounded-full bg-slate-900 text-slate-400 flex items-center justify-center font-bold shrink-0 text-[8px]">3</span>
                      <p>R$ 1,00 é inserido instantaneamente no saldo para saque.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-900 flex justify-end gap-2 text-[10px]">
                <button
                  id="btn-modal-close"
                  onClick={closeRulesModal}
                  className="py-1.5 px-3 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  id="btn-modal-action-go"
                  onClick={() => {
                    closeRulesModal();
                    localStorage.setItem('active_survey_mission_id', selectedMissionRule.id);
                    handleNavigate('mission_review');
                  }}
                  className="py-1.5 px-3 rounded-lg bg-[#10b981] hover:bg-[#10b981]/90 text-slate-950 font-black cursor-pointer"
                >
                  Iniciar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Withdrawal Live Toast */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            className="fixed bottom-20 left-4 right-4 md:absolute md:bottom-20 md:left-4 md:right-4 z-50 bg-slate-900 border border-emerald-500/30 p-3 rounded-2xl flex items-center gap-3 shadow-2xl cursor-pointer"
            onClick={() => setActiveToast(null)}
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black animate-bounce shrink-0 text-xs">
              $
            </div>
            <div className="text-[10px]">
              <p className="uppercase font-mono text-emerald-400 font-bold leading-none">Saque Instantâneo PIX</p>
              <p className="text-white font-sans leading-relaxed mt-1">
                <b>{activeToast.name}</b> resgatou <b>R$ {activeToast.amount.toFixed(2)}</b>!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Player para o usuário */}
      {citizenSession && (
        <audio
          loop
          autoPlay
          src="/audio.mp3"
          onLoadedData={(e) => {
            e.currentTarget.volume = 0.1;
            e.currentTarget.play().catch(e => console.log("Aguardando interação do usuário para tocar áudio"));
          }}
        />
      )}

    </div>
  );
}
