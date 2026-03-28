'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Settings, CalendarDays, ChevronRight, ListTodo, Plus, User, Check } from 'lucide-react'
import { getHabits, toggleHabitLog } from '@/actions/habit'
import { toast } from 'sonner'

// ─── lightweight type matching Prisma return shape ───────────────────────────
type HabitLog = { date: string | Date; completed: boolean; habitId: string }
type HabitWithLogs = {
  id: string; title: string; description?: string | null;
  color?: string | null; frequency: string[]; startDate: string | Date;
  endDate?: string | Date | null; logs: HabitLog[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_LABELS_3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function buildWeekDates(anchor: Date): Date[] {
  const week: Date[] = []
  const start = new Date(anchor)
  // Go back to previous Sunday to fill a 7-day window centered on anchor
  start.setDate(anchor.getDate() - 3)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    week.push(d)
  }
  return week
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function isHabitActiveOnDate(habit: any, date: Date): boolean {
  const start = new Date(habit.startDate)
  start.setHours(0, 0, 0, 0)
  const sel = new Date(date)
  sel.setHours(0, 0, 0, 0)

  if (sel < start) return false
  if (habit.endDate) {
    const end = new Date(habit.endDate)
    end.setHours(0, 0, 0, 0)
    if (sel > end) return false
  }

  if (habit.frequency.includes('Everyday')) return true
  const dayName = DAY_NAMES[date.getDay()]
  // habit.frequency stores short 3-letter Mon–Sun
  return habit.frequency.some(
    (f: string) => f.toLowerCase() === dayName.toLowerCase()
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Ghost placeholder colours for empty state
// ─────────────────────────────────────────────────────────────────────────────
const GHOST_COLORS = ['#c4b5fd', '#93c5fd', '#fdba74', '#fbcfe8']

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date())

  const weekDates = useMemo(() => buildWeekDates(selectedDate), [selectedDate])

  // ── Fetch habits ────────────────────────────────────────────────────────────
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: getHabits,
    staleTime: 60_000,
  })

  // ── Toggle habit log ────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ habitId, dateStr }: { habitId: string; dateStr: string }) =>
      toggleHabitLog(habitId, dateStr),
    // Optimistic update
    onMutate: async ({ habitId, dateStr }) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] })
      const prev = queryClient.getQueryData<any[]>(['habits'])
      queryClient.setQueryData<any[]>(['habits'], old =>
        old?.map(h => {
          if (h.id !== habitId) return h
          const date = new Date(dateStr)
          date.setHours(0, 0, 0, 0)
          const existingLog = h.logs.find(
            (l: any) => new Date(l.date).toDateString() === date.toDateString()
          )
          if (existingLog) {
            return {
              ...h,
              logs: h.logs.map((l: any) =>
                l === existingLog ? { ...l, completed: !l.completed } : l
              ),
            }
          }
          return {
            ...h,
            logs: [...h.logs, { date: dateStr, completed: true, habitId }],
          }
        })
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(['habits'], ctx?.prev)
      toast.error('Failed to update')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  })

  // ── Filter habits for selected date ────────────────────────────────────────
  const activeHabits = useMemo(
    () => habits.filter((h: HabitWithLogs) => isHabitActiveOnDate(h, selectedDate)),
    [habits, selectedDate]
  )

  const dateStr = toDateStr(selectedDate)

  function isCompleted(habit: any): boolean {
    return habit.logs.some((l: any) => {
      const logDate = new Date(l.date)
      return (
        logDate.toDateString() === selectedDate.toDateString() && l.completed
      )
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc] text-[#2c3e50] pb-32 touch-pan-y">

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="flex justify-between items-center px-6 pt-12 pb-4 sticky top-0 bg-[#fafbfc]/80 backdrop-blur-md z-10">
        <button
          onClick={() => router.push('/settings')}
          className="p-2 rounded-full bg-white shadow-[3px_3px_8px_rgba(0,0,0,0.07),-2px_-2px_6px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08)] transition-all"
        >
          <Settings className="w-5 h-5 text-[#1e293b]" strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-bold tracking-wide text-[#0f172a]">Today</h1>
        <button className="p-2 rounded-full bg-white shadow-[3px_3px_8px_rgba(0,0,0,0.07),-2px_-2px_6px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08)] transition-all">
          <CalendarDays className="w-5 h-5 text-[#1e293b]" strokeWidth={2.5} />
        </button>
      </header>

      {/* ── Date Selector ───────────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto gap-3 px-5 py-4 hide-scrollbar snap-x">
        {weekDates.map(date => {
          const isActive = toDateStr(date) === toDateStr(selectedDate)
          const dayIdx = date.getDay()
          return (
            <div key={toDateStr(date)} className="flex flex-col items-center gap-1.5 shrink-0 snap-center">
              <button
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center w-[58px] h-[78px] rounded-[20px] transition-all duration-300 ${isActive
                  ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-[0_8px_16px_rgba(109,40,217,0.3)] scale-105'
                  : 'bg-white text-slate-500 shadow-[3px_3px_10px_rgba(0,0,0,0.04),-3px_-3px_8px_rgba(255,255,255,0.9)] hover:scale-[1.02]'
                  }`}
              >
                <span className={`text-[10px] font-bold tracking-widest mb-1 ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                  {DAY_LABELS_3[dayIdx]}
                </span>
                <span className={`text-xl font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>
                  {date.getDate()}
                </span>
              </button>
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-[#6d28d9]' : 'bg-transparent'}`} />
            </div>
          )
        })}
      </div>

      {/* ── Habit List ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-5 mt-1">
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
          </div>
        )}

        {!isLoading && activeHabits.length > 0 &&
          activeHabits.map((habit: HabitWithLogs) => {
            const done = isCompleted(habit)
            const accentHex = habit.color ?? '#8b5cf6'
            return (
              <button
                key={habit.id}
                onClick={() =>
                  toggleMutation.mutate({ habitId: habit.id, dateStr })
                }
                className={`flex items-center p-4 h-[76px] rounded-2xl border-2 border-dashed bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] ${done ? 'opacity-80' : ''}`}
                style={{ borderColor: accentHex + '80' }}
              >
                {/* Checkbox */}
                <div
                  className={`w-8 h-8 rounded-full border-2 shrink-0 ml-1 flex items-center justify-center transition-all ${done ? 'border-transparent' : 'border-slate-200'}`}
                  style={done ? { backgroundColor: accentHex } : {}}
                >
                  {done && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </div>
                {/* Text */}
                <div className="flex flex-col gap-1 ml-4 flex-1 items-start">
                  <span
                    className={`text-sm font-bold ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                  >
                    {habit.title}
                  </span>
                  {habit.description && (
                    <span className="text-xs text-slate-400 leading-tight line-clamp-1">
                      {habit.description}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" strokeWidth={2.5} />
              </button>
            )
          })}

        {/* Ghost placeholders when no habits */}
        {!isLoading && habits.length === 0 &&
          GHOST_COLORS.map((color, i) => {
            const opacity = 1 - i * 0.25
            const scale = 1 - i * 0.04

            return (
              <div
                key={i}
                className="flex items-center p-4 h-[72px] rounded-2xl border-2 border-dashed bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all"
                style={{
                  borderColor: color,
                  opacity,
                  transform: `scale(${scale})`,
                  filter: `blur(${i * 1.2}px)` // subtle blur increase
                }}
              >
                <div className="w-8 h-8 rounded-full border-2 border-slate-200 shrink-0 ml-1" />

                <div className="flex flex-col gap-2.5 ml-4 flex-1">
                  <div
                    className="h-2 w-16 rounded-full"
                    style={{ backgroundColor: color + '99' }}
                  />
                  <div
                    className="h-2 w-24 rounded-full"
                    style={{ backgroundColor: color + '55' }}
                  />
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={2.5} />
              </div>
            )
          })
        }

        {/* No habits for this date (but user has habits) */}
        {!isLoading && habits.length > 0 && activeHabits.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <p className="text-base font-bold text-slate-400">No habits for this day</p>
            <p className="text-sm text-slate-300 mt-1">Try a different date or add a habit</p>
          </div>
        )}
      </div>

      {/* ── Empty‑state text ───────────────────────────────────────────────── */}
      {!isLoading && habits.length === 0 && (
        <div className="flex flex-col items-center px-6 text-center">
          <h2 className="text-xl font-bold text-[#6d28d9] mb-1.5 tracking-tight">
            No Habits yet
          </h2>
          <p className="text-sm text-[#64748b] font-medium">
            Tap &quot;+&quot; to add your first habit
          </p>
        </div>
      )}

      {/* ── Bottom Nav ─────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <div className="bg-white rounded-[2rem] shadow-[0_-4px_24px_rgba(0,0,0,0.06),0_8px_16px_rgba(0,0,0,0.04)] h-20 flex justify-between items-center px-8 relative pointer-events-auto mx-auto max-w-[420px]">
          {/* Habits Tab */}
          <button className="flex flex-col items-center gap-1.5 w-16">
            <ListTodo className="w-6 h-6 text-[#6d28d9]" strokeWidth={2.5} />
            <span className="text-[10px] font-bold text-[#6d28d9]">Habits</span>
          </button>

          {/* Centre FAB */}
          <button
            onClick={() => router.push('/dashboard/create')}
            className="absolute left-1/2 -top-6 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(109,40,217,0.4)] hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-8 h-8" strokeWidth={3} />
          </button>

          {/* Profile Tab */}
          <button
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center gap-1.5 w-16 opacity-50 hover:opacity-80 transition-opacity"
          >
            <User className="w-6 h-6 text-[#64748b]" strokeWidth={2.5} />
            <span className="text-[10px] font-bold text-[#64748b]">Profile</span>
          </button>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
