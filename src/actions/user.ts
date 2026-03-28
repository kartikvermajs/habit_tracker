'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { logout } from '@/actions/auth'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────────────────────
// DELETE ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteAccount() {
  const { isAuth, userId } = await verifySession()
  if (!isAuth || !userId) throw new Error('Not authenticated')

  await prisma.user.delete({ where: { id: userId } })
  await logout()
}
