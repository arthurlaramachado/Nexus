'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
      <div className="max-w-md w-full bg-white p-8 rounded-xl border border-[#E4E4E8] shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">Something went wrong!</h2>
        <p className="text-[#6B6B78] mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#1A1A2E] text-white rounded-md hover:bg-[#12122A]"
        >
          Try again
        </button>
      </div>
    </div>
  )
}


