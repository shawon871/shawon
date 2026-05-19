import { auth } from '../lib/firebase';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';
import { LogOut, Settings, Award, Shield, Users, Mail, Bell, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function Profile({ profile }: { profile: UserProfile | null }) {
  if (!profile) return null;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 pb-20">
      <div className="flex flex-col items-center text-center space-y-4 py-6">
        <div className="relative">
          <div className="w-28 h-28 rounded-full border-4 border-brand/30 p-1">
            <img 
              src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
              className="w-full h-full rounded-full object-cover bg-white/10 shadow-[0_0_30px_rgba(255,78,0,0.2)]" 
              alt="Avatar"
            />
          </div>
          <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-black flex items-center justify-center">
            <ShieldCheck size={10} className="text-white" />
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-black italic tracking-tight">{profile.displayName}</h2>
          <div className="flex items-center justify-center gap-2 text-white/40 text-xs font-bold uppercase mt-1">
            <Mail size={12} />
            {profile.email}
          </div>
          <div className="mt-2 inline-block px-3 py-1 bg-brand/20 text-brand text-[10px] font-black uppercase rounded-full border border-brand/30 tracking-widest">
            {profile.role} account
          </div>
        </div>
      </div>

      {/* Rewards Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl mb-3"><Award size={24} /></div>
          <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Total Earned</div>
          <div className="text-xl font-black">৳{(profile.walletBalance / 100 + 120).toFixed(2)}</div>
        </div>
        <div className="glass-card p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl mb-3"><Users size={24} /></div>
          <div className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Referral Code</div>
          <div className="text-xl font-black">{profile.referralCode}</div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-2">
        <MenuButton icon={<Settings size={20} />} label="Settings" />
        <MenuButton icon={<Bell size={20} />} label="Notifications" badge="3" />
        <MenuButton icon={<Shield size={20} />} label="Anti-Fraud Status" sub="Verified" />
        <MenuButton 
          icon={<LogOut size={20} />} 
          label="Logout" 
          danger 
          onClick={() => {
            auth.signOut();
            toast.info('Logged out');
          }} 
        />
      </div>

      <div className="text-center space-y-1 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">OneEarn Bangladesh v1.0</div>
        <div className="text-[9px] text-white/10">Connected to Universal Cloud Engine</div>
      </div>
    </div>
  );
}

function MenuButton({ icon, label, sub, danger, onClick, badge }: { icon: React.ReactNode, label: string, sub?: string, danger?: boolean, onClick?: () => void, badge?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all ${danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/70 hover:bg-white/5'} glass-card border-none`}
    >
      <div className="flex items-center gap-4">
        <div className={danger ? 'text-red-400' : 'text-brand'}>{icon}</div>
        <span className="font-bold text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {sub && <span className="text-[10px] font-black uppercase text-brand bg-brand/10 px-2 py-0.5 rounded-full">{sub}</span>}
        {badge && <span className="bg-brand text-white text-[10px] font-black px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
    </button>
  );
}
