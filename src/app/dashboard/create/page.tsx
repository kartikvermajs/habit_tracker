'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Droplets, BookOpen, Moon, GraduationCap, Dumbbell, Plus } from 'lucide-react'
import { HabitForm } from '@/components/ui/habit-form'
import type { HabitFormDefaults } from '@/components/ui/habit-form'

const PREDEFINED_HABITS: {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  defaults: HabitFormDefaults
}[] = [
  {
    id: 'water',
    label: 'Drink Water',
    icon: <Droplets className="w-5 h-5" />,
    color: '#3b82f6',
    defaults: {
      title: 'Drink Water',
      description: 'Stay hydrated throughout the day. Aim for 8 glasses.',
      color: '#3b82f6',
      reminders: ['08:00', '11:00', '14:00', '17:00', '20:00'],
    },
  },
  {
    id: 'read',
    label: 'Read Book',
    icon: <BookOpen className="w-5 h-5" />,
    color: '#f59e0b',
    defaults: {
      title: 'Read Book',
      description: 'Read for at least 20 minutes every day.',
      color: '#f59e0b',
      reminders: ['21:00'],
    },
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: <Moon className="w-5 h-5" />,
    color: '#8b5cf6',
    defaults: {
      title: 'Sleep',
      description: 'Get 7–8 hours of quality sleep.',
      color: '#8b5cf6',
      reminders: ['22:30'],
    },
  },
  {
    id: 'study',
    label: 'Study',
    icon: <GraduationCap className="w-5 h-5" />,
    color: '#10b981',
    defaults: {
      title: 'Study',
      description: 'Dedicate focused time to learning every day.',
      color: '#10b981',
      reminders: ['09:00', '19:00'],
    },
  },
  {
    id: 'exercise',
    label: 'Exercise',
    icon: <Dumbbell className="w-5 h-5" />,
    color: '#ef4444',
    defaults: {
      title: 'Exercise',
      description: 'Get your body moving for at least 30 minutes.',
      color: '#ef4444',
      reminders: ['07:00'],
    },
  },
]

export default function CreateHabitPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<HabitFormDefaults | null>(null)

  if (selected !== null) {
    return <HabitForm defaults={selected} onClose={() => setSelected(null)} />
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <header className="flex items-center px-5 pt-12 pb-5 sticky top-0 bg-[#fafbfc]/90 backdrop-blur-md z-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-full bg-white shadow-[3px_3px_8px_rgba(0,0,0,0.07),-2px_-2px_6px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08)] transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-[#1e293b]" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-[#0f172a] -ml-9">
          Create Habit
        </h1>
      </header>

      <div className="flex flex-col gap-6 px-5 pb-12">
        {/* Custom Habit */}
        <button
          onClick={() => setSelected({})}
          className="flex items-center justify-between w-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white p-5 rounded-3xl shadow-[0_8px_20px_rgba(109,40,217,0.3)] active:scale-[0.98] transition-all"
        >
          <div className="flex flex-col items-start">
            <span className="text-base font-bold">Custom Habit</span>
            <span className="text-sm text-white/70 mt-0.5">Build your own routine</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
        </button>

        {/* Predefined section */}
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          Quick Start
        </p>

        <div className="flex flex-col gap-3">
          {PREDEFINED_HABITS.map(habit => (
            <button
              key={habit.id}
              onClick={() => setSelected(habit.defaults)}
              className="flex items-center gap-4 w-full bg-white p-4 rounded-2xl shadow-[3px_3px_12px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06)] transition-all"
            >
              {/* Color dot with icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: habit.color, boxShadow: `0 4px 12px ${habit.color}55` }}
              >
                {habit.icon}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-slate-800">{habit.label}</span>
                <span className="text-xs text-slate-400 mt-0.5">
                  {habit.defaults.description?.slice(0, 45)}…
                </span>
              </div>
              <svg className="ml-auto w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
