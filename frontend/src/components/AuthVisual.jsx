import { BrandMark, Icon } from './Icons'

const libraryStats = [
  { value: '120+', label: 'Projects' },
  { value: '08', label: 'Domains' },
  { value: '2.4k', label: 'Learners' },
]

export function AuthVisual() {
  return (
    <aside className="relative order-2 min-h-[250px] overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-100 px-6 py-8 sm:px-10 lg:min-h-screen lg:px-12 lg:py-12 xl:px-16">
      <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-blue-200/60 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-violet-200/60 blur-3xl" />

      <div className="relative z-10 flex items-center gap-3">
        <BrandMark />
        <span className="font-display text-xl font-bold tracking-tight text-slate-950">Project<span className="text-blue-600">Hub</span></span>
      </div>

      <div className="relative z-10 mx-auto flex max-w-xl flex-col justify-center py-10 lg:min-h-[calc(100vh-150px)] lg:py-0">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-blue-600">A library for what comes next</p>
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl xl:text-5xl">Learn from projects.<br /><span className="text-blue-600">Build your future.</span></h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-slate-600 sm:text-base">Explore real academic work, understand how it was built, and carry those lessons into your next idea.</p>

        <div className="mt-8 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-xl shadow-blue-100/60 backdrop-blur-sm sm:mt-10 sm:p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Your learning library</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon name="book" size={18} /></span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {libraryStats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex">
          <Icon className="text-emerald-500" name="shield" size={15} /> Secure academic knowledge, built together.
        </div>
      </div>
    </aside>
  )
}
