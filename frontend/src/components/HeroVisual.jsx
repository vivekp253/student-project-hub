import { Icon } from './Icons'

const orbitItems = [
  { label: 'Research', icon: 'paper', position: 'left-0 top-10', color: 'blue' },
  { label: 'Source code', icon: 'code', position: 'right-0 top-24', color: 'violet' },
  { label: 'Results', icon: 'chart', position: 'left-8 bottom-16', color: 'violet' },
  { label: 'Students', icon: 'users', position: 'right-8 bottom-5', color: 'blue' },
]

export function HeroVisual() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[530px] lg:h-[500px]" aria-label="Project documentation illustration" role="img">
      <div className="absolute inset-8 rounded-[2.5rem] bg-blue-100/70 blur-3xl" />
      <div className="absolute inset-8 rotate-3 rounded-[2.5rem] border border-blue-100 bg-white/75 shadow-2xl shadow-blue-200/50 backdrop-blur-sm" />
      <div className="absolute inset-x-12 top-16 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-200/60 sm:inset-x-20">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Project workspace</span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">APPROVED</span>
        </div>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-blue-600">AI / Machine Learning</p>
            <h3 className="font-display text-xl font-bold text-slate-900">Dengue Prediction</h3>
            <p className="mt-1 text-xs text-slate-400">CBC data classification model</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon name="brain" size={23} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-y border-slate-100 py-4">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Files</p><p className="mt-1 font-display text-lg font-bold text-slate-800">18</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sections</p><p className="mt-1 font-display text-lg font-bold text-slate-800">09</p></div>
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Views</p><p className="mt-1 font-display text-lg font-bold text-slate-800">2.4k</p></div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['bg-blue-300', 'bg-violet-300', 'bg-amber-300'].map((color) => <span className={`h-7 w-7 rounded-full border-2 border-white ${color}`} key={color} />)}
          </div>
          <span className="text-xs font-semibold text-slate-400">Team project · 2025</span>
        </div>
      </div>
      {orbitItems.map((item) => (
        <div className={`absolute ${item.position} flex items-center gap-2 rounded-xl border border-white bg-white px-3 py-2.5 shadow-lg shadow-slate-200/70`} key={item.label}>
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'}`}><Icon name={item.icon} size={16} /></span>
          <span className="text-xs font-bold text-slate-700">{item.label}</span>
        </div>
      ))}
      <div className="absolute bottom-24 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-300/60">
        <Icon name="book" size={26} strokeWidth={1.5} />
      </div>
    </div>
  )
}
