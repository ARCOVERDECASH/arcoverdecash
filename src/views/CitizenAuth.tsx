import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Lock, 
  User, 
  Sparkles, 
  AlertCircle, 
  HelpCircle,
  Hash,
  Activity,
  ArrowRight,
  Wallet,
  ShieldCheck
} from 'lucide-react';
import { db, getClientIP } from '../lib/supabase';
import { User as UserType } from '../types';

interface CitizenAuthProps {
  onAuthSuccess: (user: UserType) => void;
  onAdminClick?: () => void;
}

export default function CitizenAuth({ onAuthSuccess, onAdminClick }: CitizenAuthProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [ipAddress, setIpAddress] = useState<string>('');
  
  // Inputs
  const [name, setName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [pixKey, setPixKey] = useState<string>('');
  
  // States
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  useEffect(() => {
    setIpAddress(getClientIP());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setSuccessText(null);

    if (isLogin) {
      if (!username || !password) {
        setErrorText('Por favor, digite seu usuário e senha de acesso.');
        return;
      }
      const res = db.authenticateUser(username, password);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
      } else {
        setErrorText(res.message);
      }
    } else {
      if (!name || !username || !password) {
        setErrorText('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      
      const res = db.registerUser(name, username, password, pixKey, ipAddress);
      if (res.success && res.user) {
        setSuccessText(res.message);
        setTimeout(() => {
          onAuthSuccess(res.user!);
        }, 1500);
      } else {
        setErrorText(res.message);
      }
    }
  };

  return (
    <div className="w-full flex-1 bg-slate-950 text-slate-300 flex flex-col justify-center items-center py-6 px-4 font-sans relative" id="citizen-auth-view">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-slate-900/10 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Brand visual header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-emerald-600 to-emerald-500 text-slate-950 rounded-3xl flex items-center justify-center font-bold shadow-lg shadow-emerald-900/20">
            <Wallet className="w-9 h-9 text-slate-950 stroke-[2px]" />
          </div>
          
          <div>
            <h2 className="text-center text-3xl font-display font-black text-white tracking-tight">
              Cash <span className="text-[#10b981]">Arcoverde</span>
            </h2>
            <p className="mt-2 text-center text-xs text-slate-400 font-sans max-w-xs mx-auto">
              Ganhe cashback respondendo pesquisas e retirando bônus via <b className="text-[#10b981]">PIX</b> no comércio local.
            </p>
          </div>
        </div>

        {/* Main interactive form card */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Header switch buttons */}
          <div className="flex border-b border-white/5 pb-4 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrorText(null);
                setSuccessText(null);
              }}
              className={`flex-1 py-2 font-display font-black text-xs uppercase tracking-wider text-center border-b-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
                isLogin 
                  ? 'border-[#10b981] text-[#10b981]' 
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErrorText(null);
                setSuccessText(null);
              }}
              className={`flex-1 py-2 font-display font-black text-xs uppercase tracking-wider text-center border-b-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${
                !isLogin 
                  ? 'border-[#10b981] text-[#10b981]' 
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              Criar Carteira Grátis
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Context Feedback warnings */}
            {errorText && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-xl flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorText}</span>
              </motion.div>
            )}

            {successText && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs p-3 rounded-xl flex items-start gap-2"
              >
                <div className="w-4 h-4 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold shrink-0">✓</div>
                <span className="leading-relaxed">{successText}</span>
              </motion.div>
            )}

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/20">
                    N
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    placeholder="Ex: Leandro José da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                Nome de Usuário (Apelido)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-3.5 h-3.5 text-white/20" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Ex: leandro, aline99"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                Senha de Acesso
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-3.5 h-3.5 text-white/20" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block">
                    Chave PIX Preferencial (Opcional)
                  </label>
                  <span className="text-[9px] text-[#10b981] font-bold uppercase font-mono">Facilita o Saque</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-white/20 font-bold text-[10px] font-mono">PIX</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Celular, CPF, E-mail ou Aleatória"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all font-mono"
                  />
                </div>
                <span className="text-[9.5px] text-white/35 font-mono block leading-tight">
                  Seu saque será enviado instantaneamente para esta chave cadastrada ao concluir missões.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="mt-4 w-full bg-[#10b981] hover:bg-emerald-400 hover:scale-[1.025] hover:shadow-[0_4px_25px_rgba(16,185,129,0.35)] active:scale-[0.975] text-black font-black text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow"
            >
              {isLogin ? 'Iniciar Sessão' : 'Registrar Minha Carteira'} <ArrowRight className="w-4 h-4 text-black stroke-[3px]" />
            </button>
          </form>

          {/* Test Tip */}
          <div className="mt-5 space-y-2 text-center">
            <p className="text-[9px] text-white/30 font-mono leading-normal">
              {isLogin 
                ? "Conecte-se para começar a ganhar cashback."
                : `Segurança: Cadastro limitado a 1 conta por endereço de IP de celular (${ipAddress}) para evitar abusos.`
              }
            </p>
          </div>

          {onAdminClick && (
            <div className="mt-5 pt-4 border-t border-white/5 text-center flex flex-col items-center gap-1.5">
              <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">Painel de Controle</span>
              <button
                type="button"
                onClick={onAdminClick}
                className="px-3.5 py-1.5 rounded-xl bg-purple-900/15 hover:bg-purple-900/30 border border-purple-500/25 hover:border-purple-400 text-purple-300 font-black text-[9px] uppercase tracking-wider font-mono transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Acessar Painel Lojista / Admin
              </button>
            </div>
          )}

        </div>

        {/* Footer brand stamp */}
        <p className="text-center text-[10px] text-slate-600 font-mono">
          Desenvolvimento Cidadão Arcoverde • Sandbox Mode
        </p>
      </div>
    </div>
  );
}
