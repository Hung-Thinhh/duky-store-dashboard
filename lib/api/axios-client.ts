import axios, { AxiosError, InternalAxiosRequestConfig } from "axios"
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  persistAuthSession,
} from "@/lib/auth/browser-session"
import { ErrorResponseSchema } from "./schemas/base.schema"
import { LoginResponseDataSchema } from "./schemas/auth.schema"

// Mặc định lấy từ biến môi trường, fallback về localhost theo Contract
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
}) as any

// Request Interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Tự động gắn token cho mọi request bắt đầu bằng /admin
    if (config.url?.startsWith("/admin")) {
      const token = getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error: unknown) => Promise.reject(error)
)

// Khai báo biến để theo dõi trạng thái refresh token
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response Interceptor
apiClient.interceptors.response.use(
  (response: any) => {
    // Nếu BE trả về EC khác 0 nhưng HTTP code vẫn 200 (theo chuẩn API), ném lỗi
    if (
      response.data &&
      response.data.EC !== undefined &&
      response.data.EC !== 0
    ) {
      return Promise.reject(response.data)
    }
    return response.data
  },
  async (error: AxiosError) => {
    const originalRequest = error.config

    if (!originalRequest) return Promise.reject(error)

    // Xử lý 401: Token hết hạn
    const isAuthRequest = ["/auth/login", "/auth/google", "/auth/refresh"].some(
      (path) => originalRequest.url?.includes(path)
    )

    if (error.response?.status === 401 && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return apiClient(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      isRefreshing = true
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        // Đăng xuất nếu không có refresh token
        clearAuthSession()
        window.location.href = "/login"
        return Promise.reject(error)
      }

      try {
        // Gọi API refresh token
        const response = await axios.post(`${API_URL}/admin/auth/refresh`, {
          refreshToken,
        })

        const session = LoginResponseDataSchema.parse(response.data.DT)

        // Cập nhật cookie
        persistAuthSession(session)

        // Thực hiện lại các request bị lỗi
        processQueue(null, session.accessToken)
        originalRequest.headers.Authorization = `Bearer ${session.accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh thất bại, bắt buộc đăng xuất
        processQueue(refreshError, null)
        clearAuthSession()
        window.location.href = "/login"
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Cố gắng parse lỗi theo schema chuẩn nếu có
    if (error.response?.data) {
      const parsedError = ErrorResponseSchema.safeParse(error.response.data)
      if (parsedError.success) {
        return Promise.reject(parsedError.data)
      }
      return Promise.reject(error.response.data)
    }

    return Promise.reject(error)
  }
)
