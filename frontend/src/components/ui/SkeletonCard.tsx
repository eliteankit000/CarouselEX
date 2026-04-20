'use client'

export default function SkeletonCard({
  height = 120,
  className = '',
  'data-testid': testId,
}: {
  height?: number
  className?: string
  'data-testid'?: string
}) {
  return (
    <div
      data-testid={testId}
      className={`d-skeleton ${className}`}
      style={{ minHeight: height, height }}
    />
  )
}
