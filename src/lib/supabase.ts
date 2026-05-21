/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

import { Transaction, Mission, MissionSubmission, User } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Generate or retrieve Simulated Client IP for the Arcoverde sandbox
export function getClientIP(): string {
  let ip = localStorage.getItem('cash_arcoverde_client_ip');
  if (!ip) {
    const r2 = Math.floor(Math.random() * 200) + 12;
    const r3 = Math.floor(Math.random() * 240) + 10;
    ip = `177.105.${r2}.${r3}`;
    localStorage.setItem('cash_arcoverde_client_ip', ip);
  }
  return ip;
}

/// Default Preloaded Arcoverde Missions to seed database
const DEFAULT_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Avaliação de Atendimento no Bonanza',
    description: 'Responda perguntas de satisfação e qualidade sobre o Supermercado Bonanza em Arcoverde.',
    store_name: 'Supermercado Bonanza',
    cashback_amount: 0.20,
    category: 'Supermercado',
    banner_color: 'from-amber-600 to-orange-500',
  },
  {
    id: 'm2',
    title: 'Satisfação do Cliente e Organização',
    description: 'Diga o que você acha do preço, limpeza e atendimento do Novo Atacarejo em Arcoverde.',
    store_name: 'Novo Atacarejo',
    cashback_amount: 0.20,
    category: 'Supermercado',
    banner_color: 'from-[#10b981] to-teal-600',
  },
  {
    id: 'm3',
    title: 'Promoções e Atendimento do Dia',
    description: 'Sua opinião sobre promoções e estoque na Lojas Americanas da Av. Antônio Japiassu.',
    store_name: 'Lojas Americanas',
    cashback_amount: 0.20,
    category: 'Lojas da Cidade',
    banner_color: 'from-red-600 to-rose-500',
  },
  {
    id: 'm4',
    title: 'Rapidez e Atenção dos Vendedores',
    description: 'Avalie a rapidez e o atendimento das Lojas Armazém Paraíba no centro de Arcoverde.',
    store_name: 'Armazém Paraíba',
    cashback_amount: 0.20,
    category: 'Lojas da Cidade',
    banner_color: 'from-yellow-600 to-amber-500',
  },
  {
    id: 'm5',
    title: 'Medicamentos e Filas na Pague Menos',
    description: 'Avalie as filas, preços e disponibilidade de medicamentos da Pague Menos Arcoverde.',
    store_name: 'Farmácia Pague Menos',
    cashback_amount: 0.20,
    category: 'Saúde',
    banner_color: 'from-blue-600 to-cyan-500',
  },
  {
    id: 'm6',
    title: 'Estoque de Roupas na Moda & Cia',
    description: 'Avalie a variedade de roupas e atendimento da loja de departamentos Moda & Cia.',
    store_name: 'Moda & Cia Arcoverde',
    cashback_amount: 0.20,
    category: 'Lojas da Cidade',
    banner_color: 'from-purple-600 to-indigo-500',
  },
  {
    id: 'm7',
    title: 'Prazo de Entrega e Embalagem',
    description: 'Sua opinião sincera sobre a rapidez de entrega e sabor da Lanchonete Central.',
    store_name: 'Lanchonete Central',
    cashback_amount: 0.20,
    category: 'Alimentação',
    banner_color: 'from-emerald-600 to-green-500',
  },
  {
    id: 'm8',
    title: 'Qualidade do Combustível e Serviço',
    description: 'Avalie a honestidade nas bombas e a qualidade do atendimento no Posto Shell.',
    store_name: 'Posto Shell Arcoverde',
    cashback_amount: 0.20,
    category: 'Lojas da Cidade',
    banner_color: 'from-pink-600 to-purple-500',
    is_premium: true,
  },
  {
    id: 'm10',
    title: 'Calçados e Tempo de Espera',
    description: 'Avalie o tempo de recepção de calçados na loja física Carioca Calçados.',
    store_name: 'Carioca Calçados',
    cashback_amount: 0.20,
    category: 'Lojas da Cidade',
    banner_color: 'from-amber-600 to-yellow-500',
    is_premium: true,
  },
  {
    id: 'm11',
    title: 'Pesquisa Rápida: Filas de Espera',
    description: 'Responda rápido: Como estão as filas de pagamento no Supermercado Bonanza aos sábados?',
    store_name: 'Supermercado Bonanza',
    cashback_amount: 0.20,
    category: 'Supermercado',
    banner_color: 'from-slate-700 to-slate-600',
  },
  {
    id: 'm12',
    title: 'Pesquisa Rápida: Sacolinhas de Plástico',
    description: 'Você concorda em cobrar por sacolinhas biodegradáveis nos supermercados locais?',
    store_name: 'Novo Atacarejo',
    cashback_amount: 0.20,
    category: 'Supermercado',
    banner_color: 'from-slate-700 to-slate-600',
  }
];

// Preloaded mock accounts in localStorage fallback
const DEFAULT_USERS: User[] = [
  {
    id: 'citizen-arcoverde-1',
    username: 'leandro',
    name: 'Leandro José da Silva',
    password: '123',
    pixKey: '87999991111',
    ip: '177.105.15.42'
  }
];

class StorageService {
  constructor() {
    this.setupListeners();
  }

  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler do LocalStorage:', e);
    }
    return defaultValue;
  }

  private setStorageItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Erro ao salvar no LocalStorage:', e);
    }
  }

  // --- Real-Time Sync Setup with Firestore Databases ---
  private setupListeners() {
    // 1. Sync users
    onSnapshot(collection(firestoreDb, 'users'), (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      if (users.length > 0) {
        this.setStorageItem('cash_arcoverde_users', users);
      } else {
        // Se a coleção 'users' estiver nula/vazia em nuvem, popula com o administrador ou default user
        DEFAULT_USERS.forEach((usr) => {
          setDoc(doc(firestoreDb, 'users', usr.id), usr);
        });
      }
    });

    // 2. Sync missions
    onSnapshot(collection(firestoreDb, 'missions'), (snapshot) => {
      const missions: Mission[] = [];
      snapshot.forEach((doc) => {
        missions.push(doc.data() as Mission);
      });
      if (missions.length > 0) {
        this.setStorageItem('cash_arcoverde_missions', missions);
      } else {
        // Seed initial missions database on firebase firestore to keep user projects completely ready!
        DEFAULT_MISSIONS.forEach((m) => {
          setDoc(doc(firestoreDb, 'missions', m.id), m);
        });
      }
    });

    // 3. Sync transactions
    onSnapshot(collection(firestoreDb, 'transactions'), (snapshot) => {
      const transactions: Transaction[] = [];
      snapshot.forEach((doc) => {
        transactions.push(doc.data() as Transaction);
      });
      this.setStorageItem('cash_arcoverde_transactions', transactions);
    });

    // 4. Sync submissions
    onSnapshot(collection(firestoreDb, 'submissions'), (snapshot) => {
      const submissions: MissionSubmission[] = [];
      snapshot.forEach((doc) => {
        submissions.push(doc.data() as MissionSubmission);
      });
      this.setStorageItem('cash_arcoverde_submissions', submissions);
    });
  }

  // --- Dynamic Users & IP Rules ---
  getUsers(): User[] {
    const list = this.getStorageItem<User[]>('cash_arcoverde_users', []);
    if (list.length === 0) {
      return DEFAULT_USERS;
    }
    return list;
  }

  deleteUser(id: string): void {
    const users = this.getUsers();
    const updated = users.filter(u => u.id !== id);
    this.setStorageItem('cash_arcoverde_users', updated);
  }

  registerUser(name: string, username: string, passwordString: string, pixKey: string, ip: string): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    
    // Check if duplicate IP (apenas 1 cadastro para cada celular IP)
    const ipDuplicate = users.find(u => u.ip === ip);
    if (ipDuplicate) {
      return {
        success: false,
        message: `Aviso de Segurança: O endereço de IP de seu celular/dispositivo (${ip}) já possui um cadastro registrado sob '${ipDuplicate.username}'. Apenas 1 cadastro é permitido por celular para garantir a distribuição justa de empenhos comerciais de Arcoverde.`
      };
    }

    // Check if duplicate username
    const usernameDuplicate = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (usernameDuplicate) {
      return {
        success: false,
        message: `O nome de usuário '${username}' já está em uso comercial. Escolha outro.`
      };
    }

    const newUser: User = {
      id: `citizen-${Date.now()}`,
      username: username.toLowerCase().trim(),
      name: name.trim(),
      password: passwordString,
      pixKey: pixKey.trim(),
      ip: ip
    };

    // Save synchronously to local cache & asynchronously to Cloud Firestore
    users.push(newUser);
    this.setStorageItem('cash_arcoverde_users', users);
    setDoc(doc(firestoreDb, 'users', newUser.id), newUser);

    // Set this user as currently logged-in
    this.setCurrentUser(newUser);

    return {
      success: true,
      message: `Cadastro realizado com sucesso na nuvem! IP cadastrado: ${ip}. Seja bem-vindo ao Cash Arcoverde.`,
      user: newUser
    };
  }

  authenticateUser(usernameString: string, passwordString: string): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();
    const cleanUser = usernameString.toLowerCase().trim();
    const found = users.find(u => u.username === cleanUser && u.password === passwordString);
    
    if (found) {
      this.setCurrentUser(found);
      return {
        success: true,
        message: `Autenticado com sucesso! Carregando sua carteira conectada na nuvem.`,
        user: found
      };
    }

    return {
      success: false,
      message: 'Nome de usuário ou senha de acesso incorretos para o banco de dados Arcoverde.'
    };
  }

  getCurrentUser(): User | null {
    return this.getStorageItem<User | null>('cash_arcoverde_current_session_user', null);
  }

  setCurrentUser(user: User): void {
    this.setStorageItem('cash_arcoverde_current_session_user', user);
  }

  logOutUser(): void {
    localStorage.removeItem('cash_arcoverde_current_session_user');
  }

  // --- Transactions management ---
  getTransactions(): Transaction[] {
    return this.getStorageItem<Transaction[]>('cash_arcoverde_transactions', []);
  }

  saveTransactions(tx: Transaction[]): void {
    this.setStorageItem('cash_arcoverde_transactions', tx);
  }

  getMissions(): Mission[] {
    const missions = this.getStorageItem<Mission[]>('cash_arcoverde_missions', []);
    if (missions.length === 0) {
      return DEFAULT_MISSIONS;
    }
    return missions;
  }

  createMission(title: string, description: string, storeName: string, cashbackAmount: number, category: string, bannerColor: string, imageUrl: string): Mission {
    const missions = this.getMissions();
    const newMission: Mission = {
      id: `m-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      store_name: storeName.trim(),
      cashback_amount: cashbackAmount,
      category: category,
      banner_color: bannerColor || 'from-emerald-600 to-teal-600',
      image_url: imageUrl
    };
    missions.unshift(newMission);
    this.setStorageItem('cash_arcoverde_missions', missions);
    
    // Save to Firestore Database
    setDoc(doc(firestoreDb, 'missions', newMission.id), newMission);

    // Notify listeners
    window.dispatchEvent(new Event('missions_updated'));

    return newMission;
  }

  deleteMission(id: string): void {
    const missions = this.getMissions();
    const updated = missions.filter(m => m.id !== id);
    this.setStorageItem('cash_arcoverde_missions', updated);
    
    // Remove from Firestore Database
    import('firebase/firestore').then(({ deleteDoc, doc }) => {
      deleteDoc(doc(firestoreDb, 'missions', id));
    });

    // Notify listeners
    window.dispatchEvent(new Event('missions_updated'));
  }

  getSubmissions(): MissionSubmission[] {
    return this.getStorageItem<MissionSubmission[]>('cash_arcoverde_submissions', []);
  }

  saveSubmissions(subs: MissionSubmission[]): void {
    this.setStorageItem('cash_arcoverde_submissions', subs);
  }

  getWalletBalance(): number {
    const tx = this.getTransactions();
    const activeUser = this.getCurrentUser();
    if (!activeUser) return 0;
    
    return tx
      .filter(t => t.user_id === activeUser.id && (t.status === 'completed' || t.status === 'pending'))
      .reduce((acc, curr) => {
        if (curr.type === 'cashback') {
          return acc + curr.amount;
        } else {
          return acc - curr.amount;
        }
      }, 0);
  }

  getPendingWithdrawalsAmount(): number {
    const tx = this.getTransactions();
    const activeUser = this.getCurrentUser();
    if (!activeUser) return 0;
    return tx
      .filter(curr => curr.user_id === activeUser.id && curr.type === 'withdrawal' && curr.status === 'pending')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }

  addTransaction(
    amount: number, 
    type: 'cashback' | 'withdrawal', 
    description: string, 
    pix_key_type?: string, 
    pix_key?: string,
    providedUserId?: string,
    providedUserName?: string
  ): Transaction {
    const transactions = this.getTransactions();
    const u = this.getCurrentUser();
    
    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: providedUserId || u?.id || 'anonymous',
      user_name: providedUserName || u?.name || 'Cidadão',
      amount,
      type,
      status: 'pending', 
      description,
      created_at: new Date().toISOString(),
      pix_key_type: pix_key_type || '',
      pix_key: pix_key || '',
    };
    
    if (type === 'cashback') {
      newTx.status = 'completed';
    }

    transactions.unshift(newTx);
    this.saveTransactions(transactions);

    // Save to Firestore
    setDoc(doc(firestoreDb, 'transactions', newTx.id), newTx);
    
    // Notify listeners
    window.dispatchEvent(new Event('transactions_updated'));

    return newTx;
  }

  getUserLastSurveyCompletion(): string | null {
    return localStorage.getItem('cash_arcoverde_last_survey_completion');
  }

  setUserLastSurveyCompletion(time: string): void {
    localStorage.setItem('cash_arcoverde_last_survey_completion', time);
  }

  isUserOnCooldown(): { onCooldown: boolean; remainingMs?: number } {
    const submissions = this.getSubmissions();
    const activeUser = this.getCurrentUser();
    if (!activeUser) return { onCooldown: false };

    const eightHoursMs = 8 * 60 * 60 * 1000;
    const now = Date.now();

    const userSubmissions = submissions.filter(
      s => s.user_id === activeUser.id && (now - new Date(s.created_at).getTime()) < eightHoursMs
    );

    if (userSubmissions.length >= 10) {
      // Find the oldest submission in the current 8h window to calculate remaining time
      const oldestSub = userSubmissions.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
      const remainingMs = eightHoursMs - (now - new Date(oldestSub.created_at).getTime());
      return { onCooldown: true, remainingMs: Math.max(0, remainingMs) };
    }

    return { onCooldown: false };
  }

  isSurveyOnCooldown(missionId: string): boolean {
    const cooldowns = this.getSurveyCooldowns();
    const activeUser = this.getCurrentUser();
    if (!activeUser) return false;
    const cooldownKey = `${activeUser.id}-${missionId}`;
    let untilStr = cooldowns[cooldownKey];
    
    if (untilStr === 'unlocked') {
      return false;
    }
    
    if (!untilStr) {
      const missions = this.getMissions();
      const mission = missions.find(m => m.id === missionId);
      if (mission?.is_premium) {
        // Init cooldown
        const limit = new Date(Date.now() + 6 * 60 * 60 * 1000);
        cooldowns[cooldownKey] = limit.toISOString();
        this.saveSurveyCooldowns(cooldowns);
        untilStr = limit.toISOString();
      }
    }

    if (!untilStr) return false;
    const until = new Date(untilStr);
    return until.getTime() > Date.now();
  }

  setSurveyCooldown(missionId: string): void {
    const cooldowns = this.getSurveyCooldowns();
    const activeUser = this.getCurrentUser();
    if (!activeUser) return;
    const cooldownKey = `${activeUser.id}-${missionId}`;
    const limit = new Date(Date.now() + 6 * 60 * 60 * 1000);
    cooldowns[cooldownKey] = limit.toISOString();
    this.saveSurveyCooldowns(cooldowns);
  }

  removeSurveyCooldown(missionId: string): void {
    const cooldowns = this.getSurveyCooldowns();
    const activeUser = this.getCurrentUser();
    if (!activeUser) return;
    const cooldownKey = `${activeUser.id}-${missionId}`;
    cooldowns[cooldownKey] = 'unlocked';
    this.saveSurveyCooldowns(cooldowns);
  }

  submitSurveyAnswer(missionId: string, rating: number, comment: string): MissionSubmission {
    const missions = this.getMissions();
    const targetMission = missions.find(m => m.id === missionId);
    if (!targetMission) {
      throw new Error('Pesquisa não encontrada');
    }

    const u = this.getCurrentUser();
    if (!u) throw new Error('Usuário não logado');

    const submissions = this.getSubmissions();
    const newSubmission: MissionSubmission = {
      id: `sub-${Date.now()}`,
      user_id: u.id,
      mission_id: missionId,
      mission_title: targetMission.title,
      store_name: targetMission.store_name,
      cashback_amount: targetMission.cashback_amount,
      notes: comment,
      proof_file_name: 'Avaliação Digital (Opnião)',
      proof_file_data: '',
      status: 'completed', 
      created_at: new Date().toISOString(),
      rating: rating
    };

    submissions.unshift(newSubmission);
    this.saveSubmissions(submissions);

    // Write to Firestore Database
    setDoc(doc(firestoreDb, 'submissions', newSubmission.id), newSubmission);

    // Register global 8h cooldown
    this.setUserLastSurveyCompletion(new Date().toISOString());

    // Also register cash transaction to Firestore and local balance
    this.addTransaction(
      targetMission.cashback_amount,
      'cashback',
      `Pesquisa Premiada: ${targetMission.store_name} — Feedback de Qualidade`,
      undefined,
      undefined,
      u.id,
      u.name
    );

    return newSubmission;
  }

  submitMission(missionId: string, notes: string, proofFileName: string, proofFileDataUrl?: string): MissionSubmission {
    const missions = this.getMissions();
    const targetMission = missions.find(m => m.id === missionId);
    if (!targetMission) {
      throw new Error('Missão não encontrada');
    }

    const u = this.getCurrentUser();
    if (!u) throw new Error('Usuário não autenticado');

    const submissions = this.getSubmissions();
    const newSubmission: MissionSubmission = {
      id: `sub-${Date.now()}`,
      user_id: u.id,
      mission_id: missionId,
      mission_title: targetMission.title,
      store_name: targetMission.store_name,
      cashback_amount: targetMission.cashback_amount,
      notes,
      proof_file_name: proofFileName,
      proof_file_data: proofFileDataUrl,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    submissions.unshift(newSubmission);
    this.saveSubmissions(submissions);

    // Write to Firestore Database
    setDoc(doc(firestoreDb, 'submissions', newSubmission.id), newSubmission);

    // Register pending transaction in Local & Cloud Firestore
    this.addTransaction(
      targetMission.cashback_amount,
      'cashback',
      `Cashback em análise: ${targetMission.title} - ${targetMission.store_name}`,
      undefined,
      undefined,
      u.id,
      u.name
    );

    return newSubmission;
  }

  redeemCouponCode(code: string): { success: boolean; message: string; amount?: number } {
    const cleanCode = code.toUpperCase().trim();
    const missions = this.getMissions();
    const foundMission = missions.find(m => m.id === cleanCode);

    if (!foundMission) {
      return {
        success: false,
        message: 'Código de cupom Arcoverde inválido ou expirado.'
      };
    }

    const u = this.getCurrentUser();
    if (!u) return { success: false, message: 'Usuário não autenticado.' };

    const txs = this.getTransactions();
    const alreadyRedeemed = txs.some(
      t => t.user_id === u.id && t.type === 'cashback' && t.status === 'completed' && t.description.includes(`Cupom ${cleanCode}`)
    );

    if (alreadyRedeemed) {
      return {
        success: false,
        message: `Você já faturou o cupom ${cleanCode} nas lojas ${foundMission.store_name}!`
      };
    }

    this.addTransaction(
      foundMission.cashback_amount,
      'cashback',
      `Cupom ${cleanCode} resgatado - Cashback ${foundMission.store_name}`,
      undefined,
      undefined,
      u.id,
      u.name
    );

    return {
      success: true,
      message: `Sucesso! R$ ${foundMission.cashback_amount.toFixed(2)} adicionados à sua carteira Cash Arcoverde.`,
      amount: foundMission.cashback_amount
    };
  }

  // --- Admin Database Operations on Cloud Firestore ---
  adminApproveWithdrawal(txId: string): void {
    const transactions = this.getTransactions();
    const tx = transactions.find(t => t.id === txId);
    if (tx) {
      tx.status = 'completed';
      this.saveTransactions(transactions);
      
      // Update in Real Time with Firestore
      updateDoc(doc(firestoreDb, 'transactions', txId), { status: 'completed' });
    }
  }

  adminRejectWithdrawal(txId: string): void {
    const transactions = this.getTransactions();
    const tx = transactions.find(t => t.id === txId);
    if (tx) {
      tx.status = 'rejected';
      this.saveTransactions(transactions);

      // Update in Real Time with Firestore
      updateDoc(doc(firestoreDb, 'transactions', txId), { status: 'rejected' });
    }
  }

  adminEvaluateMission(subId: string, action: 'approve' | 'reject', feedbackText?: string): void {
    const submissions = this.getSubmissions();
    const subIndex = submissions.findIndex(s => s.id === subId);
    if (subIndex === -1) return;

    const sub = submissions[subIndex];
    const newStatus = action === 'approve' ? 'completed' : 'rejected';
    const feedback = feedbackText || (action === 'approve' ? 'Opinião auditada e saldo creditado!' : 'Comentário ou feedback inválido.');

    sub.status = newStatus;
    sub.admin_feedback = feedback;
    this.saveSubmissions(submissions);

    // Update in Firestore Database
    updateDoc(doc(firestoreDb, 'submissions', subId), {
      status: newStatus,
      admin_feedback: feedback
    });
  }

  resetData(): void {
    localStorage.removeItem('cash_arcoverde_transactions');
    localStorage.removeItem('cash_arcoverde_submissions');
    localStorage.removeItem('cash_arcoverde_missions');
  }
}

export const db = new StorageService();
