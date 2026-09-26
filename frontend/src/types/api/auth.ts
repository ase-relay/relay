/**
 * TypeScript types untuk kontrak API profile & password management.
 *
 * SOURCE OF TRUTH: Backend controllers & services in backend/src/controllers/auth.controller.ts
 * dan backend/src/services/auth.service.ts
 */

// ---------------------------------------------------------------------------
// REQUEST — update profile
// ---------------------------------------------------------------------------

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

export interface UpdateProfileData {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: UpdateProfileData;
}

// ---------------------------------------------------------------------------
// REQUEST — change password
// ---------------------------------------------------------------------------

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// REQUEST — google login
// ---------------------------------------------------------------------------

export interface GoogleLoginRequest {
  email: string;
  name: string;
}

export interface GoogleLoginData {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: 'USER' | 'ADMIN';
  };
}

export interface GoogleLoginResponse {
  success: boolean;
  message: string;
  data: GoogleLoginData;
}
