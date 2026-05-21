/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, ShieldCheck, HelpCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onNavigate: (view: 'dashboard' | 'withdraw' | 'mission_review' | 'admin_login') => void;
}

export default function AdminLogin({ onLoginSuccess, onNavigate }: AdminLoginProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Preencha os campos de acesso administrativo.');
      return;
    }

    setIsLoading(true);

    // Simulate database authentication
    setTimeout(() => {
      setIsLoading(false);
      const storedUser = localStorage.getItem('cash_arcoverde_admin_username') || 'admin';
      const storedPass = localStorage.getItem('cash_arcoverde_admin_password') || 'admin';
      
      if (username.toLowerCase().trim() === storedUser.toLowerCase().trim() && password === storedPass) {
        onLoginSuccess();
      } else {
        setErrorMsg('Credenciais inválidas para o portal de Arcoverde. Tente novamente.');
      }
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto py-8 font-sans" id="admin-login-view">
      {/* Return back home arrow button */}
      <div className="mb-6">
        <button
          id="btn-back-login"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-white/50 hover:text-white hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-xs font-mono font-bold tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Painel do Cidadão
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111] border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl relative overflow-hidden"
      >
        {/* Subtle decorative layout */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Header Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#10b981]/85">SISTEMA CONTROLADOR</p>
            <h2 className="font-display font-black text-2xl text-white tracking-tight mt-1">Portal Admin</h2>
          </div>
          <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed">
            Acesso reservado para auditores e parceiros comerciais de Arcoverde (PE)
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block">
              Usuário Fiscal
            </label>
            <input
              id="admin-username-input"
              type="text"
              placeholder="Ex: admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block">
              Senha de Segurança
            </label>
            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ex: admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-xs font-mono text-white focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-white/45 hover:text-white hover:scale-110 active:scale-90 transition-all duration-150 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-950/20 border border-rose-500/20 rounded-xl text-xs text-rose-400"
              id="admin-login-error"
            >
              {errorMsg}
            </motion.div>
          )}

          <button
            id="btn-admin-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 hover:border-white/25 text-white hover:scale-[1.02] active:scale-[0.98] border border-white/15 font-bold text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-[#10b981]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Autenticando...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
