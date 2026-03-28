'use server'

import { hash, compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

const signupSchema = loginSchema.extend({
  fullName: z.string().min(1, { message: 'Full name is required' }),
  passwordConfirmation: z.string()
}).refine((data) => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
})

export async function login(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData)
  const parsed = loginSchema.safeParse(data)

  if (!parsed.success) {
    return { error: 'Invalid fields' }
  }

  const { email, password } = parsed.data

  // Check against Admin Environment Variables
  if (
    process.env.ADMIN_EMAIL &&
    process.env.ADMIN_PASSWORD &&
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    await createSession('admin_virtual_id')
    redirect('/dashboard')
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { error: 'Invalid email or password' }
  }

  const isValidPassword = await compare(password, user.passwordHash)

  if (!isValidPassword) {
    return { error: 'Invalid email or password' }
  }

  await createSession(user.id)
  redirect('/dashboard')
}

export async function signup(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData)
  const parsed = signupSchema.safeParse(data)

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { email, fullName, password } = parsed.data

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: 'An account with this email already exists' }
  }

  const passwordHash = await hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
      },
    })
    await createSession(user.id)
  } catch (err: any) {
    // Graceful error fallback
    return { error: 'Failed to create user. Email may be taken.' }
  }

  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

