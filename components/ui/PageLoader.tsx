interface PageLoaderProps {
  message?: string
}

export default function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#E4E4E8] border-t-[#1A1A2E] mb-4"></div>
        <p className="text-[#6B6B78] font-medium">{message}</p>
      </div>
    </div>
  )
}

