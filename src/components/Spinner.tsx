import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

export function Spinner({ className, full }: { className?: string; full?: boolean }) {
  if (full) {
    return (
      <div className="flex h-full min-h-[240px] w-full items-center justify-center">
        <Loader2 className={clsx('animate-spin text-primary-500', className || 'h-8 w-8')} />
      </div>
    )
  }
  return <Loader2 className={clsx('animate-spin text-primary-500', className || 'h-5 w-5')} />
}
