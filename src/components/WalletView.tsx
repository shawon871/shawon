import { useState, useEffect } from 'react';
import { UserProfile, Transaction } from '../types';
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Smartphone, History, CreditCard, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function WalletView({ profile }: { profile: UserProfile | null }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad' | 'Mobile Recharge'>('bKash');
  const [account, setAccount] = useState('');

  const takaAmount = (profile?.walletBalance || 0) / 100;

  useEffect(() => {
    if (!profile) return;
    const fetchTx = async () => {
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', profile.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    };
    fetchTx();
  }, [profile]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const coinAmount = Number(amount);
    if (coinAmount < 1000) {
      toast.error('Minimum withdrawal is 1,000 coins (10 Taka)');
      return;
    }
    if (coinAmount > profile.walletBalance) {
      toast.error('Insufficient coins');
      return;
    }

    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        walletBalance: increment(-coinAmount)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: profile.uid,
        amount: coinAmount,
        type: 'withdrawal',
        status: 'pending',
        method: method,
        accountNumber: account,
        createdAt: new Date().toISOString()
      });

      toast.success('Withdrawal request submitted!');
      setAmount('');
      setAccount('');
    } catch (err) {
      toast.error('Failed to process withdrawal');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 pb-20">
      {/* Balance Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card p-8 bg-brand/10 border-brand/20 flex flex-col items-center text-center space-y-2"
      >
        <div className="text-white/60 font-bold uppercase tracking-widest text-xs">Total Balance</div>
        <div className="text-5xl font-black text-brand flex items-baseline gap-2">
          {profile?.walletBalance.toLocaleString()}
          <span className="text-sm font-bold text-white/40">COINS</span>
        </div>
        <div className="text-2xl font-bold text-white/80">
          ≈ ৳ {takaAmount.toFixed(2)}
        </div>
        <div className="flex gap-2 mt-4">
           <div className="px-4 py-1 bg-white/5 rounded-full text-[10px] font-bold text-white/50 border border-white/10 uppercase">
             100 Coins = 1 Taka
           </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-xl text-green-500"><ArrowDownLeft size={20} /></div>
          <div>
            <div className="text-[10px] text-white/40 font-bold">Daily Earnings</div>
            <div className="font-bold">{profile?.dailyEarnings}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="p-2 bg-brand/20 rounded-xl text-brand"><Smartphone size={20} /></div>
          <div>
            <div className="text-[10px] text-white/40 font-bold">Referrals</div>
            <div className="font-bold">0</div>
          </div>
        </div>
      </div>

      {/* Withdrawal Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CreditCard size={20} className="text-brand" />
          Withdraw Funds
        </h3>
        <form onSubmit={handleWithdraw} className="glass-card p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase">Method</label>
            <div className="flex gap-2">
              {['bKash', 'Nagad', 'Mobile Recharge'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m as any)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${method === m ? 'bg-brand border-brand text-white shadow-[0_0_15px_rgba(255,78,0,0.3)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase">Account Number</label>
            <input 
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-bold"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase">Amount (Coins)</label>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Min 1,000"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-bold"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-brand text-white rounded-xl font-black uppercase tracking-widest shadow-lg hover:shadow-brand/20 transition-all active:scale-95"
          >
            Submit Request
          </button>
        </form>
      </div>

      {/* Transactions History */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <History size={20} className="text-brand" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-white/20 font-bold uppercase tracking-widest text-xs">No transactions yet</div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${tx.type === 'earning' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {tx.type === 'earning' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={10} />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</div>
                    <div className="text-[10px] text-white/30">{new Date(tx.createdAt).toLocaleDateString()} • {tx.method}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${tx.type === 'earning' ? 'text-green-500' : 'text-red-400'}`}>
                    {tx.type === 'earning' ? '+' : '-'}{tx.amount}
                  </div>
                  <div className={`text-[9px] font-black uppercase tracking-widest ${tx.status === 'completed' ? 'text-green-500' : tx.status === 'pending' ? 'text-yellow-500' : 'text-red-500'}`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fraud Notice */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex gap-3">
        <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
        <p className="text-[10px] text-yellow-500/80 leading-relaxed font-medium">
          <strong>Security Notice:</strong> Withdrawals are subject to AI manual review. 
          Use of VPNs, emulators, or automation will result in immediate ban and forfeiture of balance.
        </p>
      </div>
    </div>
  );
}
