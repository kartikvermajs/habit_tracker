import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center">
      <main className="flex flex-col gap-8 items-center max-w-2xl">
        <div className="w-32 h-32 rounded-full shadow-neo flex items-center justify-center mb-4">
          <span className="text-6xl text-foreground">✨</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
          Neomorphic Habit Tracker
        </h1>
        
        <p className="text-lg text-foreground/80 max-w-md">
          A beautiful, simple way to track your daily goals and build lasting habits with a unique design.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 mt-8">
          <Button asChild size="lg" className="w-48">
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild variant="pressed" size="lg" className="w-48">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
