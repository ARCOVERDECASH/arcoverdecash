/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle, 
  HelpCircle,
  X,
  PlusCircle,
  Star,
  ChevronRight,
  MessageSquare,
  Building,
  Award,
  Wallet,
  Sparkles,
  Loader,
  AlertCircle
} from 'lucide-react';
import { db } from '../lib/supabase';
import { Mission } from '../types';

interface MissionReviewProps {
  onNavigate: (view: 'dashboard' | 'withdraw' | 'mission_review' | 'admin_login') => void;
}

const QUESTIONS = [
  {
    text: "Qual o seu nível de satisfação com a facilidade de circulação, organização e limpeza no [STORE]?",
    options: ["Excelente / Impecável", "Boa / Organizada", "Regular / Precisa melhorar", "Fraca / Muito bagunçada"]
  },
  {
    text: "Como avalia o atendimento recebido pelos colaboradores e atendentes de Arcoverde?",
    options: ["Altamente atencioso e prestativo", "Bom / Dentro do esperado", "Frio / Pouco prestativo", "Rude / Fui mal atendido"]
  },
  {
    text: "Os preços informados nas etiquetas coincidem corretamente com os cobrados no leitor/caixa?",
    options: ["Sim, 100% corretos", "Quase sempre sim", "Às vezes há erros", "Não, preços confusos e divergentes"]
  },
  {
    text: "Como você avalia a facilidade de encontrar itens em ofertas anunciados nos folhetos?",
    options: ["Muito fácil, bem sinalizados", "Fácil / Achei a maioria", "Difícil de achar", "Não havia ofertas disponíveis"]
  },
  {
    text: "A qualidade e o frescor dos produtos perecíveis (hortifrúti, congelados, pães) são adequados?",
    options: ["Qualidade Premium", "Boa qualidade padrão", "Mediana / Deixa a desejar", "Fraca / Itens velhos ou estragados"]
  },
  {
    text: "Como avalia o tempo de espera e a agilidade nas filas dos caixas no [STORE]?",
    options: ["Muito rápido, atendentes eficientes", "Razoável / Tempo padrão", "Demorado nos horários de pico", "Excessivamente lento / Desorganizado"]
  },
  {
    text: "Qual a sua opinião sobre a variedade de marcas e opções disponíveis nas gôndolas?",
    options: ["Excelente variedade", "Boa variedade padrão", "Poucas opções de marcas", "Variedade muito fraca / Desabastecido"]
  },
  {
    text: "A empresa segue devidamente todas as medidas de segurança, higiene e conservação?",
    options: ["Sim, de forma exemplar", "Sim, está adequado", "Melhorável em alguns aspectos", "Não, percebi desleixo"]
  },
  {
    text: "Considerando a relação custo-benefício dos produtos, você considera que vale a pena comprar lá?",
    options: ["Excelente custo-benefício", "Custo-benefício justo", "Caro em relação à concorrência", "Péssimo custo-benefício"]
  },
  {
    text: "Qual a probabilidade de você retornar ao estabelecimento ou indicar para vizinhos de Arcoverde?",
    options: ["Recomendaria com total convicção", "Sim, recomendaria", "Talvez indicasse", "Não recomendaria de forma alguma"]
  }
];

export default function MissionReview({ onNavigate }: MissionReviewProps) {
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0); // 0-9 for questions, 10 for feedback summary/comment
  
  // Real-time accumulating wallet reward
  const [accumulatedReward, setAccumulatedReward] = useState<number>(0);
  const [answers, setAnswers] = useState<string[]>([]);
  
  // Final Feedback states
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  
  // UX processing states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Read the active mission from localStorage
    const savedId = localStorage.getItem('active_survey_mission_id');
    const allMissions = db.getMissions();
    
    let missionToLoad = allMissions[0]; // fallback
    if (savedId) {
      const found = allMissions.find(m => m.id === savedId);
      if (found) {
        missionToLoad = found;
      }
    }
    
    // Check if this mission is actually on cooldown! Safety fallback
    if (db.isSurveyOnCooldown(missionToLoad.id)) {
      setErrorMessage("Esta pesquisa está no tempo de bloqueio de 6 horas. Escolha outra loja no painel!");
    }

    setActiveMission(missionToLoad);
  }, []);

  const playClickFeedbackSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5 Coin clink freq
      osc.frequency.exponentialRampToValueAtTime(1318.51, audioCtx.currentTime + 0.08); // E6
      
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.convert = (x: any) => x;
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      // Ignored
    }
  };

  const playSurveySuccessSound = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      
      const playCoin = (timeOffset: number, pitchMultiplier: number = 1) => {
        const now = audioCtx.currentTime + timeOffset;
        
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880 * pitchMultiplier, now);
        osc1.frequency.exponentialRampToValueAtTime(1500 * pitchMultiplier, now + 0.12);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760 * pitchMultiplier, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.38);
        osc2.stop(now + 0.38);
      };
      
      // Dual high-intensity ringing register coin ding: "Kling-Kling!"
      playCoin(0.0, 1.0);
      playCoin(0.12, 1.25);
      
    } catch (e) {
      // Ignored
    }
  };

  const handleSelectOption = (optionText: string) => {
    playClickFeedbackSound();
    
    // Save answer
    const updatedAnswers = [...answers, optionText];
    setAnswers(updatedAnswers);
    
    // Increment accumulated balance based on actual survey award scale
    const rewardPerStep = (activeMission?.cashback_amount || 0.10) / 10;
    const newRew = (currentStep + 1) * rewardPerStep;
    setAccumulatedReward(newRew);
    
    // Progress
    setCurrentStep(currentStep + 1);
  };

  const handleFinishSurvey = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!activeMission) return;
    
    // Check local comment validation length
    if (comment.trim().length < 8) {
      setErrorMessage("Por favor, escreva um comentário com pelo menos 8 caracteres expressando sua opinião sincera.");
      return;
    }

    setIsSubmitting(true);

    // Human-like analysis verification simulator
    setTimeout(() => {
      try {
        db.submitSurveyAnswer(
          activeMission.id,
          rating,
          comment.trim()
        );
        setIsSubmitting(false);
        setIsSuccess(true);
        playSurveySuccessSound();
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMessage(err.message || "Erro ao creditar pesquisa. Tente novamente.");
      }
    }, 1800);
  };

  if (!activeMission) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-xs">
        Carregando pesquisa em Arcoverde...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6" id="mission-review-view">
      
      {/* Back button and business banner */}
      <div className="flex items-center gap-4">
        <button
          id="btn-back-review"
          onClick={() => onNavigate('dashboard')}
          disabled={isSubmitting}
          className="p-3 bg-[#111] border border-white/5 rounded-xl text-white/50 hover:text-white hover:bg-white/5 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#10b981] flex items-center gap-1">
            <Building className="w-3.5 h-3.5" /> PESQUISA REGISTRADA EM ARCOVERDE
          </p>
          <h1 className="font-display font-black text-xl text-white tracking-tight mt-0.5">{activeMission.store_name}</h1>
        </div>
      </div>

      {!isSuccess ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111] border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative halo background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl pointer-events-none" />

          {/* Validation loader step */}
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center" id="mission-uploading">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#10b981]/15 border-t-[#10b981] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#10b981] absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-black text-xl text-white">Analisando Respostas</h3>
                <p className="text-xs text-white/40 max-w-sm leading-relaxed mx-auto">
                  Verificando a integridade das respostas com o validador Sandbox da prefeitura de Arcoverde...
                </p>
              </div>

              <div className="w-full max-w-xs bg-white/5 rounded-full h-1 px-1 mt-4">
                <motion.div 
                  className="bg-[#10b981] h-1 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.6, ease: 'easeInOut' }}
                />
              </div>
            </div>
          ) : currentStep < 10 ? (
            /* Active Questions Panel (Questions 1 to 10) */
            <div className="space-y-6">
              
              {/* Question progress metric header */}
              <div className="flex justify-between items-center bg-white/5 border border-white/[0.03] rounded-2xl p-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Progresso da Pesquisa</p>
                  <p className="text-[#10b981] font-black font-mono text-sm leading-none">
                    Pergunta {currentStep + 1} de 10
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Ganho Acumulado</p>
                  <p className="text-emerald-400 font-black font-mono text-lg mt-0.5">
                    + R$ {accumulatedReward.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#10b981] transition-all duration-300" 
                  style={{ width: `${(currentStep / 10) * 100}%` }}
                />
              </div>

              {/* The Question Text */}
              <div className="py-2">
                <p className="text-xs font-bold text-slate-500 uppercase font-mono tracking-widest bg-slate-900 border border-slate-800/60 px-3 py-1 rounded inline-block">
                  Sua Opinião Importa
                </p>
                <h2 className="font-display font-black text-xl text-white mt-4 leading-snug">
                  {QUESTIONS[currentStep].text.replace("[STORE]", activeMission.store_name)}
                </h2>
              </div>

              {/* Option Blocks button flows */}
              <div className="grid grid-cols-1 gap-3">
                {QUESTIONS[currentStep].options.map((option, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#10b981]/30 text-xs text-white/80 font-medium hover:scale-[1.025] active:scale-[0.975] transition-all duration-200 group flex justify-between items-center cursor-pointer"
                  >
                    <span>{option}</span>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-[#10b981] group-hover:translate-x-1.5 transition-all duration-200" />
                  </button>
                ))}
              </div>

              {/* Sandbox Tip footnote */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.03] p-4 text-[11px] text-white/35 flex gap-2 leading-relaxed">
                <span className="text-[#10b981] font-bold">Dica:</span> Cada resposta adiciona imediatamente R$ 0,10. Ao finalizar as 10 perguntas e registrar o comentário, você saca o valor cheio de R$ 1,00 via PIX instantaneamente.
              </div>

            </div>
          ) : (
            /* Step 11: Rating and text Commentary input */
            <form onSubmit={handleFinishSurvey} className="space-y-6">
              <div className="space-y-2 text-center py-2">
                <span className="p-3 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 rounded-2xl inline-flex animate-pulse">
                  <Star className="w-6 h-6 fill-current" />
                </span>
                <h2 className="font-display font-black text-2xl text-white tracking-tight mt-4">Avaliação Final & Comentário</h2>
                <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                  Para liberar seu saldo de R$ 1,00, dê uma nota em estrelas e deixe um pequeno elogio ou crítica sincera sobre as lojas físicas em Arcoverde.
                </p>
              </div>

              {/* Star Selectors */}
              <div className="space-y-2 text-center">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                  Qual nota você dá para o estabelecimento?
                </label>
                <div className="flex justify-center gap-1.5 pt-2">
                  {[1, 2, 3, 4, 5].map((starIdx) => (
                    <button
                      key={starIdx}
                      type="button"
                      onClick={() => {
                        playClickFeedbackSound();
                        setRating(starIdx);
                      }}
                      className="p-1 hover:scale-120 active:scale-90 transition-all duration-150 cursor-pointer"
                    >
                      <Star 
                        className={`w-10 h-10 transition-colors duration-200 ${
                          starIdx <= rating 
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' 
                            : 'text-white/10 hover:text-white/30'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Client Textarea Comment */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                  Escreva um breve comentário/opinião ou sugestão de melhoria:
                </label>
                <div className="relative">
                  <textarea
                    id="review-notes-input"
                    rows={3}
                    maxLength={300}
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ex: Supermercado excelente, sempre encontro mercadorias frescas no hortifrúti. Só acho que a fila do caixa rápido demora um pouquinho aos sábados..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-xs text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors placeholder:text-white/20 leading-relaxed font-sans"
                  />
                  <div className="absolute right-3.5 bottom-3 text-[10px] text-white/20 font-mono">
                    {comment.trim().length}/300
                  </div>
                </div>
              </div>

              {/* System Error warnings */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 bg-rose-950/20 border border-rose-500/20 rounded-xl text-xs text-rose-455 flex gap-2.5 items-start mt-4 font-mono"
                  id="error-feedback-review"
                >
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-rose-400" />
                  <span className="text-rose-400 font-medium">{errorMessage}</span>
                </motion.div>
              )}

              {/* Submit Finalizer bar */}
              <button
                id="btn-submit-review-form"
                type="submit"
                disabled={comment.trim().length < 8}
                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
                  comment.trim().length >= 8
                    ? 'bg-[#10b981] text-black hover:scale-[1.03] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] active:scale-[0.97] cursor-pointer'
                    : 'bg-white/5 text-white/25 border border-white/5 cursor-not-allowed'
                }`}
              >
                <Award className="w-4 h-4 text-current" /> Finalizar e Resgatar R$ {activeMission.cashback_amount.toFixed(2)}
              </button>
            </form>
          )}

        </motion.div>
      ) : (
        /* SUCCESS SCREEN */
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111] border border-white/5 rounded-3xl p-8 text-center space-y-6"
          id="submission-success"
        >
          {/* Animated Balance Indicator Above Success Screen */}
          <motion.div 
            initial={{ y: -15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="max-w-xs mx-auto bg-gradient-to-b from-[#0f172a] to-[#020617] border border-emerald-500/20 rounded-2xl p-4 text-center ring-4 ring-emerald-950/35 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">Saldo na Carteira</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-6 h-6 rounded-full bg-emerald-400/10 border border-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.4)]">
                <span className="text-emerald-400 font-display font-black text-xs">$</span>
              </div>
              <span className="text-2xl font-mono font-black text-white glow-text animate-pulse">
                R$ {(db.getWalletBalance()).toFixed(2)}
              </span>
            </div>
          </motion.div>

          <div className="flex justify-center pt-2">
            <div className="p-4 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 animate-bounce">
              <CheckCircle className="w-12 h-12 text-[#10b981]" />
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#10b981] bg-[#10b981]/10 px-3 py-1 rounded inline-block font-black border border-[#10b981]/15">
              Cashback Creditado na Hora
            </span>
            <h3 className="font-display font-black text-2xl text-white tracking-tight">Pesquisa Concluída!</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
              Obrigado! Sua opinião ajudou o comércio local de Arcoverde e o cashback já entrou na sua carteira.
            </p>
          </div>

          {/* Receipt detail parameters */}
          <div className="max-w-xs mx-auto p-4 bg-black border border-white/5 rounded-2xl text-left text-xs font-mono text-white/60 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.02] rounded-full blur-xl pointer-events-none" />
            <p className="text-[10px] text-[#10b981] font-black uppercase tracking-wider mb-2">Comprovante de Crédito</p>
            <div className="flex justify-between border-t border-white/5 pt-2">
              <span className="text-white/30">Loja Avaliada:</span>
              <span className="text-white font-sans font-semibold">{activeMission.store_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">Opinião ID:</span>
              <span>FEED-{Date.now().toString().slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/30">Nota Registrada:</span>
              <span className="text-yellow-400 flex items-center gap-0.5 font-bold font-sans">
                {rating} <Star className="w-3.5 h-3.5 fill-current" />
              </span>
            </div>
            <div className="flex justify-between font-bold text-white pt-2 border-t border-dashed border-white/5">
              <span className="text-white/30">Transação na Tela:</span>
              <span className="text-[#10b981] font-black text-sm">✓ + R$ {activeMission.cashback_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 max-w-xs mx-auto pt-6 select-none leading-none">
            <button
              id="btn-review-back-dashboard"
              onClick={() => onNavigate('dashboard')}
              className="py-4 px-6 rounded-xl bg-white/5 border border-white/10 text-white hover:border-white/20 font-bold text-xs hover:bg-white/10 hover:text-white hover:scale-[1.03] active:scale-[0.97] cursor-pointer transition-all duration-200 uppercase tracking-wider font-mono text-center"
            >
              Voltar ao Início
            </button>
            <button
              id="btn-go-pix"
              onClick={() => onNavigate('withdraw')}
              className="py-4 px-6 rounded-xl bg-[#10b981] text-black font-black text-xs hover:bg-[#10b981]/90 hover:scale-[1.03] hover:shadow-[0_4px_25px_rgba(16,185,129,0.3)] active:scale-[0.97] cursor-pointer transition-all duration-200 uppercase tracking-wider font-mono text-center flex items-center justify-center gap-1.5"
            >
              <Wallet className="w-4 h-4 stroke-[2.5]" /> Fazer Saque PIX
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
}
