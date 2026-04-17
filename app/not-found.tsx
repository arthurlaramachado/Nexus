import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F8]">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-[#1A1A2E] mb-4">404</h1>
        <h2 className="text-2xl font-bold text-[#1A1A2E] mb-4">Page Not Found</h2>
        <p className="text-[#6B6B78] mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}


