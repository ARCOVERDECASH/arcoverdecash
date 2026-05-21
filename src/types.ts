/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  user_id: string;
  user_name?: string;
  amount: number;
  type: 'cashback' | 'withdrawal';
  status: 'pending' | 'completed' | 'rejected';
  description: string;
  created_at: string;
  pix_key_type?: string;
  pix_key?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  password?: string;
  pixKey?: string;
  ip?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  store_name: string;
  cashback_amount: number;
  min_spend?: number;
  reward_percentage?: number;
  code?: string;
  category: string;
  banner_color?: string;
  is_premium?: boolean;
  image_url?: string;
}

export interface MissionSubmission {
  id: string;
  user_id: string;
  mission_id: string;
  mission_title: string;
  store_name: string;
  cashback_amount: number;
  notes: string;
  proof_file_name: string;
  proof_file_data?: string; // base64 representation of proof images, or a mock URL
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  admin_feedback?: string;
  rating?: number; // Store rating (e.g., 1 to 5 stars)
}

export interface CouponResponse {
  success: boolean;
  message: string;
  cashback_amount?: number;
}
