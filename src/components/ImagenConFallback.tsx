import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { ComponentType } from 'react'

export function ImagenConFallback({
  src,
  alt,
  className,
  style,
  iconoClassName,
  Icono = ImageOff,
}: {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  iconoClassName?: string
  Icono?: ComponentType<{ className?: string }>
}) {
  const [fallo, setFallo] = useState(false)

  if (!src || fallo) {
    return (
      <div className={`flex items-center justify-center ${className || ''}`} style={style}>
        <Icono className={iconoClassName || 'h-1/3 w-1/3 text-slate-300'} />
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} style={style} onError={() => setFallo(true)} />
}
