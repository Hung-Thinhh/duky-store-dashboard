"use client"

import * as React from "react"

import { type Media } from "@/lib/api/schemas/media.schema"
import { mediaService } from "@/lib/api/services/media.service"

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface UseMediaPaginationOptions {
  batchSize?: number
  enabled?: boolean
}

export interface UseMediaPaginationReturn {
  items: Media[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  error: Error | null
  currentPage: number
  totalPages: number
  searchQuery: string

  fetchNextPage: () => void
  search: (query: string) => void
  reset: () => void
  retry: () => void
}

// ─── Default values ──────────────────────────────────────────────────────────

const DEFAULT_BATCH_SIZE = 20

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMediaPagination(
  options: UseMediaPaginationOptions = {}
): UseMediaPaginationReturn {
  const { batchSize = DEFAULT_BATCH_SIZE, enabled = true } = options

  const [items, setItems] = React.useState<Media[]>([])
  const [currentPage, setCurrentPage] = React.useState(0)
  const [totalPages, setTotalPages] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")

  const loadedPagesRef = React.useRef<Set<number>>(new Set())
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const lastFailedPageRef = React.useRef<number | null>(null)
  const lastFailedSearchRef = React.useRef<string>("")

  const hasMore = currentPage > 0 && currentPage < totalPages

  // Cancel any in-flight request
  const cancelRequest = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Core fetch function
  const fetchPage = React.useCallback(
    async (page: number, search?: string) => {
      cancelRequest()

      const controller = new AbortController()
      abortControllerRef.current = controller

      const isFirstPage = page === 1 && loadedPagesRef.current.size === 0

      if (isFirstPage) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)

      try {
        const params: Record<string, any> = {
          page,
          limit: batchSize,
        }
        if (search) {
          params.search = search
        }

        const response = await mediaService.getMediaList(params)

        // If aborted, don't update state
        if (controller.signal.aborted) return

        const { data, pagination } = response

        setTotalPages(pagination?.totalPages ?? 0)
        setCurrentPage(page)
        loadedPagesRef.current.add(page)
        lastFailedPageRef.current = null

        if (isFirstPage) {
          setItems(data)
        } else {
          setItems((prev) => {
            const existingIds = new Set(prev.map((item) => item.id))
            const newItems = data.filter((item) => !existingIds.has(item.id))
            return [...prev, ...newItems]
          })
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return
        if (controller.signal.aborted) return

        lastFailedPageRef.current = page
        lastFailedSearchRef.current = search ?? ""
        setError(err instanceof Error ? err : new Error(err?.EM || "Fetch failed"))
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    },
    [batchSize, cancelRequest]
  )

  // Fetch next page (infinite scroll trigger)
  const fetchNextPage = React.useCallback(() => {
    if (isLoadingMore || isLoading) return
    if (!hasMore) return

    const nextPage = currentPage + 1
    if (loadedPagesRef.current.has(nextPage)) return

    fetchPage(nextPage, searchQuery || undefined)
  }, [isLoadingMore, isLoading, hasMore, currentPage, searchQuery, fetchPage])

  // Search: reset everything and fetch page 1 with new query
  const search = React.useCallback(
    (query: string) => {
      cancelRequest()

      setItems([])
      setCurrentPage(0)
      setTotalPages(0)
      setError(null)
      setSearchQuery(query)
      loadedPagesRef.current = new Set()
      lastFailedPageRef.current = null

      fetchPage(1, query || undefined)
    },
    [cancelRequest, fetchPage]
  )

  // Reset: full state reset (when dialog closes/reopens)
  const reset = React.useCallback(() => {
    cancelRequest()

    setItems([])
    setCurrentPage(0)
    setTotalPages(0)
    setIsLoading(false)
    setIsLoadingMore(false)
    setError(null)
    setSearchQuery("")
    loadedPagesRef.current = new Set()
    lastFailedPageRef.current = null
    lastFailedSearchRef.current = ""
  }, [cancelRequest])

  // Retry: resend the last failed request
  const retry = React.useCallback(() => {
    if (lastFailedPageRef.current !== null) {
      const page = lastFailedPageRef.current
      const searchParam = lastFailedSearchRef.current
      lastFailedPageRef.current = null
      fetchPage(page, searchParam || undefined)
    }
  }, [fetchPage])

  // Note: Initial fetch is triggered by the consumer (e.g., calling search("") when dialog opens)
  // No auto-fetch effect needed — avoids race conditions with reset/search calls.

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cancelRequest()
    }
  }, [cancelRequest])

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    currentPage,
    totalPages,
    searchQuery,
    fetchNextPage,
    search,
    reset,
    retry,
  }
}
