import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark, Icon } from './Icons'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Projects', href: '#projects' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <a className="flex items-center gap-3" href="#home" aria-label="ProjectHub home">
          <BrandMark />
          <span className="font-display text-xl font-bold tracking-tight text-slate-950">Project<span className="text-blue-600">Hub</span></span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary navigation">
          {links.map((link, index) => (
            <a className={`text-sm font-semibold transition-colors hover:text-blue-600 ${index === 0 ? 'text-blue-600' : 'text-slate-600'}`} href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link className="px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:text-blue-600" to="/login">Login</Link>
          <Link className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700" to="/register">Register</Link>
        </div>

        <button
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-2 text-slate-700 transition-colors hover:bg-white hover:text-blue-600 sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          type="button"
        >
          <Icon name={menuOpen ? 'chevron' : 'menu'} size={23} />
        </button>
      </div>

      {menuOpen && (
        <nav className="mx-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:hidden" aria-label="Mobile navigation">
          {links.map((link) => (
            <a className="block rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600" href={link.href} key={link.label} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3">
            <Link className="flex-1 rounded-lg px-3 py-2.5 text-center text-sm font-bold text-slate-700" to="/login">Login</Link>
            <Link className="flex-1 rounded-lg bg-slate-950 px-3 py-2.5 text-center text-sm font-bold text-white" to="/register">Register</Link>
          </div>
        </nav>
      )}
    </header>
  )
}
