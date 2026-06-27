'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function ProductImage({
  src,
  alt,
  className,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
}) {
  const [imgSrc, setImgSrc] = useState(src || '/placeholder-product.svg')
  const [errored, setErrored] = useState(!src)

  if (errored) {
    return (
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 dark:bg-zinc-800',
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/placeholder-product.svg" alt="No image" className="h-20 w-20 opacity-40" />
      </div>
    )
  }

  return (
    <div className={cn('absolute inset-0 overflow-hidden bg-muted/20', className)}>
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-500 hover:scale-[1.04]"
        unoptimized
        onError={() => {
          setImgSrc('/placeholder-product.svg')
          setErrored(true)
        }}
      />
    </div>
  )
}
