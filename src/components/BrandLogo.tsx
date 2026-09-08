import Image from 'next/image'

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="BeanBuilt AI">
      <span className="relative block h-11 w-12 shrink-0 overflow-hidden rounded-lg" aria-hidden="true">
        <Image src="/brand/beanbuilt-ai.png" alt="" width={96} height={96} className="absolute left-1/2 top-1/2 h-[76px] w-[76px] max-w-none -translate-x-1/2 -translate-y-[36%]" />
      </span>
      {!compact && <span className="text-sm font-extrabold tracking-tight">beanbuilt <span className="text-primary">ai</span></span>}
    </span>
  )
}
