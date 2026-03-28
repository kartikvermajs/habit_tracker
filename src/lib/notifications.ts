/* ─────────────────────────────────────────────────────────────────────────────
   Notification utilities
   ───────────────────────────────────────────────────────────────────────────── */

export interface HabitForNotif {
  id: string
  title: string
  description?: string | null
  reminders: string[]        // ["08:00", "14:00"]
  frequency: string[]        // ["Everyday"] | ["Mon","Wed"]
}

let _swReg: ServiceWorkerRegistration | null = null

/** Register the service worker once and cache the registration. */
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

/** Request Notification permission. Returns true when granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/** Cancel all scheduled timeouts (call on logout / disable). */
const _handles: ReturnType<typeof setTimeout>[] = []
export function clearScheduledNotifications() {
  _handles.forEach(h => clearTimeout(h))
  _handles.length = 0
}

/** Day abbreviation → JS getDay() index (0 = Sun). */
const DAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

function habitActiveToday(habit: HabitForNotif): boolean {
  if (habit.frequency.includes('Everyday')) return true
  const today = new Date().getDay()
  return habit.frequency.some(d => DAY_MAP[d] === today)
}

/**
 * Schedule browser notifications for TODAY's reminders.
 * Call this after SW registration + permission granted.
 */
export async function scheduleHabitNotifications(habits: HabitForNotif[]) {
  const reg = await registerSW()
  if (!reg) return

  clearScheduledNotifications()

  const now = new Date()

  for (const habit of habits) {
    if (!habitActiveToday(habit)) continue

    for (const timeStr of habit.reminders) {
      const [h, m] = timeStr.split(':').map(Number)
      const fire = new Date()
      fire.setHours(h, m, 0, 0)

      const delay = fire.getTime() - now.getTime()
      if (delay <= 0) continue   // already passed today

      const handle = setTimeout(() => {
        // Use SW postMessage for reliable delivery in background tabs
        if (reg.active) {
          reg.active.postMessage({
            type: 'SHOW_NOTIFICATION',
            title: `🎯 ${habit.title}`,
            body: habit.description || 'Time to work on your habit!',
            tag: `habit-${habit.id}-${timeStr}`,
          })
        } else {
          // Fallback: direct Notification API
          new Notification(`🎯 ${habit.title}`, {
            body: habit.description || 'Time to work on your habit!',
            icon: '/logo.png',
          })
        }
      }, delay)

      _handles.push(handle)
    }
  }
}
