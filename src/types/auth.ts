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
  code: string;
  username: string;
  email: string;
  full_name: string;
  display_name: string;
  avatar_url: string | null;
  phone: string | null;
  organization_unit_id: number | null;
  is_active: boolean;
  blocked_at: string | null;
  blocked_by: number | null;
  two_factor_confirmed_at: string | null;
  password_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

// 
export interface AuthResponse {
  token: string;
  token_type: string;
  user: AuthUser;
}

export interface ResendOtpRequest {
  reference: string;
}

export interface LoginOtpData extends LoginResponse {
  login: string;
}