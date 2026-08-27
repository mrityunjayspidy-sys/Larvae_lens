import { 
  ModelsStatus, 
  ScanDetail, 
  ScanListResponse, 
  TrackEvidence, 
  HotspotsResponse, 
  ReviewQueueItem, 
  ReviewResponse, 
  ReviewDecision, 
  UserProfile, 
  UserRole, 
  VectorTask,
  WorkerInfo,
  TaskStatus,
  ApiErrorPayload 
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiError extends Error {
  code: string;
  retryable: boolean;
  requestId: string;
  status: number;

  constructor(payload: ApiErrorPayload, status: number) {
    super(payload.message || 'API Error');
    this.name = 'ApiError';
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.retryable = payload.retryable || false;
    this.requestId = payload.request_id || '';
    this.status = status;
  }
}

export const apiClient = {
  async fetchWithAuth<T>(
    endpoint: string, 
    token?: string | null, 
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers || {});
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const requestId = crypto.randomUUID();
    headers.set('X-Request-ID', requestId);

    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: ApiErrorPayload;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            code: `HTTP_${response.status}`,
            message: response.statusText || 'Server communication failed.',
            retryable: response.status >= 500,
            request_id: requestId,
          };
        }
        throw new ApiError(errorData, response.status);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError({
        code: 'NETWORK_ERROR',
        message: 'Could not connect to analysis service. Please check network connection.',
        retryable: true,
        request_id: requestId,
      }, 0);
    }
  },

  // Auth & Profile
  async getMyProfile(token?: string | null): Promise<UserProfile> {
    return this.fetchWithAuth<UserProfile>('/api/v1/auth/me', token);
  },

  async updateProfile(
    data: { full_name?: string; phone?: string; organization?: string; location_city?: string; bio?: string },
    token?: string | null
  ): Promise<UserProfile> {
    return this.fetchWithAuth<UserProfile>('/api/v1/auth/me', token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  async updateRole(role: UserRole, token?: string | null): Promise<UserProfile> {
    return this.fetchWithAuth<UserProfile>('/api/v1/auth/role', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
  },

  // Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/api/v1/health`);
    return await res.json();
  },

  // Models
  async getModelsStatus(token?: string | null): Promise<ModelsStatus> {
    return this.fetchWithAuth<ModelsStatus>('/api/v1/models/status', token);
  },

  // Scans
  async uploadScan(
    formData: FormData, 
    token?: string | null, 
    idempotencyKey?: string
  ): Promise<{ scan_id: string; status: string; progress_percent: number; created_at: string }> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    return this.fetchWithAuth('/api/v1/scans', token, {
      method: 'POST',
      headers,
      body: formData,
    });
  },

  async getScan(scanId: string, token?: string | null): Promise<ScanDetail> {
    return this.fetchWithAuth<ScanDetail>(`/api/v1/scans/${scanId}`, token);
  },

  async getScanTracks(scanId: string, token?: string | null): Promise<TrackEvidence[]> {
    return this.fetchWithAuth<TrackEvidence[]>(`/api/v1/scans/${scanId}/tracks`, token);
  },

  async getUserScans(token?: string | null, page = 1, limit = 20): Promise<ScanListResponse> {
    return this.fetchWithAuth<ScanListResponse>(`/api/v1/scans?page=${page}&limit=${limit}`, token);
  },

  async getAllScans(token?: string | null, page = 1, limit = 50): Promise<ScanListResponse> {
    return this.fetchWithAuth<ScanListResponse>(`/api/v1/scans/all?page=${page}&limit=${limit}`, token);
  },

  // Reviews
  async getReviewQueue(token?: string | null, page = 1, limit = 50): Promise<ReviewQueueItem[]> {
    return this.fetchWithAuth<ReviewQueueItem[]>(`/api/v1/review-queue?page=${page}&limit=${limit}`, token);
  },

  async submitReview(
    scanId: string, 
    decision: ReviewDecision, 
    notes?: string, 
    token?: string | null
  ): Promise<ReviewResponse> {
    return this.fetchWithAuth<ReviewResponse>(`/api/v1/scans/${scanId}/reviews`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes }),
    });
  },

  // Tasks & Field Operations Dispatch
  async getTasks(token?: string | null): Promise<VectorTask[]> {
    return this.fetchWithAuth<VectorTask[]>('/api/v1/tasks', token);
  },

  async assignTask(
    payload: { scan_id: string; worker_id: string; priority?: string; instructions?: string },
    token?: string | null
  ): Promise<VectorTask> {
    return this.fetchWithAuth<VectorTask>('/api/v1/tasks/assign', token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async updateTaskStatus(
    taskId: string,
    payload: { status: TaskStatus; action_taken?: string; notes?: string; treatment_chemical?: string; dosage_grams?: number },
    token?: string | null
  ): Promise<VectorTask> {
    return this.fetchWithAuth<VectorTask>(`/api/v1/tasks/${taskId}/status`, token, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async getWorkers(token?: string | null): Promise<WorkerInfo[]> {
    return this.fetchWithAuth<WorkerInfo[]>('/api/v1/tasks/workers', token);
  },

  async getUnassignedScans(token?: string | null): Promise<ScanDetail[]> {
    return this.fetchWithAuth<ScanDetail[]>('/api/v1/tasks/unassigned-scans', token);
  },

  // Hotspots
  async getHotspots(params?: { minLat?: number; maxLat?: number; minLng?: number; maxLng?: number }): Promise<HotspotsResponse> {
    let query = '';
    if (params) {
      const q = new URLSearchParams();
      if (params.minLat !== undefined) q.append('min_lat', params.minLat.toString());
      if (params.maxLat !== undefined) q.append('max_lat', params.maxLat.toString());
      if (params.minLng !== undefined) q.append('min_lng', params.minLng.toString());
      if (params.maxLng !== undefined) q.append('max_lng', params.maxLng.toString());
      query = `?${q.toString()}`;
    }
    return this.fetchWithAuth<HotspotsResponse>(`/api/v1/hotspots${query}`);
  }
};
