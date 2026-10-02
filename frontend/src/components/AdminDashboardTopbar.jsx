import { Icon } from './Icons'

function getInitials(name) {
  if (!name?.trim()) return 'A'

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function AdminDashboardTopbar({
  admin = {},
  onMenuClick,
  onSearchChange,
  searchQuery,
}) {
  const adminName = admin.full_name?.trim() || 'Administrator'

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-[76px] items-center gap-3 px-4 sm:px-8">
        <button
          aria-label="Open admin navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <Icon name="menu" size={21} />
        </button>

        <label className="relative min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">Search submissions</span>
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            name="search"
            size={18}
          />
          <input
            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search submissions"
            type="search"
            value={searchQuery}
          />
        </label>

        <div className="ml-auto flex min-w-0 items-center gap-2.5 border-l border-slate-200 pl-3 sm:pl-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {getInitials(admin.full_name)}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-bold text-slate-800">
              {adminName}
            </span>
            <span className="block truncate text-xs text-slate-400">Administrator</span>
          </span>
        </div>
      </div>
    </header>
  )
}
