import { Icon } from './Icons'

export default function AdminSummaryCard({ label, value, icon, accent = 'blue' }) {
  const accentClass = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    orange: 'bg-orange-50 text-orange-700',
  }[accent]

  return (
    <article className="flex min-h-32 items-start justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-bold text-slate-700">{label}</h2>
        <p className="mt-4 font-display text-3xl font-bold text-slate-950">
          {value}
        </p>
      </div>
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClass}`}>
        <Icon name={icon} size={19} />
      </span>
    </article>
  )
}
