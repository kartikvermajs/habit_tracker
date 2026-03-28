'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function createHabit(formData: FormData) {
  const { isAuth, userId } = await verifySession()

  if (!isAuth || !userId) {
    throw new Error('Not authenticated')
  }

  const title = formData.get('title') as string
  const frequency = formData.get('frequency') as string

  if (!title || !frequency) {
    throw new Error('Invalid fields')
  }

  await prisma.habit.create({
    data: {
      title,
      frequency,
      userId,
    },
  })

  revalidatePath('/dashboard')
}

export async function toggleHabitLog(habitId: string) {
  const { isAuth, userId } = await verifySession()

  if (!isAuth || !userId) {
    throw new Error('Not authenticated')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existingLog = await prisma.habitLog.findUnique({
    where: {
      habitId_date: {
        habitId,
        date: today,
      },
    },
  })

  if (existingLog) {
    await prisma.habitLog.update({
      where: { id: existingLog.id },
      data: { completed: !existingLog.completed },
    })
  } else {
    await prisma.habitLog.create({
      data: {
        habitId,
        userId,
        date: today,
        completed: true,
      },
    })
  }

  revalidatePath('/dashboard')
}

export async function deleteHabit(habitId: string) {
  const { isAuth, userId } = await verifySession()

  if (!isAuth || !userId) {
    throw new Error('Not authenticated')
  }

  await prisma.habit.delete({
    where: { 
      id: habitId,
      userId
    },
  })

  revalidatePath('/dashboard')
}
