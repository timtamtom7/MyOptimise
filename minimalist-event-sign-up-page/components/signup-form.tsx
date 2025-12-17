"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { CheckIcon, ArrowRightIcon } from "lucide-react"

export function SignupForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground">
          <CheckIcon className="h-5 w-5 text-background" strokeWidth={2.5} />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-base font-medium text-foreground">See you in BGC</p>
          <p className="text-sm text-muted-foreground">We'll send the details to {email}</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-[48px] bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground text-base px-4 rounded-lg"
      />
      <ShimmerButton
        type="submit"
        disabled={loading}
        borderRadius="8px"
        className="w-full h-[48px] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2 relative z-10 font-semibold text-white">
          {loading ? (
            "Securing your seat..."
          ) : (
            <>
              Claim your seat
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </span>
      </ShimmerButton>
    </form>
  )
}
