'use client'

import { useActionState, useEffect } from 'react'
import { signup } from '@/actions/auth'
import { SubmitButton } from '@/components/ui/submit-button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import Image from 'next/image'

export default function SignupPage() {
  const [state, formAction] = useActionState(signup as any, null as any)

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <div className="flex flex-1 flex-col justify-center items-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl shadow-neo bg-background flex flex-col gap-6">
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="App Logo"
            width={512}
            height={512}
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-sm"
          />
        </div>
        <h1 className="text-2xl font-semibold text-center text-foreground mt-[-1rem]">
          Create an Account
        </h1>
        <form action={formAction} className="flex flex-col gap-4">
          <Input 
            name="fullName" 
            type="text" 
            placeholder="Full Name" 
            required 
          />
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
          <SubmitButton size="lg" className="mt-2">
            Sign Up
          </SubmitButton>
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
