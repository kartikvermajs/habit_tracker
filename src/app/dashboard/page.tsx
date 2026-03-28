import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'
import { logout } from '@/actions/auth'
import { createHabit, toggleHabitLog, deleteHabit } from '@/actions/habit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { isAuth, userId } = await verifySession()

  if (!isAuth || !userId) {
    redirect('/login')
  }

  const habits = await prisma.habit.findMany({
    where: { userId },
    include: {
      logs: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col min-h-screen p-6 max-w-4xl mx-auto w-full gap-8">
      <header className="flex justify-between items-center py-4">
        <h1 className="text-3xl font-bold text-foreground">Habits</h1>
        <form action={logout}>
          <Button variant="ghost" type="submit">
            Log out
          </Button>
        </form>
      </header>

      <div className="bg-background shadow-neo p-8 rounded-3xl mb-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Create New Habit</h2>
        <form action={createHabit} className="flex gap-4 items-end">
          <div className="flex-1">
            <Input name="title" placeholder="Habit Title (e.g. Drink water)" required />
          </div>
          <div className="flex-1">
            <Input name="frequency" placeholder="Frequency (e.g. daily)" required />
          </div>
          <Button type="submit">Add Habit</Button>
        </form>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {habits.map((habit) => {
          const isCompletedToday = habit.logs[0]?.completed ?? false

          return (
            <div key={habit.id} className="bg-background shadow-neo p-6 rounded-3xl flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{habit.title}</h3>
                <span className="text-xs uppercase px-2 py-1 rounded bg-black/5 text-foreground/70">
                  {habit.frequency}
                </span>
              </div>
              <div className="flex-1" />
              <div className="flex justify-between items-center mt-4">
                 <form action={toggleHabitLog.bind(null, habit.id)}>
                   <Button variant={isCompletedToday ? "pressed" : "default"} type="submit">
                     {isCompletedToday ? "Done" : "Mark as Done"}
                   </Button>
                 </form>
                 <form action={deleteHabit.bind(null, habit.id)}>
                   <Button variant="ghost" className="text-red-500 hover:bg-red-50 hover:text-red-600" size="icon" type="submit">
                     ✕
                   </Button>
                 </form>
              </div>
            </div>
          )
        })}
        {habits.length === 0 && (
          <div className="col-span-full py-12 text-center text-foreground/50 text-lg">
            No habits yet. Create your first one above!
          </div>
        )}
      </div>
    </div>
  )
}
