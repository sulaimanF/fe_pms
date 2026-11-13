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

export interface AuthRole {
  id: number;
  name: string;
}

export interface AuthOrganizationUnit {
  id: number;
  name: string;
}

// user
export interface AuthUserBase {
  id: number;
  code: string | null;
  username: string;
  email: string;
  full_name: string;
  display_name: string | null;
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

// Relations loaded by /auth/me, not guaranteed on an OTP response.
export interface AuthUser extends AuthUserBase {
  roles: AuthRole[];
  organization_unit: AuthOrganizationUnit | null;
}

export interface OtpVerificationResponse {
  token: string;
  token_type: string;
  user: AuthUserBase;
}

// Internal Redux payload, assembled only after /auth/me succeeds.
export interface AuthenticatedSession extends MeResponse {
  token: string;
  token_type: string;
}

export interface ResendOtpRequest {
  reference: string;
}

export interface LoginOtpData extends LoginResponse {
  login: string;
}

export interface AuthMenuItem {
  icon: string;
  name: string;
  path: string;
}

export interface AuthMenuGroup {
  title: string;
  items: AuthMenuItem[];
}

export interface AuthCapabilities {
  can_manage_user_bypass: boolean;
}

export interface MeResponse {
  user: AuthUser;
  roles: AuthRole[];
  permissions: string[];
  menu: AuthMenuGroup[];
  capabilities?: AuthCapabilities;
}
