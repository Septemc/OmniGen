export interface PromptMeta {
  filename: string;
  title: string;
  size: number;
  modifiedAt: string;
}

export interface PromptDetail extends PromptMeta {
  content: string;
}

export interface AuthResponse {
  token: string;
}

const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("prompts_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "请求失败" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function verifyPassword(password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function fetchPromptList(): Promise<PromptMeta[]> {
  return request<PromptMeta[]>("/prompts");
}

export async function fetchPrompt(filename: string): Promise<PromptDetail> {
  return request<PromptDetail>(`/prompts/${encodeURIComponent(filename)}`);
}

export async function savePrompt(
  filename: string,
  content: string
): Promise<PromptDetail> {
  return request<PromptDetail>(`/prompts/${encodeURIComponent(filename)}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function deletePrompt(filename: string): Promise<void> {
  await request(`/prompts/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
}

export function setToken(token: string): void {
  localStorage.setItem("prompts_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("prompts_token");
}

export function hasToken(): boolean {
  return !!getToken();
}
