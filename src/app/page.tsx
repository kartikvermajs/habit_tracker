import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Onboarding } from '@/components/ui/onboarding'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 text-center">
      <Onboarding />
      <main className="flex flex-col gap-8 items-center max-w-2xl">
        <div className="flex justify-center mb-4">
          <Image
            src="/logo.png"
            alt="Habit Tracker Logo"
            width={512}
            height={512}
            className="w-24 h-24 sm:w-32 sm:h-32 object-contain drop-shadow-sm"
          />
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground">
          Habit Tracker
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
