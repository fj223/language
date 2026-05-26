import { http } from './http'

export type LoginInput = { email: string; password: string }
export type RegisterInput = { email: string; name: string; password: string }

export type StudentInfo = { id: string; email: string; name: string }
export type AuthResult = { token: string; student: StudentInfo }

type ApiOk<T> = { ok: boolean; data: T; error?: string }

export async function loginApi(input: LoginInput): Promise<AuthResult> {
  const res = await http.post<ApiOk<AuthResult>>('/api/login', input)
  if (!res.data.ok) throw new Error(res.data.error ?? '登录失败')
  return res.data.data
}

export async function registerApi(input: RegisterInput): Promise<AuthResult> {
  const res = await http.post<ApiOk<AuthResult>>('/api/register', input)
  if (!res.data.ok) throw new Error(res.data.error ?? '注册失败')
  return res.data.data
}

export async function getMeApi(): Promise<StudentInfo> {
  const res = await http.get<ApiOk<StudentInfo>>('/api/me')
  if (!res.data.ok) throw new Error(res.data.error ?? '获取用户信息失败')
  return res.data.data
}
