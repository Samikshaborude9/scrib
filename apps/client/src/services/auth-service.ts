import { api } from '../lib/api'
import type { AuthResponse, LoginPayload, RegisterPayload } from '@scribble/types'

export function register(payload: RegisterPayload) {
  return api.post<AuthResponse>('/auth/register', payload)
}

export function login(payload: LoginPayload) {
  return api.post<AuthResponse>('/auth/login', payload)
}
