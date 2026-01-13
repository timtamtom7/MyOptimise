"use client";

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { generateBlueGradient } from "@/lib/utils"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

interface AvatarFallbackProps
  extends React.ComponentProps<typeof AvatarPrimitive.Fallback> {
  seed?: string
}

function AvatarFallback({
  className,
  style,
  seed,
  children,
  ...props
}: AvatarFallbackProps) {
  const backgroundStyle = seed
    ? { background: generateBlueGradient(seed) }
    : typeof children === "string"
      ? { background: generateBlueGradient(children) }
      : undefined

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      style={{ ...backgroundStyle, ...style }}
      className={cn(
        "flex size-full items-center justify-center rounded-full text-white",
        className
      )}
      {...props}
    >
      {children}
    </AvatarPrimitive.Fallback>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
