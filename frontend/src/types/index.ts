export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  avatar?: string | null;
  role: 'citizen' | 'official' | 'admin';
  departments: number[];
  department_names: string;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  complaint: number | null;
  complaint_title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface OfficialStat {
  official: string;
  department: string;
  total: number;
  resolved: number;
  resolution_rate: number;
  avg_satisfaction: number;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  complaint_count?: number;
}

export interface Ward {
  id: number;
  name: string;
  sub_county: string;
  is_active: boolean;
  complaint_count?: number;
}

export interface Complaint {
  id: number;
  citizen: number;
  citizen_name: string;
  category: number;
  category_name: string;
  ward: number | null;
  ward_name: string | null;
  title: string;
  description?: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  image?: string | null;
  status: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  status_history?: StatusHistory[];
  feedback?: Feedback;
}

export interface StatusHistory {
  id: number;
  old_status: string;
  new_status: string;
  changed_by: number;
  changed_by_name: string;
  notes: string;
  changed_at: string;
}

export interface Feedback {
  id: number;
  complaint: number;
  citizen: number;
  citizen_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface SummaryStats {
  total_complaints: number;
  open_complaints: number;
  resolved_complaints: number;
  closed_complaints: number;
  resolution_rate: number;
  avg_response_time_hours: number;
  avg_resolution_time_hours: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  resolved: number;
  resolution_rate: number;
  avg_satisfaction?: number;
}

export interface WardStat {
  ward: string;
  count: number;
  resolved: number;
  resolution_rate: number;
}

export interface TrendData {
  date: string;
  count: number;
}

export interface SUSResponse {
  id?: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: number;
  q10: number;
  sus_score?: number;
}

export interface SUSAnalytics {
  total_responses: number;
  average_sus_score: number;
  median_sus_score: number;
  min_sus_score: number;
  max_sus_score: number;
  std_dev: number;
  grade: string;
  acceptability: string;
  question_averages: Record<string, number>;
  score_distribution: { range: string; count: number }[];
}
