/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Wallet, 
  Send,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  QrCode,
  Info,
  DollarSign,
  Smartphone,
  Mail,
  UserCheck,
  FileCheck,
  Globe2
} from 'lucide-react';
import { db } from '../lib/supabase';

interface WithdrawProps {
  onNavigate: (view: 'dashboard' | 'withdraw' | 'mission_review' | 'admin_login') => void;
}

type PixKeyType = 'CPF' | 'Celular' | 'E-mail' | 'Chave Aleatória';

export default function Withdraw({ onNavigate }: WithdrawProps) {
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [keyType, setKeyType] = useState<PixKeyType>('CPF');
  const [pixKey, setPixKey] = useState<string>('');
  
  // UX states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1); // 1 = Form, 2 = Animating submission

  useEffect(() => {
    setBalance(db.getWalletBalance());
    const user = db.getCurrentUser();
    if (user && user.pixKey) {
      setPixKey(user.pixKey);
      // Try to intelligently detect key type or default to 'Celular' if it looks like phone numbers
      if (user.pixKey.includes('@')) {
        setKeyType('E-mail');
      } else if (user.pixKey.length > 11 && !user.pixKey.includes('-')) {
        setKeyType('Chave Aleatória');
      } else if (/^\d{10,11}$/.test(user.pixKey.replace(/\D/g, ''))) {
        setKeyType('Celular');
      } else {
        setKeyType('CPF');
      }
    }
  }, []);

  const handleKeyTypeChange = (type: PixKeyType) => {
    setKeyType(type);
    setPixKey('');
    setErrorMessage(null);
  };

  const getKeyPlaceholder = () => {
    switch (keyType) {
      case 'CPF':
        return '000.000.000-00';
      case 'Celular':
        return '99999999999';
      case 'E-mail':
        return 'seu.email@exemplo.com';
      case 'Chave Aleatória':
        return '8c983a54-7264-4e20-b3b3-85f0ef2013f9';
      default:
        return 'Digite a chave PIX';
    }
  };

  const handleQuickAmount = (pct: number) => {
    if (pct === 100) {
      setAmount(balance.toFixed(2));
    } else {
      const calculated = (balance * pct) / 100;
      setAmount(calculated.toFixed(2));
    }
    setErrorMessage(null);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Digite um valor de saque válido.');
      return;
    }

    if (parsedAmount < 1.00) {
      setErrorMessage('O valor mínimo de saque PIX é de R$ 1,00.');
      return;
    }

    if (parsedAmount > balance) {
      setErrorMessage('Você não possui saldo disponível suficiente para este saque.');
      return;
    }

    if (!pixKey.trim()) {
      setErrorMessage('A chave PIX de destino não pode estar em branco.');
      return;
    }

    // Step 2: Animated transmission simulation
    setStep(2);
    setIsSubmitting(true);

    setTimeout(() => {
      try {
        // Register withdrawal transaction in state
        db.addTransaction(
          parsedAmount,
          'withdrawal',
          `Saque PIX para chave ${keyType}`,
          keyType,
          pixKey.trim()
        );
        setIsSubmitting(false);
        setIsSuccess(true);
      } catch (err) {
        setIsSubmitting(false);
        setStep(1);
        setErrorMessage('Falha ao processar o saque. Tente novamente.');
      }
    }, 2200);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6" id="withdraw-view">
      {/* Back to Dashboard and Title */}
      <div className="flex items-center gap-4">
        <button
          id="btn-back-withdraw"
          onClick={() => onNavigate('dashboard')}
          className="p-3 bg-[#111] border border-white/5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#10b981]/80">CARTEIRA DIGITAL</p>
          <h1 className="font-display font-black text-2xl text-white tracking-tight">Saque via PIX</h1>
        </div>
      </div>

      {step === 1 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111] border border-white/5 rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl relative overflow-hidden"
        >
          {/* Quick Balance Header inside Form */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20">
                <Wallet className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.2em]">Saldo Disponível</p>
                <p className="text-2xl font-display font-black text-white mt-0.5 font-mono">
                  R$ {balance.toFixed(2)}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 px-2 py-1 rounded">
              MODO SANDBOX
            </span>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-6">
            {/* Amount input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block">
                Valor para Saque (R$)
              </label>
              <div className="relative">
                <input
                  id="withdraw-amount-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-mono text-lg font-bold focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                />
                <div className="absolute left-4 top-4.5 text-white/50 font-display font-bold text-lg select-none">
                  R$
                </div>
              </div>

              {/* Quick selectors */}
              {balance > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(25)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:border-white/15 text-[10px] font-mono text-slate-300 font-bold hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(50)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:border-white/15 text-[10px] font-mono text-slate-300 font-bold hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(75)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:border-white/15 text-[10px] font-mono text-slate-300 font-bold hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(100)}
                    className="flex-1 py-1.5 rounded-lg bg-[#10b981]/15 hover:bg-[#10b981]/20 border border-[#10b981]/20 text-[10px] font-mono text-[#10b981] font-black tracking-widest hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    TUDO
                  </button>
                </div>
              )}
            </div>

            {/* Pix Key Type Select */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block">
                Tipo de Chave PIX
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['CPF', 'Celular', 'E-mail', 'Chave Aleatória'] as PixKeyType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleKeyTypeChange(type)}
                    className={`py-3 px-1 rounded-xl text-xs font-bold border transition-all duration-200 hover:scale-[1.04] active:scale-[0.96] text-center cursor-pointer ${
                      keyType === type
                        ? 'bg-[#10b981] text-black border-transparent font-black shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Pix Key Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 block">
                Chave PIX de Destino
              </label>
              <div className="relative">
                <input
                  id="withdraw-key-input"
                  type="text"
                  placeholder={getKeyPlaceholder()}
                  value={pixKey}
                  onChange={(e) => {
                    setPixKey(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white font-mono text-sm focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-colors"
                />
              </div>
            </div>

            {/* Error notifications */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-rose-950/20 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex gap-2.5 items-start"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Warning advisory about audit */}
            <div className="rounded-xl bg-white/5 border border-white/5 p-4 flex gap-3">
              <Info className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
              <p className="text-[10.5px] text-white/40 leading-relaxed font-sans">
                <b>Nota de Segurança:</b> Para auditoria antifraude e proteção comercial das ordens de pagamento em Arcoverde, os saques passam por aprovação automática preventiva em sandbox local. O prazo médio da transferência é de segundos.
              </p>
            </div>

            {/* Submit handle */}
            <button
              id="btn-confirm-withdraw"
              type="submit"
              disabled={!amount || !pixKey}
              className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
                amount && pixKey
                  ? 'bg-[#10b981] text-black hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)] font-black cursor-pointer'
                  : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed font-medium'
              }`}
            >
              <Send className="w-4 h-4 text-current" /> Enviar Pedido de Transferência
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#111] border border-white/5 rounded-3xl p-8 text-center shadow-xl space-y-6"
        >
          {isSubmitting ? (
            <div className="space-y-6 py-6" id="withdrawing-spinner">
              {/* Complex high-fidelity multi-stage steps */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-[#10b981]/20 border-t-[#10b981] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-[#10b981]">
                    <QrCode className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-xl text-white tracking-tight">Transmitindo Ordem PIX</h3>
                <p className="text-xs text-white/40 max-w-sm mx-auto leading-relaxed">
                  Por gentileza, aguarde. Estamos processando sua carteira local com o validador Sandbox do sistema central Arcoverde...
                </p>
              </div>

              {/* Status bullet flows */}
              <div className="max-w-xs mx-auto text-left space-y-2 bg-white/5 p-4 rounded-xl text-[10px] font-mono text-white/40 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping" />
                  <span className="text-white/85 font-black">Criando payload do saque...</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  <span>Enviando dados da chave {keyType} ({pixKey})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-white/10 rounded-full" />
                  <span>Registrando transação pendente no LocalStorage</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-6" id="withdrawing-success">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20 animate-bounce">
                  <CheckCircle className="w-12 h-12" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display font-black text-2xl text-white tracking-tight">Ordem PIX Recebida!</h3>
                <p className="text-xs text-white/40 max-w-md mx-auto leading-relaxed">
                  A transferência de <b className="text-[#10b981] font-black">R$ {parseFloat(amount).toFixed(2)}</b> foi enviada para análise no painel administrativo de Arcoverde.
                </p>
              </div>

              {/* Receipt details */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 max-w-sm mx-auto text-left space-y-2 text-xs font-mono text-white/60">
                <p className="text-[10px] font-black uppercase text-[#10b981] tracking-wider mb-2">Comprovante Sandbox</p>
                <div className="flex justify-between border-t border-white/5 pt-2">
                  <span className="text-white/30 font-bold uppercase text-[9px] tracking-wider">Origem:</span>
                  <span className="font-sans font-semibold">M-Wallet Arcoverde</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30 font-bold uppercase text-[9px] tracking-wider">Tipo de Saque:</span>
                  <span className="font-sans font-semibold">Transferência PIX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30 font-bold uppercase text-[9px] tracking-wider">Chave ({keyType}):</span>
                  <span>{pixKey}</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-dashed border-white/5 pt-2 mt-2">
                  <span className="text-white/40 font-bold uppercase text-[9px] tracking-wider mt-0.5">Valor Liquido:</span>
                  <span className="text-[#10b981] font-mono font-black text-sm">R$ {parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 items-center pt-4">
                <button
                  id="btn-admin-panel-redirect"
                  onClick={() => onNavigate('admin_login')}
                  className="py-1 px-4 text-xs font-mono font-bold tracking-widest uppercase text-[#10b981] hover:underline hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Ir para Painel Admin para Aprovar →
                </button>
              </div>

              <button
                id="btn-success-back"
                onClick={() => onNavigate('dashboard')}
                className="py-3.5 px-8 rounded-xl bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:scale-[1.04] active:scale-[0.96] font-bold text-xs leading-none transition-all duration-200 cursor-pointer"
              >
                Voltar à Carteira
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
