// login request
export interface LoginRequest {
  login: string;
  password: string;
}

// login response
export interface LoginResponse {
  pending: boolean;
  reference: string;
  expires_in: number;
  sent_to: string;
}

// verify otp request
export interface VerifyOtpRequest {
  reference: string;
  otp: string;
}

// user
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

// 
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: AuthUser;
}