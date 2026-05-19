/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Wallet, PlusSquare, BarChart2, User as UserIcon, LogIn } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Feed } from './components/Feed';
import { WalletView } from './components/WalletView';
import { SponsorDashboard } from './components/SponsorDashboard';
import { AdminPanel } from './components/AdminPanel';
import { Profile } from './components/Profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'wallet' | 'upload' | 'stats' | 'profile'>('home');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch/Init Profile
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL || undefined,
            walletBalance: 0,
            referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            dailyEarnings: 0,
            lastEarningReset: new Date().toISOString(),
            role: 'user',
            fraudScore: 0,
            createdAt: new Date().toISOString()
          };
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }

        // Real-time updates for balance
        onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as UserProfile);
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error('Login failed');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-brand font-bold text-2xl tracking-widest"
        >
          ONE EARN
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen relative flex items-center justify-center bg-black overflow-hidden px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#ff4e0033,transparent_60%)]" />
        <div className="relative text-center space-y-8 max-w-md">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-2"
          >
            <h1 className="text-6xl font-black italic tracking-tighter text-brand">OneEarn</h1>
            <p className="text-white/60 font-medium">Watch. Earn. Reward. repeat.</p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <LogIn size={20} />
            Continue with Google
          </motion.button>
          <div className="text-white/30 text-xs px-4 leading-relaxed">
            By signing up, you agree to our Terms of Service and Anti-Fraud Policy. 
            OneEarn uses AI to verify watch quality.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <Feed key="feed" profile={profile} />}
          {activeTab === 'wallet' && <WalletView key="wallet" profile={profile} />}
          {activeTab === 'upload' && <SponsorDashboard key="sponsor" profile={profile} />}
          {activeTab === 'stats' && profile?.role === 'admin' ? (
            <AdminPanel key="admin" profile={profile} />
          ) : activeTab === 'stats' ? (
            <div className="p-10 text-center text-white/50">Admin Only Access</div>
          ) : null}
          {activeTab === 'profile' && <Profile key="profile" profile={profile} />}
        </AnimatePresence>
      </main>

      {/* Nav Bar */}
      <nav className="h-20 bg-black/80 backdrop-blur-lg border-t border-white/5 safe-bottom z-50">
        <div className="max-w-md mx-auto h-full flex items-center justify-around px-4">
          <NavItem icon={<Home />} active={activeTab === 'home'} onClick={() => setActiveTab('home')} label="Feed" />
          <NavItem icon={<Wallet />} active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} label="Wallet" />
          
          {(profile?.role === 'sponsor' || profile?.role === 'admin') && (
             <NavItem icon={<PlusSquare />} active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} label="Upload" />
          )}

          {profile?.role === 'admin' && (
            <NavItem icon={<BarChart2 />} active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} label="Admin" />
          )}

          <NavItem icon={<UserIcon />} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Profile" />
        </div>
      </nav>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

function NavItem({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-brand scale-110' : 'text-white/40 hover:text-white'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div layoutId="nav-pill" className="w-1 h-1 rounded-full bg-brand" />
      )}
    </button>
  );
}

