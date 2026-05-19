import { useState } from 'react';
import { UserProfile, Video, Campaign } from '../types';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Upload, Plus, Play, Info, CheckCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export function SponsorDashboard({ profile }: { profile: UserProfile | null }) {
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    videoUrl: '',
    description: '',
    rewardAmount: 50,
    budget: 5000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      // Create Video
      const videoRef = await addDoc(collection(db, 'videos'), {
        ...formData,
        sponsorId: profile.displayName || profile.uid,
        thumbnailUrl: '',
        views: 0,
        category: 'Sponsored',
        isActive: true,
        createdAt: new Date().toISOString()
      });

      // Create Campaign
      await addDoc(collection(db, 'campaigns'), {
        sponsorId: profile.uid,
        title: formData.title,
        budget: formData.budget,
        spent: 0,
        videoId: videoRef.id,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      toast.success('Campaign launched successfully!');
      setShowAdd(false);
      setFormData({ title: '', videoUrl: '', description: '', rewardAmount: 50, budget: 5000 });
    } catch (err) {
      toast.error('Failed to create campaign');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic tracking-tight flex items-center gap-3">
          <BarChart3 className="text-brand" />
          Sponsor Hub
        </h2>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAdd(!showAdd)}
          className="bg-brand p-3 rounded-2xl shadow-lg shadow-brand/20"
        >
          {showAdd ? <Plus className="rotate-45" /> : <Plus />}
        </motion.button>
      </div>

      {showAdd && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-4"
        >
          <div className="text-center space-y-1 mb-4">
            <h3 className="font-bold">New Ad Campaign</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Reach thousands of engaged viewers</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40">Ad Title</label>
              <input 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-medium focus:border-brand/50 outline-none"
                placeholder="e.g. New Product Launch"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 font-mono">Video URL (MP4)</label>
              <input 
                value={formData.videoUrl}
                onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-mono text-sm focus:border-brand/50 outline-none"
                placeholder="https://..."
                required
              />
              <p className="text-[9px] text-white/30 flex items-center gap-1"><Info size={10} /> Must be a direct video file link</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40">Price per view</label>
                <input 
                  type="number"
                  value={formData.rewardAmount}
                  onChange={e => setFormData({...formData, rewardAmount: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold focus:border-brand/50 outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/40">Total Budget</label>
                <input 
                  type="number"
                  value={formData.budget}
                  onChange={e => setFormData({...formData, budget: Number(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold focus:border-brand/50 outline-none"
                  required
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Launch Ad'}
            </button>
          </form>
        </motion.div>
      )}

      {/* Campaign Stats Overview */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Impressions" val="12.5K" color="text-blue-400" />
        <StatCard label="Earnings Paid" val="৳450" color="text-green-400" />
        <StatCard label="CTR" val="3.2%" color="text-brand" />
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase text-white/30 tracking-widest">Active Campaigns</h4>
        <div className="space-y-3">
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-16 h-20 bg-white/5 rounded-xl overflow-hidden relative">
               <div className="absolute inset-0 flex items-center justify-center"><Play size={20} className="text-white/20" /></div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">Organic Coffee Shop Ad</span>
                <span className="text-[8px] px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded-full border border-green-500/30 font-black uppercase">Active</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full mt-2">
                 <div className="h-full bg-brand w-2/3 rounded-full" />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase">
                 <span>Spent: ৳334</span>
                 <span>Budget: ৳500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-brand/10 border border-brand/20 rounded-3xl space-y-3">
        <h3 className="font-black italic flex items-center gap-2 text-brand">
          <CheckCircle size={18} />
          High Quality Traffic
        </h3>
        <p className="text-[11px] leading-relaxed text-white/60">
          Our AI verification ensures that your budget is spent only on real human views. Bots, VPNs, and multiple accounts from the same device are automatically filtered out.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, val, color }: { label: string, val: string, color: string }) {
  return (
    <div className="glass-card p-4 text-center space-y-1">
      <div className={color + " text-lg font-black"}>{val}</div>
      <div className="text-[8px] text-white/40 uppercase tracking-widest font-black leading-tight">{label}</div>
    </div>
  );
}
