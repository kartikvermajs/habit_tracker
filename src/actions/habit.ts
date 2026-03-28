'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// GET HABITS  (used by TanStack Query via a wrapper)
// ─────────────────────────────────────────────────────────────────────────────
export async function getHabits() {
  const { isAuth, userId } = await verifySession()
  if (!isAuth || !userId) throw new Error('Not authenticated')

  const habits = await prisma.habit.findMany({
    where: { userId },
    include: { logs: true },
    orderBy: { createdAt: 'desc' },
  })
  return habits
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE HABIT
// ─────────────────────────────────────────────────────────────────────────────
export async function createHabit(data: {
  title: string
  description?: string
  color?: string
  frequency: string[]   // ["Everyday"] | ["Mon","Wed","Fri"] etc.
  reminders: string[]   // ["08:00","14:00"] etc.
  startDate: string     // ISO date string
  endDate?: string      // ISO date string or undefined
}) {
  const { isAuth, userId } = await verifySession()
  if (!isAuth || !userId) throw new Error('Not authenticated')

  if (!data.title || !data.frequency.length) {
    throw new Error('Name and frequency are required')
  }

  const habit = await prisma.habit.create({
    data: {
      title: data.title,
      description: data.description ?? '',
      color: data.color ?? '#8b5cf6',
      frequency: data.frequency,
      reminders: data.reminders,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      userId,
    },
  })

  revalidatePath('/dashboard')
  return habit
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE HABIT
// ─────────────────────────────────────────────────────────────────────────────
export async function updateHabit(habitId: string, data: {
  title: string
  description?: string
  color?: string
  frequency: string[]
  reminders: string[]
  startDate: string
  endDate?: string
}) {
  const { isAuth, userId } = await verifySession()
  if (!isAuth || !userId) throw new Error('Not authenticated')

  await prisma.habit.update({
    where: { id: habitId, userId },
    data: {
      title: data.title,
      description: data.description ?? '',
      color: data.color ?? '#8b5cf6',
      frequency: data.frequency,
      reminders: data.reminders,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  })

  revalidatePath('/dashboard')
}

// ─────────────────────────────────────────────────────────────────────────────
// TOGGLE HABIT LOG  (for a specific date)
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleHabitLog(habitId: string, dateStr: string) {
  const { isAuth, userId } = await verifySession()
  if (!isAuth || !userId) throw new Error('Not authenticated')

  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)

  const habit = await prisma.habit.findUnique({
    where: { id: habitId, userId },
  })
  if (!habit) throw new Error('Habit not found')

  const totalParts = Math.max(1, habit.reminders.length)

  const existing = await prisma.habitLog.findUnique({
    where: { habitId_date: { habitId, date } },
  })

  let newElements = existing ? [...existing.completedElements] : []

  if (newElements.length < totalParts) {
    // Increment: Add a dummy token
    newElements.push(`done-${Date.now()}`)
  } else {
    // If fully completed (or somehow over), clicking again single-decrements (undo last)
    newElements.pop()
  }

  const isCompleted = newElements.length >= totalParts

  if (existing) {
    await prisma.habitLog.update({
      where: { id: existing.id },
      data: {
        completed: isCompleted,
        completedElements: newElements,
      },
    })
  } else {
    await prisma.habitLog.create({
      data: {
        habitId,
        userId,
        date,
        completed: isCompleted,
        completedElements: newElements,
      },
    })
  }

  revalidatePath('/dashboard')
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE HABIT
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteHabit(habitId: string) {
  const { isAuth, userId } = await verifySession()
  if (!isAuth || !userId) throw new Error('Not authenticated')

  await prisma.habit.delete({ where: { id: habitId, userId } })
  revalidatePath('/dashboard')
}
