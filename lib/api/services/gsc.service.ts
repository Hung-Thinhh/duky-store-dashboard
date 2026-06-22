import { apiClient } from "../axios-client"
import {
  GscAnalyzeResponseSchema,
  GscCandidatesResponseSchema,
  GscInspectResponseSchema,
  GscOverviewResponseSchema,
  GscSubmitIndexingResponseSchema,
  GscUrlInput,
} from "../schemas/gsc.schema"

export const gscService = {
  async getOverview() {
    const response = await apiClient.get("/admin/gsc/overview")
    return GscOverviewResponseSchema.parse(response).DT
  },

  async getCandidates(params?: {
    includeLiveSitemap?: boolean
    limit?: number
  }) {
    const response = await apiClient.get("/admin/gsc/candidates", { params })
    return GscCandidatesResponseSchema.parse(response).DT
  },

  async analyzeUrls(urls: GscUrlInput[]) {
    const response = await apiClient.post("/admin/gsc/analyze", { urls })
    return GscAnalyzeResponseSchema.parse(response).DT
  },

  async inspectUrls(urls: GscUrlInput[]) {
    const response = await apiClient.post(
      "/admin/gsc/inspect",
      { urls },
      { timeout: 900000 }
    )
    return GscInspectResponseSchema.parse(response).DT
  },

  async submitIndexing(url: string, type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED") {
    const response = await apiClient.post("/admin/gsc/submit-indexing", { url, type })
    return GscSubmitIndexingResponseSchema.parse(response).DT
  },
}
