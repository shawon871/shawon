import { useState, useEffect, useRef } from 'react';
import { Video, UserProfile } from '../types';
import { motion, useAnimation } from 'framer-motion';
import { Heart, MessageCircle, Share2, DollarSign, Play, Pause, AlertCircle } from 'lucide-react';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export function VideoPlayer({ video, profile }: { video: Video, profile: UserProfile | null }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [watched, setWatched] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const coinsAnim = useAnimation();

  // Behavior tracking for AI
  const [events, setEvents] = useState<{ t: number, e: string }[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => setPlaying(false));
          setPlaying(true);
        } else {
          videoRef.current?.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.8 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);

      if (p > 90 && !watched) {
        setWatched(true);
        verifyAndReward();
      }
    }
  };

  const verifyAndReward = async () => {
    if (!profile || rewardClaimed) return;

    // Call server API for AI verification
    try {
      const res = await fetch('/api/verify-watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.id,
          watchDuration: videoRef.current?.currentTime,
          eventBatch: events,
          userId: profile.uid
        })
      });
      const data = await res.json();

      if (data.isLegitimate) {
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          walletBalance: increment(video.rewardAmount),
          dailyEarnings: increment(video.rewardAmount)
        });

        // Log transaction
        await addDoc(collection(db, 'transactions'), {
          userId: profile.uid,
          amount: video.rewardAmount,
          type: 'earning',
          status: 'completed',
          method: 'System',
          createdAt: new Date().toISOString()
        });

        setRewardClaimed(true);
        toast.success(`You earned ${video.rewardAmount} coins!`);
        coinsAnim.start({
          y: [-20, -100],
          opacity: [1, 0, 0],
          scale: [1, 1.5],
          transition: { duration: 1 }
        });
      } else {
        toast.error('AI detected unusual activity. Reward suspended.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const logEvent = (e: string) => {
    setEvents(prev => [...prev, { t: Date.now(), e }]);
  };

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setPlaying(true);
      logEvent('play');
    } else {
      videoRef.current?.pause();
      setPlaying(false);
      logEvent('pause');
    }
  };

  return (
    <div className="h-full w-full relative bg-black group" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={video.videoUrl}
        className="h-full w-full object-cover"
        loop
        playsInline
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Overlays */}
      <div className="absolute inset-x-0 bottom-0 gradient-overlay h-1/2 pointer-events-none" />

      {/* UI Elements */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-12 space-y-4 pointer-events-none">
        <div className="flex justify-between items-end">
          {/* Info */}
          <div className="flex-1 space-y-2 pointer-events-auto">
            <h3 className="text-xl font-bold flex items-center gap-2">
              @{video.sponsorId} 
              <span className="text-[10px] bg-brand/20 text-brand px-2 py-0.5 rounded-full uppercase border border-brand/30">Sponsored</span>
            </h3>
            <p className="text-sm text-white/80 line-clamp-2">{video.description}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-6 pointer-events-auto ml-4">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand/20 transition-colors">
                <Heart fill={watched ? "#ff4e00" : "none"} stroke={watched ? "#ff4e00" : "currentColor"} />
              </div>
              <span className="text-xs font-bold">{video.views > 1000 ? (video.views/1000).toFixed(1)+'K' : video.views}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <MessageCircle />
              </div>
              <span className="text-xs font-bold">42</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Share2 />
              </div>
              <span className="text-xs font-bold">Share</span>
            </div>
          </div>
        </div>

        {/* Reward Progress */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-brand">
            <span>Watch Progress</span>
            <span className="flex items-center gap-1">
              <DollarSign size={10} />
              {rewardClaimed ? 'Reward Claimed' : `${video.rewardAmount} Coins Available`}
            </span>
          </div>
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-brand"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Floating Coins Animation */}
      <motion.div 
        animate={coinsAnim}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 flex flex-col items-center"
      >
        <div className="text-brand font-black text-6xl drop-shadow-[0_0_20px_rgba(255,78,0,0.5)]">
          +{video.rewardAmount}
        </div>
        <div className="text-brand text-xl font-bold">COINS!</div>
      </motion.div>

      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <Play size={80} className="text-white/40" />
        </div>
      )}
    </div>
  );
}
