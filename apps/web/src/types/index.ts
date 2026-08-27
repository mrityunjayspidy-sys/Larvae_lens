export type UserRole = 'citizen' | 'field_worker' | 'reviewer' | 'admin';

export type ScanStatus = 
  | 'queued' 
  | 'validating' 
  | 'detecting' 
  | 'verifying' 
  | 'tracking' 
  | 'completed' 
  | 'retake_required' 
  | 'failed';

export type RiskLevel = 'none_observed' | 'low' | 'medium' | 'high';

export type VideoQuality = 'good' | 'usable' | 'poor';

export type ReviewDecision = 'confirmed' | 'rejected' | 'inconclusive';

export type TaskStatus = 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export type TreatmentAction = 
  | 'Bti Biolarvicide Applied'
  | 'Chemical Larvicide (Temephos)'
  | 'Container Emptied & Scrubbed'
  | 'Breeding Source Eliminated'
  | 'Water Source Sealed / Covered'
  | 'Field Confirmed Clean (No Action Required)';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  organization?: string;
  location_city?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface TrajectoryPoint {
  frame_idx: number;
  timestamp_s: number;
  bbox: [number, number, number, number];
  confidence: number;
}

export interface TrackEvidence {
  id?: string;
  scan_id: string;
  track_number: number;
  detector_confidence: number;
  larva_probability: number;
  non_larva_probability: number;
  motion_score: number;
  fused_confidence: number;
  persistence_frames: number;
  accepted: boolean;
  reject_reason?: string | null;
  trajectory: TrajectoryPoint[];
  evidence_frame_path?: string | null;
  evidence_frame_url?: string | null;
  created_at?: string;
}

export interface ScanDetail {
  id: string;
  owner_id: string;
  status: ScanStatus;
  progress_percent: number;
  current_stage?: string | null;
  source_video_path: string;
  evidence_video_path?: string | null;
  evidence_video_url?: string | null;
  source_mime_type: string;
  source_size_bytes: number;
  duration_seconds?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy_m?: number | null;
  probable_larvae_count?: number | null;
  rejected_tracks?: number | null;
  overall_confidence?: number | null;
  risk_level?: RiskLevel | null;
  video_quality?: VideoQuality | null;
  quality_reasons: string[];
  model_versions: Record<string, any>;
  review_status: string;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at: string;
}

export interface ScanListResponse {
  items: ScanDetail[];
  total: number;
  page: number;
  limit: number;
}

export interface ModelItemStatus {
  artifact_kind: string;
  filename: string;
  sha256_expected: string;
  sha256_actual?: string | null;
  file_exists: boolean;
  hash_matched: boolean;
  classes: string[];
  input_size?: number;
}

export interface ModelsStatus {
  ready: boolean;
  status_code: string;
  message: string;
  active_models: Record<string, ModelItemStatus>;
  fusion_thresholds: Record<string, any>;
  species_model_enabled: boolean;
}

export interface HotspotCell {
  id: string;
  latitude_bucket: number;
  longitude_bucket: number;
  scan_count: number;
  probable_larvae_total: number;
  dominant_risk: RiskLevel;
  latest_scan_at: string;
}

export interface HotspotsResponse {
  cells: HotspotCell[];
  total_cells: number;
  disclaimer: string;
}

export interface ReviewResponse {
  id: string;
  scan_id: string;
  reviewer_id: string;
  reviewer_name?: string | null;
  decision: ReviewDecision;
  notes?: string | null;
  created_at: string;
}

export interface ReviewQueueItem {
  scan: ScanDetail;
  accepted_tracks_count: number;
  rejected_tracks_count: number;
  reviews: ReviewResponse[];
}

export interface VectorTask {
  id: string;
  scan_id: string;
  citizen_id: string;
  citizen_name: string;
  assigned_worker_id: string;
  assigned_worker_name: string;
  assigned_by_id: string;
  status: TaskStatus;
  priority: string;
  latitude?: number | null;
  longitude?: number | null;
  location_address?: string | null;
  probable_larvae_count: number;
  risk_level: RiskLevel;
  instructions?: string | null;
  action_taken?: TreatmentAction | string | null;
  notes?: string | null;
  treatment_chemical?: string | null;
  dosage_grams?: number | null;
  created_at: string;
  accepted_at?: string | null;
  completed_at?: string | null;
}

export interface WorkerInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  assigned_zone?: string | null;
  active_tasks_count: number;
  completed_tasks_count: number;
  status: 'available' | 'on_field' | 'offline';
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  retryable: boolean;
  request_id: string;
}
