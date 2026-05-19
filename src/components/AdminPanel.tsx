import { useState, useEffect } from 'react';
import { UserProfile, Transaction } from '../types';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Users, Wallet, AlertOctagon, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export function AdminPanel({ profile }: { profile: UserProfile | null }) {
  const [pendingTx, setPendingTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    const q = query(
      collection(db, 'transactions'),
      where('status', '==', 'pending'),
      where('type', '==', 'withdrawal'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    setPendingTx(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleStatus = async (txId: string, status: 'completed' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'transactions', txId), { status });
      toast.success(`Transaction ${status}`);
      fetchPending();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 pb-20">
      <h2 className="text-2xl font-black italic tracking-tight flex items-center gap-3">
        <AlertOctagon className="text-brand" />
        Admin Control
      </h2>

      {/* Admin Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 space-y-2">
          <div className="flex justify-between items-center text-white/40"><Users size={18} /><TrendingUp size={14} className="text-green-500" /></div>
          <div className="text-2xl font-black">1.2K</div>
          <div className="text-[10px] font-black uppercase tracking-widest">Active Users</div>
        </div>
        <div className="glass-card p-5 space-y-2">
          <div className="flex justify-between items-center text-white/40"><Wallet size={18} /></div>
          <div className="text-2xl font-black">৳12.5K</div>
          <div className="text-[10px] font-black uppercase tracking-widest">Payout Pool</div>
        </div>
      </div>

      {/* Pending Withdrawals */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-white/30 tracking-widest flex items-center justify-between">
          Active Payout Requests
          <span className="bg-brand text-white px-2 py-0.5 rounded-full text-[9px]">{pendingTx.length}</span>
        </h3>
        
        <div className="space-y-3">
          {pendingTx.length === 0 ? (
            <div className="text-center py-10 glass-card text-white/20 font-bold uppercase text-[10px]">All clear! No pending requests</div>
          ) : (
            pendingTx.map(tx => (
              <motion.div 
                layout
                key={tx.id} 
                className="glass-card p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">৳{(tx.amount / 100).toFixed(2)} payout</div>
                    <div className="text-[10px] text-white/40 font-mono tracking-tighter uppercase">{tx.method}: {tx.accountNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-brand uppercase tracking-tighter">{tx.amount} coins</div>
                    <div className="text-[9px] text-white/20 uppercase font-black">{new Date(tx.createdAt).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleStatus(tx.id, 'completed')}
                    className="flex-1 bg-green-500/20 text-green-500 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-green-500/30 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button 
                    onClick={() => handleStatus(tx.id, 'rejected')}
                    className="flex-1 bg-red-500/20 text-red-500 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Fraud Monitoring */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-white/30 tracking-widest">Fraud Watch</h3>
        <div className="glass-card p-6 border-red-500/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase">Real-time Anomaly Detection</span>
            </div>
          </div>
          <div className="space-y-3">
             <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-white/60">Suspicious Activity (Today)</span>
                <span className="text-xs font-black text-red-400">22 Incidents</span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-white/60">Auto-Banned Accounts</span>
                <span className="text-xs font-black text-red-400">12 </span>
             </div>
             <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-xs text-white/60">VPN Usage Detected</span>
                <span className="text-xs font-black text-red-400">8 Attempts</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
