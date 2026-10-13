import axios from 'axios'
import { i18n, type AppLocale } from '@/locales'

const NETWORK_MESSAGES: Record<AppLocale, {
  timeout: string
  unavailable: string
}> = {
  zh: {
    timeout: '请求超时，请稍后重试',
    unavailable: '服务暂时不可用，请稍后重试',
  },
  en: {
    timeout: 'The request timed out. Please try again.',
    unavailable: 'The service is temporarily unavailable. Please try again.',
  },
  ru: {
    timeout: 'Время ожидания истекло. Повторите попытку.',
    unavailable: 'Сервис временно недоступен. Повторите попытку.',
  },
}

const API_ERROR_MESSAGES: Record<string, Record<AppLocale, string>> = {
  'Internal server error': {
    zh: '服务暂时不可用，请稍后重试',
    en: 'The service is temporarily unavailable. Please try again.',
    ru: 'Сервис временно недоступен. Повторите попытку.',
  },
  'Not found': {
    zh: '请求的内容不存在',
    en: 'The requested content was not found.',
    ru: 'Запрошенные данные не найдены.',
  },
  'Invalid JSON body': {
    zh: '提交的数据格式不正确',
    en: 'The submitted data format is invalid.',
    ru: 'Неверный формат отправленных данных.',
  },
  'Origin is not allowed': {
    zh: '当前访问来源未获授权',
    en: 'This request origin is not allowed.',
    ru: 'Источник запроса не разрешён.',
  },
  'course not found': {
    zh: '课程不存在或已下架',
    en: 'The course was not found or is no longer available.',
    ru: 'Курс не найден или больше недоступен.',
  },
  'demo course not found': {
    zh: '演示课程不存在',
    en: 'The demo course was not found.',
    ru: 'Демонстрационный курс не найден.',
  },
  'resource not found': {
    zh: '学习资源不存在',
    en: 'The learning resource was not found.',
    ru: 'Учебный материал не найден.',
  },
  'title is required': {
    zh: '请输入课程标题',
    en: 'Enter a course title.',
    ru: 'Введите название курса.',
  },
  'course text contains suspicious replacement characters': {
    zh: '课程文字疑似发生编码损坏，请重新输入中文内容',
    en: 'The course text appears to be encoding-corrupted. Please enter it again.',
    ru: 'Текст курса, вероятно, повреждён из-за кодировки. Введите его заново.',
  },
  'published course requires at least one learning resource': {
    zh: '发布课程前必须至少添加一个学习资源',
    en: 'Add at least one learning resource before publishing the course.',
    ru: 'Перед публикацией добавьте хотя бы один учебный материал.',
  },
  'published course must keep at least one learning resource; unpublish it first': {
    zh: '已发布课程必须保留至少一个资源，请先将课程改为草稿',
    en: 'A published course must keep one resource. Unpublish it first.',
    ru: 'В опубликованном курсе должен остаться материал. Сначала снимите курс с публикации.',
  },
  'AI flashcard generation is not enabled': {
    zh: 'AI 闪卡生成暂未启用',
    en: 'AI flashcard generation is not enabled yet.',
    ru: 'Создание карточек с помощью ИИ пока не включено.',
  },
  '邮箱或密码错误': {
    zh: '邮箱或密码错误',
    en: 'Incorrect email or password.',
    ru: 'Неверный адрес электронной почты или пароль.',
  },
  '该邮箱已被注册': {
    zh: '该邮箱已被注册',
    en: 'This email address is already registered.',
    ru: 'Этот адрес электронной почты уже зарегистрирован.',
  },
  '管理员邮箱或密码错误': {
    zh: '管理员邮箱或密码错误',
    en: 'Incorrect administrator email or password.',
    ru: 'Неверная почта или пароль администратора.',
  },
  '请先登录管理后台': {
    zh: '请先登录管理后台',
    en: 'Sign in to the admin console first.',
    ru: 'Сначала войдите в панель администратора.',
  },
  '管理会话已过期，请重新登录': {
    zh: '管理会话已过期，请重新登录',
    en: 'The admin session has expired. Sign in again.',
    ru: 'Сеанс администратора истёк. Войдите снова.',
  },
  '管理员账号已停用': {
    zh: '管理员账号已停用',
    en: 'This administrator account has been disabled.',
    ru: 'Учётная запись администратора отключена.',
  },
  '当前角色没有执行此操作的权限': {
    zh: '当前角色没有执行此操作的权限',
    en: 'Your role does not have permission to perform this action.',
    ru: 'У вашей роли нет разрешения на это действие.',
  },
  '课程不存在或已下架': {
    zh: '课程不存在或已下架',
    en: 'The course was not found or is no longer available.',
    ru: 'Курс не найден или больше недоступен.',
  },
  '报名申请不存在': {
    zh: '报名申请不存在',
    en: 'The enrollment application was not found.',
    ru: 'Заявка на курс не найдена.',
  },
  '提醒不存在': {
    zh: '提醒不存在',
    en: 'The reminder was not found.',
    ru: 'Напоминание не найдено.',
  },
}

function currentLocale(): AppLocale {
  const locale = i18n.global.locale.value
  return locale === 'en' || locale === 'ru' ? locale : 'zh'
}

function localizeApiError(message: string) {
  const exact = API_ERROR_MESSAGES[message]?.[currentLocale()]
  if (exact) return exact
  const prefix = Object.keys(API_ERROR_MESSAGES).find((key) => message.startsWith(`${key}:`))
  return prefix ? API_ERROR_MESSAGES[prefix]?.[currentLocale()] ?? message : message
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  timeout: 15_000,
})

http.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('ADMIN_SESSION_TOKEN') || ''
  if (adminToken) {
    config.headers = config.headers ?? {}
    config.headers['X-Admin-Token'] = adminToken
  }

  const studentToken = localStorage.getItem('STUDENT_TOKEN') || ''
  if (studentToken) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${studentToken}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const requestUrl = error.config?.url ?? ''
      const data = error.response?.data as { error?: unknown } | undefined
      const apiMessage = typeof data?.error === 'string' ? data.error : ''
      const isAdminLoginRequest = requestUrl.endsWith('/api/admin/login')
      const isStudentAuthRequest =
        requestUrl.endsWith('/api/login') ||
        requestUrl.endsWith('/api/register')
      const adminSessionEnded = requestUrl.includes('/api/admin/') &&
        !isAdminLoginRequest &&
        (error.response?.status === 401 || (error.response?.status === 403 && apiMessage.includes('账号已停用')))
      if (adminSessionEnded) {
        localStorage.removeItem('ADMIN_SESSION_TOKEN')
        localStorage.removeItem('ADMIN_SESSION')
        window.dispatchEvent(new CustomEvent('admin-session-expired', {
          detail: { reason: error.response?.status === 403 ? 'disabled' : 'expired' },
        }))
      } else if (
        error.response?.status === 401 &&
        !isAdminLoginRequest &&
        !isStudentAuthRequest &&
        Boolean(error.config?.headers?.Authorization)
      ) {
        localStorage.removeItem('STUDENT_TOKEN')
        localStorage.removeItem('STUDENT_SESSION')
        window.dispatchEvent(new CustomEvent('student-session-expired'))
      }
      const locale = currentLocale()
      const fallback = error.code === 'ECONNABORTED'
        ? NETWORK_MESSAGES[locale].timeout
        : NETWORK_MESSAGES[locale].unavailable
      const knownMessage = apiMessage ? API_ERROR_MESSAGES[apiMessage]?.[locale] : ''
      const message = knownMessage || (
        error.response?.status && error.response.status >= 500
          ? fallback
          : apiMessage
            ? localizeApiError(apiMessage)
            : fallback
      )
      return Promise.reject(new Error(message))
    }
    return Promise.reject(error)
  },
)
