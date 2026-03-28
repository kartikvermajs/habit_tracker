'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createHabit, updateHabit } from '@/actions/habit'
import { toast } from 'sonner'
import { ArrowLeft, X, Plus, Clock } from 'lucide-react'

// ─── Preset colours ───────────────────────────────────────────────────────────
const PRESET_COLORS = [
  { hex: '#8b5cf6', label: 'Purple' },
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#10b981', label: 'Emerald' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#ef4444', label: 'Red' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#14b8a6', label: 'Teal' },
  { hex: '#f97316', label: 'Orange' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export interface HabitFormDefaults {
  title?: string
  description?: string
  color?: string
  reminders?: string[]
  // Edit-mode extras
  editHabitId?: string
  frequency?: string[]
  startDate?: string
  endDate?: string | null
}

interface HabitFormProps {
  defaults?: HabitFormDefaults
  onClose?: () => void
}

export function HabitForm({ defaults = {}, onClose }: HabitFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditing = !!defaults.editHabitId

  // Prefetch dashboard so back navigation is instant
  useEffect(() => { router.prefetch('/dashboard') }, [router])

  const [title, setTitle] = useState(defaults.title ?? '')
  const [description, setDescription] = useState(defaults.description ?? '')
  const [color, setColor] = useState(defaults.color ?? '#8b5cf6')
  const initialFreq = defaults.frequency ?? []
  const [everydayMode, setEverydayMode] = useState(
    initialFreq.length === 0 || initialFreq.includes('Everyday')
  )
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initialFreq.filter(f => f !== 'Everyday')
  )
  const [reminders, setReminders] = useState<string[]>(defaults.reminders ?? [])
  const [startDate, setStartDate] = useState(
    defaults.startDate ?? new Date().toISOString().split('T')[0]
  )
  const [neverEnd, setNeverEnd] = useState(!defaults.endDate)
  const [endDate, setEndDate] = useState(
    defaults.endDate ? new Date(defaults.endDate).toISOString().split('T')[0] : ''
  )

  // ── Mutation ────────────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof createHabit>[0]) =>
      isEditing
        ? updateHabit(defaults.editHabitId!, payload)
        : createHabit(payload),
    onSuccess: () => {
      // Navigate FIRST for zero perceived latency
      if (onClose) {
        onClose()
      } else {
        router.push('/dashboard')
      }
      // Invalidate + toast as background tasks (non-blocking)
      toast.success(isEditing ? 'Habit updated!' : 'Habit created!')
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function toggleDay(day: string) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function addReminder() {
    setReminders(prev => [...prev, '08:00'])
  }

  function updateReminder(idx: number, val: string) {
    setReminders(prev => prev.map((r, i) => (i === idx ? val : r)))
  }

  function removeReminder(idx: number) {
    setReminders(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Habit name is required'); return }
    const frequency = everydayMode ? ['Everyday'] : selectedDays
    if (!everydayMode && frequency.length === 0) {
      toast.error('Select at least one day'); return
    }
    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      color,
      frequency,
      reminders,
      startDate,
      endDate: neverEnd ? undefined : endDate || undefined,
    })
  }

  const handleBack = () => { if (onClose) onClose(); else router.push('/dashboard') }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <header className="flex items-center px-5 pt-12 pb-5 sticky top-0 bg-[#fafbfc]/90 backdrop-blur-md z-10">
        <button
          onClick={handleBack}
          className="p-2 rounded-full bg-white shadow-[3px_3px_8px_rgba(0,0,0,0.07),-2px_-2px_6px_rgba(255,255,255,0.9)] active:scale-90 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08)] transition-all duration-100"
        >
          <ArrowLeft className="w-5 h-5 text-[#1e293b]" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-[#0f172a] -ml-9">
          {isEditing ? 'Edit Habit' : 'Create Habit'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-5 pb-32 overflow-y-auto">

        {/* ── Name ── */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Habit Name</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Drink Water"
            required
            className="w-full bg-white rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-300 outline-none shadow-[3px_3px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.9)] focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all text-sm font-medium"
          />
        </div>

        {/* ── Description ── */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description <span className="normal-case font-normal">(optional)</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Why is this habit important to you?"
            rows={3}
            className="w-full bg-white rounded-2xl px-4 py-3.5 text-slate-800 placeholder-slate-300 outline-none shadow-[3px_3px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.9)] focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] transition-all text-sm font-medium resize-none"
          />
        </div>

        {/* ── Color ── */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Color</label>
          <div className="flex gap-3 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                className={`w-9 h-9 rounded-full transition-all ${color === c.hex ? 'scale-125 shadow-[0_4px_12px_rgba(0,0,0,0.25)]' : 'opacity-70 hover:opacity-100 hover:scale-110'}`}
                style={{ backgroundColor: c.hex }}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        {/* ── Frequency ── */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Frequency</label>
          {/* Toggle row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEverydayMode(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${everydayMode ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-[0_4px_12px_rgba(109,40,217,0.3)]' : 'bg-white text-slate-500 shadow-[2px_3px_8px_rgba(0,0,0,0.05),-2px_-2px_6px_rgba(255,255,255,0.9)]'}`}
            >
              Everyday
            </button>
            <button
              type="button"
              onClick={() => setEverydayMode(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!everydayMode ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-[0_4px_12px_rgba(109,40,217,0.3)]' : 'bg-white text-slate-500 shadow-[2px_3px_8px_rgba(0,0,0,0.05),-2px_-2px_6px_rgba(255,255,255,0.9)]'}`}
            >
              Custom Days
            </button>
          </div>
          {/* Day pills */}
          {!everydayMode && (
            <div className="flex gap-2 flex-wrap mt-1">
              {DAYS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${selectedDays.includes(d) ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-[0_4px_10px_rgba(109,40,217,0.3)]' : 'bg-white text-slate-500 shadow-[2px_3px_8px_rgba(0,0,0,0.06),-2px_-2px_5px_rgba(255,255,255,0.9)]'}`}
                >
                  {d.slice(0, 1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Reminders ── */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reminders</label>
          {reminders.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-[3px_3px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.9)]">
                <Clock className="w-4 h-4 text-[#8b5cf6]" />
                <input
                  type="time"
                  value={r}
                  onChange={e => updateReminder(i, e.target.value)}
                  className="flex-1 text-sm font-medium text-slate-700 bg-transparent outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => removeReminder(i)}
                className="p-2 rounded-full bg-white shadow-[2px_2px_6px_rgba(0,0,0,0.07),-2px_-2px_5px_rgba(255,255,255,0.9)] active:shadow-[inset_1px_1px_4px_rgba(0,0,0,0.08)] transition-all text-slate-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addReminder}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white text-[#8b5cf6] text-sm font-semibold shadow-[3px_3px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.07)] transition-all hover:text-[#6d28d9]"
          >
            <Plus className="w-4 h-4" /> Add Reminder
          </button>
        </div>

        {/* ── Start Date ── */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-white rounded-2xl px-4 py-3.5 text-slate-700 outline-none shadow-[3px_3px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.9)] focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06)] transition-all text-sm font-medium"
          />
        </div>

        {/* ── End Date ── */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">End Date</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNeverEnd(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${neverEnd ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-[0_4px_12px_rgba(109,40,217,0.3)]' : 'bg-white text-slate-500 shadow-[2px_3px_8px_rgba(0,0,0,0.05),-2px_-2px_6px_rgba(255,255,255,0.9)]'}`}
            >
              Never
            </button>
            <button
              type="button"
              onClick={() => setNeverEnd(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${!neverEnd ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-[0_4px_12px_rgba(109,40,217,0.3)]' : 'bg-white text-slate-500 shadow-[2px_3px_8px_rgba(0,0,0,0.05),-2px_-2px_6px_rgba(255,255,255,0.9)]'}`}
            >
              Specific Date
            </button>
          </div>
          {!neverEnd && (
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              className="w-full bg-white rounded-2xl px-4 py-3.5 text-slate-700 outline-none shadow-[3px_3px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.9)] focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06)] transition-all text-sm font-medium"
            />
          )}
        </div>

        {/* ── Submit ── */}
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-[#fafbfc] via-[#fafbfc] to-transparent">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-4 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white font-bold text-base shadow-[0_6px_20px_rgba(109,40,217,0.35)] active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            {mutation.isPending ? 'Saving…' : 'Save Habit'}
          </button>
        </div>
      </form>
    </div>
  )
}
