/* ─────────────────────────────────────────────────────────────────────────────
   Notification & Reminder System
   ───────────────────────────────────────────────────────────────────────────── */

export interface HabitForNotif {
  id: string
  title: string
  description?: string | null
  reminders: string[]        // ["08:00", "14:00"]
  frequency: string[]        // ["Everyday"] | ["Mon","Wed"]
}

// ─── Service Worker Registration ──────────────────────────────────────────────
let _swReg: ServiceWorkerRegistration | null = null

export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  if (_swReg) return _swReg
  try {
    _swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready
    return _swReg
  } catch {
    return null
  }
}

// ─── Permission ───────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// ─── Day helpers ──────────────────────────────────────────────────────────────
const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

function habitActiveToday(habit: HabitForNotif): boolean {
  if (habit.frequency.includes('Everyday')) return true
  const today = new Date().getDay()
  return habit.frequency.some(d => DAY_MAP[d] === today)
}

// ─── Duplicate prevention ─────────────────────────────────────────────────────
// Tracks which (habitId, timeStr) combos have already fired today
const STORAGE_KEY = 'habit_notified_today'

function getFiredSet(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return new Set()
    const parsed = JSON.parse(stored)
    // Reset if it's from a different day
    if (parsed.date !== new Date().toDateString()) return new Set()
    return new Set(parsed.keys as string[])
  } catch { return new Set() }
}

function markFired(key: string) {
  const set = getFiredSet()
  set.add(key)
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    date: new Date().toDateString(),
    keys: [...set],
  }))
}

function hasFired(key: string): boolean {
  return getFiredSet().has(key)
}

// ─── Scheduled timeout handles ────────────────────────────────────────────────
const _handles: ReturnType<typeof setTimeout>[] = []
let _intervalHandle: ReturnType<typeof setInterval> | null = null

export function clearScheduledNotifications() {
  _handles.forEach(h => clearTimeout(h))
  _handles.length = 0
  if (_intervalHandle) { clearInterval(_intervalHandle); _intervalHandle = null }
}

// ─── Toast callback (set by the dashboard for in-app alerts) ──────────────────
type ToastCallback = (title: string, body: string) => void
let _toastFn: ToastCallback | null = null

export function setInAppToastCallback(fn: ToastCallback) {
  _toastFn = fn
}

export function clearInAppToastCallback() {
  _toastFn = null
}

// ─── Fire a reminder ──────────────────────────────────────────────────────────
async function fireReminder(habit: HabitForNotif, timeStr: string) {
  const key = `${habit.id}:${timeStr}`
  if (hasFired(key)) return
  markFired(key)

  const title = `🎯 ${habit.title}`
  const body = habit.description || 'Time to work on your habit!'

  // 1) In-app toast (visible immediately if app is in foreground)
  if (_toastFn) {
    _toastFn(title, body)
  }

  // 2) Push notification via SW (works in background tabs / when minimized)
  const reg = await registerSW()
  if (reg?.active) {
    reg.active.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      tag: `habit-${habit.id}-${timeStr}`,
    })
  } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    // Fallback: direct Notification API
    new Notification(title, { body, icon: '/logo.png' })
  }
}

// ─── Schedule all of today's reminders ────────────────────────────────────────
export async function scheduleHabitNotifications(habits: HabitForNotif[]) {
  const reg = await registerSW()
  clearScheduledNotifications()

  const now = new Date()

  for (const habit of habits) {
    if (!habitActiveToday(habit)) continue

    for (const timeStr of habit.reminders) {
      const [h, m] = timeStr.split(':').map(Number)
      const fire = new Date()
      fire.setHours(h, m, 0, 0)

      const delay = fire.getTime() - now.getTime()
      if (delay <= 0) continue // already passed today

      const handle = setTimeout(() => {
        fireReminder(habit, timeStr)
      }, delay)

      _handles.push(handle)
    }
  }

  // Also start a lightweight 30-second interval as a safety net.
  // This catches edge cases where setTimeout drifts or the device
  // wakes from sleep and missed timeouts fire late.
  startPeriodicCheck(habits)
}

// ─── Periodic check (fallback for sleep/wake and new additions) ───────────────
function startPeriodicCheck(habits: HabitForNotif[]) {
  if (_intervalHandle) clearInterval(_intervalHandle)

  _intervalHandle = setInterval(() => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    for (const habit of habits) {
      if (!habitActiveToday(habit)) continue

      for (const timeStr of habit.reminders) {
        const [h, m] = timeStr.split(':').map(Number)
        const targetMinutes = h * 60 + m

        // Fire if we're within 1 minute of the target time
        if (currentMinutes === targetMinutes) {
          fireReminder(habit, timeStr)
        }
      }
    }
  }, 30_000) // every 30 seconds — lightweight, no DOM work
}
