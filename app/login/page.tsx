"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { IconBuildingStore, IconLoader2 } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  LoginPayloadSchema,
  type LoginPayload,
} from "@/lib/api/schemas/auth.schema"
import { authService } from "@/lib/api/services/auth.service"

type GoogleCredentialResponse = {
  credential?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: "outline" | "filled_blue" | "filled_black"
              size: "large" | "medium" | "small"
              type: "standard" | "icon"
              text: "signin_with" | "signup_with" | "continue_with" | "signin"
              shape: "rectangular" | "pill" | "circle" | "square"
              width: number
            }
          ) => void
        }
      }
    }
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export default function LoginPage() {
  const router = useRouter()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginPayload>({
    resolver: zodResolver(LoginPayloadSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const finishLogin = useCallback(() => {
    router.push("/")
    router.refresh()
  }, [router])

  async function onSubmit(data: LoginPayload) {
    setError(null)

    try {
      await authService.login(data)
      finishLogin()
    } catch (err: any) {
      setError(err?.EM || "Dang nhap that bai. Vui long thu lai.")
    }
  }

  const handleGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError("Google khong tra ve token dang nhap.")
        return
      }

      setError(null)
      setIsGoogleSubmitting(true)

      try {
        await authService.loginWithGoogle({
          idToken: response.credential,
          clientId: googleClientId,
        })
        finishLogin()
      } catch (err: any) {
        setError(err?.EM || "Dang nhap Google that bai. Vui long thu lai.")
      } finally {
        setIsGoogleSubmitting(false)
      }
    },
    [finishLogin]
  )

  useEffect(() => {
    const buttonRoot = googleButtonRef.current

    if (
      !isGoogleScriptReady ||
      !googleClientId ||
      !buttonRoot ||
      !window.google
    ) {
      return
    }

    const buttonWidth = Math.min(
      buttonRoot.parentElement?.clientWidth ?? 336,
      336
    )

    buttonRoot.innerHTML = ""
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: handleGoogleCredential,
    })
    window.google.accounts.id.renderButton(buttonRoot, {
      theme: "outline",
      size: "large",
      type: "standard",
      text: "signin_with",
      shape: "rectangular",
      width: buttonWidth,
    })
  }, [handleGoogleCredential, isGoogleScriptReady])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setIsGoogleScriptReady(true)}
      />

      <div className="w-full max-w-[400px] rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary shadow-sm">
            <IconBuildingStore className="size-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Duky Store</h1>
          <p className="text-sm text-muted-foreground">
            Dang nhap vao he thong quan tri
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="email"
              className={errors.email ? "text-destructive" : ""}
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@dukystore.local"
              className={`rounded-xl ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
              disabled={isSubmitting || isGoogleSubmitting}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs font-medium text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className={errors.password ? "text-destructive" : ""}
            >
              Mat khau
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              className={`rounded-xl ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
              disabled={isSubmitting || isGoogleSubmitting}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs font-medium text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl shadow-sm"
            disabled={isSubmitting || isGoogleSubmitting}
          >
            {isSubmitting && (
              <IconLoader2 data-icon="inline-start" className="animate-spin" />
            )}
            Dang nhap
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs font-medium text-muted-foreground">
            hoac
          </span>
          <Separator className="flex-1" />
        </div>

        {googleClientId ? (
          <div className="flex min-h-10 w-full justify-center">
            <div
              ref={googleButtonRef}
              className={
                isGoogleSubmitting ? "pointer-events-none opacity-60" : ""
              }
            />
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Chua cau hinh NEXT_PUBLIC_GOOGLE_CLIENT_ID.
          </p>
        )}
      </div>
    </div>
  )
}
