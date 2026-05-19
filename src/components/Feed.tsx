import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Video, UserProfile } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { motion } from 'framer-motion';

export function Feed({ profile }: { profile: UserProfile | null }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const q = query(
          collection(db, 'videos'),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        const vidData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video));
        
        if (vidData.length === 0) {
          // Placeholder videos if DB is empty
          vidData.push({
            id: 'placeholder-1',
            title: 'Welcome to OneEarn',
            description: 'Start watching to earn coins!',
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            thumbnailUrl: '',
            sponsorId: 'system',
            rewardAmount: 50,
            duration: 15,
            views: 0,
            category: 'Welcome',
            createdAt: new Date().toISOString()
          },
          {
            id: 'placeholder-2',
            title: 'Earn real money',
            description: 'Withdraw to bKash or Nagad instantly.',
            videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
            thumbnailUrl: '',
            sponsorId: 'system',
            rewardAmount: 100,
            duration: 15,
            views: 0,
            category: 'Education',
            createdAt: new Date().toISOString()
          });
        }
        
        setVideos(vidData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth p-0 m-0 no-scrollbar"
    >
      {videos.map((video) => (
        <section key={video.id} className="h-full w-full snap-start relative">
          <VideoPlayer video={video} profile={profile} />
        </section>
      ))}
    </div>
  );
}
