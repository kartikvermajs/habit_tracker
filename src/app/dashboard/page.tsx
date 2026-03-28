'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Settings, CalendarDays, ChevronRight, ListTodo, Plus, Check, Pencil, Trash2, Home } from 'lucide-react'
import { getHabits, toggleHabitLog, deleteHabit } from '@/actions/habit'
import { HabitForm } from '@/components/ui/habit-form'
import {
  requestNotificationPermission,
  scheduleHabitNotifications,
  registerSW,
} from '@/lib/notifications'
import { toast } from 'sonner'
import type { HabitFormDefaults } from '@/components/ui/habit-form'

// ─── Types ────────────────────────────────────────────────────────────────────
type HabitLog = { date: string | Date; completed: boolean; habitId: string }
type HabitWithLogs = {
  id: string; title: string; description?: string | null
  color?: string | null; frequency: string[]
  reminders: string[]
  startDate: string | Date; endDate?: string | Date | null; logs: HabitLog[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAY_LABELS_3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

function buildWeekDates(anchor: Date): Date[] {
  const week: Date[] = []
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - 3)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    week.push(d)
  }
  return week
}

function toDateStr(d: Date) { return d.toISOString().split('T')[0] }

function isHabitActiveOnDate(habit: HabitWithLogs, date: Date): boolean {
  const start = new Date(habit.startDate); start.setHours(0, 0, 0, 0)
  const sel = new Date(date); sel.setHours(0, 0, 0, 0)
  if (sel < start) return false
  if (habit.endDate) {
    const end = new Date(habit.endDate); end.setHours(0, 0, 0, 0)
    if (sel > end) return false
  }
  if (habit.frequency.includes('Everyday')) return true
  const dayName = DAY_NAMES[date.getDay()]
  return habit.frequency.some(f => f.toLowerCase() === dayName.toLowerCase())
}

function isCompleted(habit: HabitWithLogs, selectedDate: Date): boolean {
  return habit.logs.some(l => {
    const logDate = new Date(l.date)
    return logDate.toDateString() === selectedDate.toDateString() && l.completed
  })
}

const GHOST_COLORS = ['#c4b5fd', '#93c5fd', '#fdba74', '#fbcfe8'] as const
const FREQ_LABEL = (f: string[]) =>
  f.includes('Everyday') ? 'Everyday' : f.join(', ')

type Tab = 'today' | 'habits'

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [editingHabit, setEditingHabit] = useState<HabitFormDefaults | null>(null)

  const weekDates = useMemo(() => buildWeekDates(selectedDate), [selectedDate])

  // Prefetch adjacent routes so navigation is instant
  useEffect(() => {
    router.prefetch('/settings')
    router.prefetch('/dashboard/create')
  }, [router])

  // ── Fetch habits (staleTime/gcTime from global QueryClient defaults) ────────
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: getHabits,
    // keepPreviousData → no flicker when switching tabs
    placeholderData: keepPreviousData,
  })

  // ── Schedule notifications when habits load ───────────────────────────────
  useEffect(() => {
    if (habits.length === 0) return
    if (typeof window === 'undefined' || Notification.permission !== 'granted') return
    scheduleHabitNotifications(habits).catch(() => { })
  }, [habits])

  // ── Toggle log ────────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ habitId, dateStr }: { habitId: string; dateStr: string }) =>
      toggleHabitLog(habitId, dateStr),
    onMutate: async ({ habitId, dateStr }) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] })
      const prev = queryClient.getQueryData<HabitWithLogs[]>(['habits'])
      queryClient.setQueryData<HabitWithLogs[]>(['habits'], old =>
        old?.map(h => {
          if (h.id !== habitId) return h
          const date = new Date(dateStr); date.setHours(0, 0, 0, 0)
          const existing = h.logs.find(l =>
            new Date(l.date).toDateString() === date.toDateString()
          )
          if (existing) return { ...h, logs: h.logs.map(l => l === existing ? { ...l, completed: !l.completed } : l) }
          return { ...h, logs: [...h.logs, { date: dateStr, completed: true, habitId }] }
        })
      )
      return { prev }
    },
    onError: (_e, _v, ctx) => { queryClient.setQueryData(['habits'], ctx?.prev); toast.error('Failed to update') },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  })

  // ── Delete habit ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (habitId: string) => deleteHabit(habitId),
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] })
      const prev = queryClient.getQueryData<HabitWithLogs[]>(['habits'])
      queryClient.setQueryData<HabitWithLogs[]>(['habits'], old => old?.filter(h => h.id !== habitId))
      return { prev }
    },
    onError: (_e, _v, ctx) => { queryClient.setQueryData(['habits'], ctx?.prev); toast.error('Failed to delete') },
    onSuccess: () => toast.success('Habit deleted'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
  })

  const activeHabits = useMemo(
    () => habits.filter((h: HabitWithLogs) => isHabitActiveOnDate(h, selectedDate)),
    [habits, selectedDate]
  )
  const dateStr = useMemo(() => toDateStr(selectedDate), [selectedDate])

  // ── Edit handler ─────────────────────────────────────────────────────────
  const handleEdit = useCallback((habit: HabitWithLogs) => {
    setEditingHabit({
      editHabitId: habit.id,
      title: habit.title,
      description: habit.description ?? '',
      color: habit.color ?? '#8b5cf6',
      frequency: habit.frequency,
      reminders: habit.reminders,
      startDate: new Date(habit.startDate).toISOString().split('T')[0],
      endDate: habit.endDate ? new Date(habit.endDate as string).toISOString() : null,
    })
  }, [])

  // ── If edit mode, render HabitForm inline ────────────────────────────────
  if (editingHabit) {
    return (
      <HabitForm
        defaults={editingHabit}
        onClose={() => setEditingHabit(null)}
      />
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc] text-[#2c3e50] pb-32 touch-pan-y">

      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <header className="flex justify-between items-center px-6 pt-12 pb-4 sticky top-0 bg-[#fafbfc]/80 backdrop-blur-md z-10">
        <button
          onClick={() => router.push('/settings')}
          className="p-2 rounded-full bg-white shadow-[3px_3px_8px_rgba(0,0,0,0.07),-2px_-2px_6px_rgba(255,255,255,0.9)] active:scale-90 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08)] transition-all duration-100"
        >
          <Settings className="w-5 h-5 text-[#1e293b]" strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-bold tracking-wide text-[#0f172a]">
          {activeTab === 'today' ? 'Today' : 'My Habits'}
        </h1>
        <button className="p-2 rounded-full bg-white shadow-[3px_3px_8px_rgba(0,0,0,0.07),-2px_-2px_6px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08)] transition-all">
          <CalendarDays className="w-5 h-5 text-[#1e293b]" strokeWidth={2.5} />
        </button>
      </header>

      {/* ══════════════════ TODAY TAB ══════════════════════════════════════ */}
      {activeTab === 'today' && (
        <>
          {/* Date Selector */}
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

          {/* Habit List */}
          <div className="flex flex-col gap-3 px-5 mt-1">
            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="w-7 h-7 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
              </div>
            )}

            {!isLoading && activeHabits.map((habit: HabitWithLogs) => {
              const done = isCompleted(habit, selectedDate)
              const accentHex = habit.color ?? '#8b5cf6'
              return (
                <button
                  key={habit.id}
                  onClick={() => toggleMutation.mutate({ habitId: habit.id, dateStr })}
                  className={`flex items-center p-4 h-[76px] rounded-2xl border-2 border-dashed bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] transition-all active:scale-[0.98] ${done ? 'opacity-70' : ''}`}
                  style={{ borderColor: accentHex + '80' }}
                >
                  <div
                    className={`w-8 h-8 rounded-full border-2 shrink-0 ml-1 flex items-center justify-center transition-all ${done ? 'border-transparent' : 'border-slate-200'}`}
                    style={done ? { backgroundColor: accentHex } : {}}
                  >
                    {done && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex flex-col gap-1 ml-4 flex-1 items-start">
                    <span className={`text-sm font-bold ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {habit.title}
                    </span>
                    {habit.description && (
                      <span className="text-xs text-slate-400 leading-tight line-clamp-1">{habit.description}</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" strokeWidth={2.5} />
                </button>
              )
            })}

            {/* Ghost placeholders */}
            {!isLoading && habits.length === 0 && GHOST_COLORS.map((color, i) => {
              const opacity = 1 - i * 0.25
              const scale = 1 - i * 0.04
              return (
                <div
                  key={i}
                  className="flex items-center p-4 h-[72px] rounded-2xl border-2 border-dashed bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all"
                  style={{ borderColor: color, opacity, transform: `scale(${scale})`, filter: `blur(${i * 1.2}px)` }}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 shrink-0 ml-1" />
                  <div className="flex flex-col gap-2.5 ml-4 flex-1">
                    <div className="h-2 w-16 rounded-full" style={{ backgroundColor: color + '99' }} />
                    <div className="h-2 w-24 rounded-full" style={{ backgroundColor: color + '55' }} />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" strokeWidth={2.5} />
                </div>
              )
            })}

            {!isLoading && habits.length > 0 && activeHabits.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <p className="text-base font-bold text-slate-400">No habits for this day</p>
                <p className="text-sm text-slate-300 mt-1">Try a different date or add a habit</p>
              </div>
            )}
          </div>

          {/* Empty state text */}
          {!isLoading && habits.length === 0 && (
            <div className="flex flex-col items-center px-6 text-center mt-4">
              <h2 className="text-xl font-bold text-[#6d28d9] mb-1.5 tracking-tight">No Habits yet</h2>
              <p className="text-sm text-[#64748b] font-medium">Tap &quot;+&quot; to add your first habit</p>
            </div>
          )}
        </>
      )}

      {/* ══════════════════ HABITS TAB ══════════════════════════════════════ */}
      {activeTab === 'habits' && (
        <div className="flex flex-col gap-3 px-5 mt-4 pb-4">
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="w-7 h-7 rounded-full border-2 border-[#8b5cf6] border-t-transparent animate-spin" />
            </div>
          )}

          {!isLoading && habits.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#6d28d9]/10 flex items-center justify-center mb-4">
                <ListTodo className="w-7 h-7 text-[#8b5cf6]" />
              </div>
              <h2 className="text-lg font-bold text-[#6d28d9] mb-1.5">No Habits yet</h2>
              <p className="text-sm text-slate-400">Tap &quot;+&quot; to create your first habit</p>
            </div>
          )}

          {!isLoading && habits.map((habit: HabitWithLogs) => {
            const accentHex = habit.color ?? '#8b5cf6'
            const completedToday = isCompleted(habit, new Date())
            return (
              <div
                key={habit.id}
                className="bg-white rounded-3xl shadow-[4px_4px_16px_rgba(0,0,0,0.05),-4px_-4px_12px_rgba(255,255,255,0.9)] overflow-hidden"
              >
                {/* Colour accent bar */}
                <div className="h-1 w-full" style={{ backgroundColor: accentHex }} />
                <div className="p-4 flex items-center gap-4">
                  {/* Color dot */}
                  <div
                    className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: accentHex + '22', border: `2px solid ${accentHex}33` }}
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentHex }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{habit.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {FREQ_LABEL(habit.frequency)}
                      {habit.reminders.length > 0 && ` · ${habit.reminders.length} reminder${habit.reminders.length > 1 ? 's' : ''}`}
                    </p>
                    {completedToday && (
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: accentHex + '22', color: accentHex }}>
                        <Check className="w-2.5 h-2.5" strokeWidth={3} /> Done today
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(habit)}
                      className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shadow-[2px_2px_6px_rgba(0,0,0,0.06),-2px_-2px_4px_rgba(255,255,255,0.9)] active:shadow-[inset_1px_1px_4px_rgba(0,0,0,0.08)] transition-all hover:bg-[#8b5cf6]/10"
                    >
                      <Pencil className="w-4 h-4 text-[#8b5cf6]" strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${habit.title}"?`)) deleteMutation.mutate(habit.id)
                      }}
                      className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shadow-[2px_2px_6px_rgba(0,0,0,0.06),-2px_-2px_4px_rgba(255,255,255,0.9)] active:shadow-[inset_1px_1px_4px_rgba(0,0,0,0.08)] transition-all hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Bottom Nav ──────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <div className="bg-white rounded-[2rem] shadow-[0_-4px_24px_rgba(0,0,0,0.06),0_8px_16px_rgba(0,0,0,0.04)] h-20 flex justify-between items-center px-8 relative pointer-events-auto mx-auto max-w-[420px]">
          {/* Habits Tab */}
          <button
            onClick={() => setActiveTab('habits')}
            className="flex flex-col items-center gap-1.5 w-16"
          >
            <ListTodo
              className={`w-6 h-6 transition-colors ${activeTab === 'habits' ? 'text-[#6d28d9]' : 'text-slate-400'}`}
              strokeWidth={2.5}
            />
            <span className={`text-[10px] font-bold transition-colors ${activeTab === 'habits' ? 'text-[#6d28d9]' : 'text-slate-400'}`}>
              Habits
            </span>
          </button>

          {/* Centre FAB */}
          <button
            onClick={() => router.push('/dashboard/create')}
            className="absolute left-1/2 -top-6 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(109,40,217,0.4)] hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="w-8 h-8" strokeWidth={3} />
          </button>

          {/* Today Tab (right side) */}
          <button
            onClick={() => setActiveTab('today')}
            className="flex flex-col items-center gap-1.5 w-16"
          >
            <Home
              className={`w-6 h-6 transition-colors ${activeTab === 'today' ? 'text-[#6d28d9]' : 'text-slate-400'}`}
              strokeWidth={2.5}
            />
            <span className={`text-[10px] font-bold transition-colors ${activeTab === 'today' ? 'text-[#6d28d9]' : 'text-slate-400'}`}>
              Home
            </span>
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
