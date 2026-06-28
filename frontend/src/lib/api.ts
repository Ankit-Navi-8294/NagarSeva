const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

export interface AIClassification {
  type: string;
  severity: number;
  department: string;
  confidence: number;
  auto_description?: string;
}

export interface Issue {
  id: string;
  title?: string;
  description?: string;
  lat: number;
  lng: number;
  photos: string[];
  media_type?: string;
  reporter_uid: string;
  address?: string;
  city?: string;
  status: string;
  type: string;
  severity: number;
  department: string;
  upvote_count: number;
  auto_description?: string;
  created_at: string;
  ai_classification?: AIClassification;
}

/**
 * Builds a displayable src for a photo stored as raw base64 in the DB.
 * Handles both raw base64 (from DB) and full data URIs (legacy).
 */
export function buildPhotoSrc(rawB64: string, mediaType: string = "image"): string {
  if (!rawB64) return "";
  if (rawB64.startsWith("data:")) return rawB64; // Already full URI
  if (mediaType === "video") return `data:video/mp4;base64,${rawB64}`;
  return `data:image/jpeg;base64,${rawB64}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Server error: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.detail) errorMsg = body.detail;
    } catch {
      // Body is not JSON — use default message
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const fetchIssues = async (): Promise<Issue[]> => {
  const res = await fetch(`${API_URL}/issues/`);
  return handleResponse<Issue[]>(res);
};

export const fetchIssue = async (id: string): Promise<Issue> => {
  const res = await fetch(`${API_URL}/issues/${id}`);
  return handleResponse<Issue>(res);
};

export const createIssue = async (payload: any): Promise<Issue> => {
  const res = await fetch(`${API_URL}/issues/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return handleResponse<Issue>(res);
};

export const updateIssueStatus = async (id: string, status: string): Promise<void> => {
  const res = await fetch(`${API_URL}/issues/${id}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH"
  });
  return handleResponse<void>(res);
};

export const upvoteIssue = async (id: string): Promise<{ upvote_count: number }> => {
  const res = await fetch(`${API_URL}/issues/${id}/upvote`, {
    method: "POST"
  });
  return handleResponse<{ upvote_count: number }>(res);
};
