export type UserRole = 'user' | 'sponsor' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  walletBalance: number;
  referralCode: string;
  referredBy?: string;
  dailyEarnings: number;
  lastEarningReset: string;
  role: UserRole;
  fraudScore: number;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  sponsorId: string;
  rewardAmount: number; // in coins
  duration: number; // in seconds
  views: number;
  category: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earning' | 'withdrawal' | 'recharge' | 'referral';
  status: 'pending' | 'completed' | 'rejected';
  method: 'bKash' | 'Nagad' | 'Mobile Recharge' | 'System';
  accountNumber?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  sponsorId: string;
  title: string;
  budget: number;
  spent: number;
  videoId: string;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}
