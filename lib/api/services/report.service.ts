import { apiClient } from "../axios-client"
import { ReportsDashboardResponseSchema } from "../schemas/report.schema"

export const reportService = {
  async getDashboard(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/reports/dashboard", { params })
    return ReportsDashboardResponseSchema.parse(response).DT
  },

  async exportReport(params?: Record<string, any>) {
    const response = await apiClient.get("/admin/reports/export", { params })
    return response.DT ?? response
  },
}
