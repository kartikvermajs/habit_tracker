'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell, BellOff, Trash2, AlertTriangle, X } from 'lucide-react'
import { logout } from '@/actions/auth'
import { deleteAccount } from '@/actions/user'
import { getHabits } from '@/actions/habit'
import {
  requestNotificationPermission,
  registerSW,
  scheduleHabitNotifications,
  clearScheduledNotifications,
} from '@/lib/notifications'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Prefetch dashboard for instant back navigation
  useEffect(() => { router.prefetch('/dashboard') }, [router])

  // Sync initial state from Notification.permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted')
    }
  }, [])

  async function handleNotificationToggle() {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission()
      if (granted) {
        await registerSW()
        const habits = await getHabits().catch(() => [])
        await scheduleHabitNotifications(habits)
        setNotificationsEnabled(true)
        toast.success('Notifications enabled! Reminders are scheduled.')
      } else {
        toast.error('Permission denied. Please enable notifications in your browser settings.')
      }
    } else {
      clearScheduledNotifications()
      setNotificationsEnabled(false)
      toast.info('Notifications disabled.')
    }
  }

  function handleDeleteAccount() {
    startTransition(async () => {
      try {
        await deleteAccount()
        toast.success('Account deleted.')
      } catch (e: any) {
        toast.error(e.message)
      }
    })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <header className="flex items-center px-5 pt-12 pb-5 sticky top-0 bg-[#fafbfc]/90 backdrop-blur-md z-10">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-2 rounded-full bg-white shadow-[3px_3px_8px_rgba(0,0,0,0.07),-2px_-2px_6px_rgba(255,255,255,0.9)] active:scale-90 active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08)] transition-all duration-100"
        >
          <ArrowLeft className="w-5 h-5 text-[#1e293b]" />
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-[#0f172a] -ml-9">
          Settings
        </h1>
      </header>

      <div className="flex flex-col gap-4 px-5 pb-12">

        {/* ── Notifications ── */}
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mt-2">Preferences</p>
        <div className="bg-white rounded-3xl shadow-[4px_4px_16px_rgba(0,0,0,0.05),-4px_-4px_12px_rgba(255,255,255,0.9)] p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${notificationsEnabled ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9]' : 'bg-slate-100'}`}>
              {notificationsEnabled
                ? <Bell className="w-5 h-5 text-white" />
                : <BellOff className="w-5 h-5 text-slate-400" />
              }
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Allow Notifications</p>
              <p className="text-xs text-slate-400 mt-0.5">Habit reminders & alerts</p>
            </div>
          </div>
          {/* Toggle switch */}
          <button
            onClick={handleNotificationToggle}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${notificationsEnabled ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9]' : 'bg-slate-200'} shadow-[inset_1px_1px_4px_rgba(0,0,0,0.1)]`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[1px_1px_4px_rgba(0,0,0,0.1)] transition-transform duration-300 ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* ── Account ── */}
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 mt-4">Account</p>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full bg-white rounded-3xl shadow-[4px_4px_16px_rgba(0,0,0,0.05),-4px_-4px_12px_rgba(255,255,255,0.9)] p-5 flex items-center gap-4 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06)] transition-all"
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-slate-100">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-700">Log Out</span>
          </button>
        </form>

        {/* ── Danger Zone ── */}
        <p className="text-xs font-bold text-red-400 uppercase tracking-widest px-1 mt-4">Danger Zone</p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full bg-white rounded-3xl shadow-[4px_4px_16px_rgba(0,0,0,0.05),-4px_-4px_12px_rgba(255,255,255,0.9)] p-5 flex items-center gap-4 border border-red-100 active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.06)] transition-all"
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-red-50">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-bold text-red-600">Delete Account Permanently</span>
            <span className="text-xs text-red-400 mt-0.5">This action cannot be undone</span>
          </div>
        </button>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm px-4 pb-8">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] p-6 flex flex-col gap-5 animate-[slideUp_0.25s_ease-out]">
            {/* Close */}
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 rounded-full bg-slate-100 active:scale-95 transition-transform"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Delete Account?</h2>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                All your habits and progress will be permanently deleted. This action <strong>cannot</strong> be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-semibold text-sm active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isPending}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm shadow-[0_4px_14px_rgba(239,68,68,0.35)] active:scale-[0.98] disabled:opacity-60 transition-all"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}
