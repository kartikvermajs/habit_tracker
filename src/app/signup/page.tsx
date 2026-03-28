import { signup } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="flex flex-1 flex-col justify-center items-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl shadow-neo bg-background flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-center text-foreground">
          Create an Account
        </h1>
        <form action={signup} className="flex flex-col gap-4">
          <Input 
            name="email" 
            type="email" 
            placeholder="Email Address" 
            required 
          />
          <Input 
            name="password" 
            type="password" 
            placeholder="Password" 
            required 
          />
          <Input 
            name="passwordConfirmation" 
            type="password" 
            placeholder="Confirm Password" 
            required 
          />
          <Button type="submit" size="lg" className="mt-2">
            Sign Up
          </Button>
        </form>
        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
