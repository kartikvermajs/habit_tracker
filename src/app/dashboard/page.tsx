import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { logout } from '@/actions/auth'
import { createHabit, toggleHabitLog, deleteHabit } from '@/actions/habit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { redirect } from 'next/navigation'
import { Settings, CalendarDays, ChevronRight, ListTodo, Plus, User } from 'lucide-react'

export default async function DashboardPage() {
  const { isAuth, userId } = await verifySession()

  if (!isAuth || !userId) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fafbfc] text-[#2c3e50] font-sans pb-24 touch-pan-y">
      {/* Top Header */}
      <header className="flex justify-between items-center px-6 pt-10 pb-4 sticky top-0 bg-[#fafbfc]/80 backdrop-blur-md z-10">
        <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <Settings className="w-6 h-6 text-[#1e293b]" strokeWidth={2.5} />
        </button>
        <h1 className="text-xl font-bold tracking-wide text-[#0f172a]">Today</h1>
        <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <CalendarDays className="w-6 h-6 text-[#1e293b]" strokeWidth={2.5} />
        </button>
      </header>

      {/* Date Selector Row */}
      <div className="flex overflow-x-auto gap-3 px-6 py-4 hide-scrollbar snap-x">
        {/* Mock dates exactly as in image: THU 26, FRI 27, SAT 28, SUN 29, MON 30, TUE 31 */}
        {[
          { text: 'THU', num: '26' },
          { text: 'FRI', num: '27' },
          { text: 'SAT', num: '28' },
          { text: 'SUN', num: '29', active: true },
          { text: 'MON', num: '30' },
          { text: 'TUE', num: '31' },
        ].map((day) => (
          <div key={day.num} className="flex flex-col items-center gap-2 shrink-0 snap-center">
            <button
              className={`flex flex-col items-center justify-center w-[60px] h-20 rounded-2xl transition-all duration-300 ${
                day.active
                  ? 'bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white shadow-[0_8px_16px_rgba(109,40,217,0.3)] scale-105 border-0'
                  : 'bg-white text-slate-500 shadow-[2px_4px_12px_rgba(0,0,0,0.03)] border border-slate-100 hover:shadow-[4px_6px_16px_rgba(0,0,0,0.05)]'
              }`}
            >
              <span className={`text-[11px] font-bold tracking-wider ${day.active ? 'text-white/90' : 'text-slate-400'}`}>
                {day.text}
              </span>
              <span className={`text-xl font-bold mt-1 ${day.active ? 'text-white' : 'text-slate-800'}`}>
                {day.num}
              </span>
            </button>
            {/* Active Dot */}
            <div className={`w-1.5 h-1.5 rounded-full ${day.active ? 'bg-[#6d28d9]' : 'bg-transparent'}`} />
          </div>
        ))}
      </div>

      {/* Ghost Habit Cards Section */}
      <div className="flex flex-col gap-4 px-6 mt-2">
        {/* Purple Ghost Card */}
        <div className="flex items-center p-4 h-[72px] rounded-2xl border-2 border-dashed border-[#c4b5fd] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]">
          <div className="w-8 h-8 rounded-full border-[2.5px] border-[#e2e8f0] shrink-0 ml-1" />
          <div className="flex flex-col gap-2.5 ml-4 flex-1">
            <div className="h-2 w-16 bg-[#c4b5fd]/60 rounded-full" />
            <div className="h-2 w-24 bg-[#c4b5fd]/30 rounded-full" />
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" strokeWidth={2.5} />
        </div>

        {/* Blue Ghost Card */}
        <div className="flex items-center p-4 h-[72px] rounded-2xl border-2 border-dashed border-[#93c5fd] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]">
          <div className="w-8 h-8 rounded-full border-[2.5px] border-[#e2e8f0] shrink-0 ml-1" />
          <div className="flex flex-col gap-2.5 ml-4 flex-1">
            <div className="h-2 w-16 bg-[#93c5fd]/60 rounded-full" />
            <div className="h-2 w-24 bg-[#93c5fd]/30 rounded-full" />
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" strokeWidth={2.5} />
        </div>

        {/* Orange Ghost Card */}
        <div className="flex items-center p-4 h-[72px] rounded-2xl border-2 border-dashed border-[#fdba74] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]">
          <div className="w-8 h-8 rounded-full border-[2.5px] border-[#e2e8f0] shrink-0 ml-1" />
          <div className="flex flex-col gap-2.5 ml-4 flex-1">
            <div className="h-2 w-16 bg-[#fdba74]/60 rounded-full" />
            <div className="h-2 w-24 bg-[#fdba74]/30 rounded-full" />
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" strokeWidth={2.5} />
        </div>

        {/* Pink Ghost Card */}
        <div className="flex items-center p-4 h-[72px] rounded-2xl border-2 border-dashed border-[#fbcfe8] bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-transform active:scale-[0.98]">
          <div className="w-8 h-8 rounded-full border-[2.5px] border-[#e2e8f0] shrink-0 ml-1" />
          <div className="flex flex-col gap-2.5 ml-4 flex-1">
            <div className="h-2 w-16 bg-[#fbcfe8]/60 rounded-full" />
            <div className="h-2 w-24 bg-[#fbcfe8]/30 rounded-full" />
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300" strokeWidth={2.5} />
        </div>
      </div>

      {/* Empty State Text */}
      <div className="flex flex-col items-center justify-center mt-10 px-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-[#6d28d9] mb-2 tracking-tight">
          No Habits yet
        </h2>
        <p className="text-[#64748b] font-medium">
          Tap "+" to add your first habit
        </p>
      </div>

      {/* Bottom Navigation (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
        <div className="bg-white rounded-[2rem] shadow-[0_-4px_24px_rgba(0,0,0,0.06),_0_8px_16px_rgba(0,0,0,0.04)] h-20 flex justify-between items-center px-8 relative pointer-events-auto mx-auto max-w-[400px]">
          {/* Habits Tab (Active) */}
          <button className="flex flex-col items-center gap-1.5 w-16 group">
            <ListTodo className="w-6 h-6 text-[#6d28d9]" strokeWidth={2.5} />
            <span className="text-[10px] font-bold text-[#6d28d9]">Habits</span>
          </button>

          {/* Center Floating + Button */}
          <button className="absolute left-1/2 -top-6 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(109,40,217,0.4)] hover:scale-105 active:scale-95 transition-transform">
            <Plus className="w-8 h-8" strokeWidth={3} />
          </button>

          {/* User Profile Tab (Inactive) */}
          <button className="flex flex-col items-center gap-1.5 w-16 group opacity-50 hover:opacity-80 transition-opacity">
            <User className="w-6 h-6 text-[#64748b]" strokeWidth={2.5} />
            <span className="text-[10px] font-bold text-[#64748b]">Profile</span>
          </button>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
