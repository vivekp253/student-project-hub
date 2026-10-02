export function SectionHeading({ eyebrow, title, description, centered = false }) {
  return (
    <div className={centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-blue-600">{eyebrow}</p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem]">{title}</h2>
      {description && <p className="mt-5 text-base leading-8 text-slate-500">{description}</p>}
    </div>
  )
}

export function ArrowLink({ children }) {
  return (
    <a className="group inline-flex items-center gap-2 text-sm font-bold text-blue-700" href="#projects">
      {children}
      <span className="transition-transform duration-200 group-hover:translate-x-1">-&gt;</span>
    </a>
  )
}
