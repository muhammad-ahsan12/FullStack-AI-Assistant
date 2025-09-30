export const API_BASE_URL = "http://127.0.0.1:8000"

export interface ApiResponse {
  response: string;
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function sendRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to connect to the server');
  }
}