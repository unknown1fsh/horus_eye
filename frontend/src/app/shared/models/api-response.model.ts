export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
  errorCode?: string;
  timestamp?: string;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  errorCode: string;
  timestamp: string;
}
