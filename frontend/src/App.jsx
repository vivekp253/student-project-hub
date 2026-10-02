import { HeroVisual } from './components/HeroVisual'
import { ArrowLink, SectionHeading } from './components/SectionHeading'
import { BrandMark, Icon } from './components/Icons'
import { Navbar } from './components/Navbar'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import ProjectDetails from './pages/ProjectDetails'
import MyProjects from './pages/MyProjects'
import UploadProject from './pages/UploadProject'

// Local UI data is intentionally shaped like future API responses.
const features = [
  { icon: 'search', title: 'Explore Projects', description: 'Discover projects created by students across different domains.', color: 'blue' },
  { icon: 'book', title: 'Learn From Seniors', description: 'Understand how real projects were planned, developed and documented.', color: 'violet' },
  { icon: 'upload', title: 'Share Your Work', description: 'Upload your complete project and help future students.', color: 'sky' },
  { icon: 'spark', title: 'Build a Better Future', description: 'Turn previous project experience into knowledge for the next generation.', color: 'indigo' },
]

const steps = [
  { number: '01', icon: 'upload', title: 'Upload', description: 'Students document and upload their complete project.' },
  { number: '02', icon: 'paper', title: 'Review', description: 'The project is reviewed by an administrator.' },
  { number: '03', icon: 'check', title: 'Approve', description: 'Approved projects become available in the Project Hub.' },
  { number: '04', icon: 'book', title: 'Learn', description: 'Future students can explore the complete project journey.' },
]

const categories = [
  { icon: 'brain', title: 'AI / Machine Learning', projects: '24 projects', color: 'blue' },
  { icon: 'code', title: 'Web Development', projects: '38 projects', color: 'violet' },
  { icon: 'mobile', title: 'Mobile Applications', projects: '16 projects', color: 'sky' },
  { icon: 'chart', title: 'Data Science', projects: '21 projects', color: 'indigo' },
  { icon: 'shield', title: 'Blockchain', projects: '09 projects', color: 'purple' },
  { icon: 'grid', title: 'IoT', projects: '13 projects', color: 'cyan' },
  { icon: 'shield', title: 'Cyber Security', projects: '11 projects', color: 'blue' },
  { icon: 'cloud', title: 'Cloud Computing', projects: '17 projects', color: 'violet' },
]

// Replace these demonstration records with approved project data from the backend later.
const featuredProjects = [
  { title: 'Dengue Prediction Using CBC Data', category: 'AI / Machine Learning', description: 'A classification model that explores blood count data to support early dengue prediction.', icon: 'brain', accent: 'blue' },
  { title: 'Mental Health Detection', category: 'Data Science', description: 'A thoughtful data-driven study for identifying patterns in student mental health.', icon: 'users', accent: 'violet' },
  { title: 'Diabetic Retinopathy Detection', category: 'Computer Vision', description: 'An image analysis project that helps identify signs of diabetic retinopathy.', icon: 'search', accent: 'sky' },
]

function Button({ children, href = '#projects', secondary = false }) {
  return (
    <a className={`group inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${secondary ? 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700' : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl'}`} href={href}>
      {children}
      <Icon className="transition-transform duration-200 group-hover:translate-x-1" name="arrow" size={17} />
    </a>
  )
}

function HomePage() {
  return (
    <div className="overflow-hidden bg-white text-slate-900">
      <Navbar />

      <main>
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50/70" id="home">
          <div className="absolute -left-24 top-36 -z-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute right-0 top-0 -z-10 h-96 w-96 rounded-full bg-violet-200/25 blur-3xl" />
          <div className="mx-auto grid min-h-[720px] max-w-7xl items-center gap-8 px-5 pb-16 pt-32 sm:px-8 lg:grid-cols-[1.03fr_0.97fr] lg:px-10 lg:pb-20 lg:pt-36">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-2 text-xs font-bold text-blue-700 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> A growing library of student knowledge
              </div>
              <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[4.65rem]">Your Project.<br /><span className="text-blue-600">Your Legacy.</span><br />Their Future.</h1>
              <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">Explore real academic projects, understand how they were built, and learn from the experience of students who came before you.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button>Explore Projects</Button>
                <Button href="#share" secondary>Share Your Project</Button>
              </div>
              <div className="mt-12 flex items-center gap-4 border-t border-slate-200/80 pt-6">
                <div className="flex -space-x-2">
                  {['bg-blue-300', 'bg-violet-300', 'bg-amber-300', 'bg-emerald-300'].map((color) => <span className={`h-8 w-8 rounded-full border-2 border-white ${color}`} key={color} />)}
                </div>
                <p className="text-xs font-semibold leading-5 text-slate-500"><span className="font-bold text-slate-800">Built for curious students</span><br />Learn from work that came before.</p>
              </div>
            </div>
            <HeroVisual />
          </div>
        </section>

        <section className="border-y border-slate-100 bg-white" id="about">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-10 lg:py-28">
            <SectionHeading eyebrow="The ProjectHub idea" title="One Place for Complete Student Projects" description="A project is more than its final demo. ProjectHub brings every important detail into one organized, searchable learning resource." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {['Research papers', 'Problem statements', 'Datasets', 'Methodology', 'Frontend', 'Backend', 'Database', 'Results', 'Source code', 'Demo', 'Team contributions', 'Documentation'].map((item, index) => (
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3.5 text-xs font-bold text-slate-600 sm:px-4" key={item}>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${index % 3 === 0 ? 'bg-blue-500' : index % 3 === 1 ? 'bg-violet-500' : 'bg-sky-400'}`} />{item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50/70" id="features">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
            <SectionHeading centered eyebrow="Why ProjectHub" title="Knowledge worth passing on" description="Whether you are searching for inspiration or sharing your own journey, ProjectHub makes academic work easier to understand and build upon." />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50" key={feature.title}>
                  <div className={`mb-8 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color === 'violet' || feature.color === 'indigo' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'} transition-transform duration-300 group-hover:scale-110`}><Icon name={feature.icon} size={23} /></div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{feature.description}</p>
                  <ArrowLink>Learn more</ArrowLink>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
            <SectionHeading centered eyebrow="Simple by design" title="How ProjectHub Works" />
            <div className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-5">
              <div className="absolute left-[12%] right-[12%] top-7 hidden border-t border-dashed border-blue-200 md:block" />
              {steps.map((step) => (
                <article className="relative text-center" key={step.number}>
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-blue-600 text-white shadow-lg shadow-blue-200"><Icon name={step.icon} size={21} /></div>
                  <p className="mt-6 text-xs font-bold tracking-[0.2em] text-blue-600">{step.number}</p>
                  <h3 className="mt-2 font-display text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-[190px] text-sm leading-6 text-slate-500">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50/70" id="domains">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeading eyebrow="Browse by interest" title="Explore Project Domains" />
              <ArrowLink>View all domains</ArrowLink>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
              {categories.map((category) => (
                <a className="group flex min-h-32 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg" href="#projects" key={category.title}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${category.color === 'violet' || category.color === 'purple' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'}`}><Icon name={category.icon} size={20} /></div>
                  <div className="mt-5 flex items-end justify-between gap-2"><div><h3 className="text-sm font-bold text-slate-800">{category.title}</h3><p className="mt-1 text-xs text-slate-400">{category.projects}</p></div><Icon className="text-slate-300 transition-colors group-hover:text-blue-500" name="chevron" size={17} /></div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white" id="projects">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <SectionHeading eyebrow="From the community" title="Featured Projects" description="A glimpse into the kind of complete project journeys you can discover on ProjectHub." />
              <ArrowLink>Explore all projects</ArrowLink>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70" key={project.title}>
                  <div className={`relative flex h-44 items-center justify-center overflow-hidden ${project.accent === 'violet' ? 'bg-violet-100' : project.accent === 'sky' ? 'bg-sky-100' : 'bg-blue-100'}`}>
                    <div className="absolute h-40 w-40 rounded-full border border-white/70" /><div className="absolute h-28 w-28 rounded-full border border-white/70" />
                    <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white ${project.accent === 'violet' ? 'text-violet-600' : 'text-blue-600'} shadow-xl`}><Icon name={project.icon} size={29} /></div>
                    <span className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">Featured</span>
                  </div>
                  <div className="p-6"><p className="text-xs font-bold uppercase tracking-wider text-blue-600">{project.category}</p><h3 className="mt-3 font-display text-xl font-bold text-slate-900">{project.title}</h3><p className="mt-3 text-sm leading-7 text-slate-500">{project.description}</p><a className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-slate-800 transition-colors group-hover:text-blue-600" href="#project-view">View Project <Icon name="arrow" size={16} /></a></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28" id="share">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-16 text-center sm:px-12 lg:px-24">
            <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" /><div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl" />
            <div className="relative mx-auto max-w-2xl"><p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-blue-300">Leave a useful trail</p><h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Have a Project? Share Your Knowledge.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-300">Document your project once and help hundreds of students understand how real projects are built.</p><a className="mt-8 inline-flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-blue-50" href="#upload">Upload Your Project <Icon name="arrow" size={17} /></a></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white" id="contact">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr] lg:px-10">
          <div><a className="flex items-center gap-3" href="#home"><BrandMark /><span className="font-display text-xl font-bold tracking-tight text-slate-950">Project<span className="text-blue-600">Hub</span></span></a><p className="mt-5 max-w-xs text-sm leading-7 text-slate-500">Your Project. Your Legacy. Their Future.</p></div>
          <div><h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Explore</h3><div className="mt-5 grid gap-3 text-sm font-semibold text-slate-600"><a className="hover:text-blue-600" href="#home">Home</a><a className="hover:text-blue-600" href="#projects">Projects</a><a className="hover:text-blue-600" href="#about">About</a></div></div>
          <div><h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Connect</h3><div className="mt-5 grid gap-3 text-sm font-semibold text-slate-600"><a className="hover:text-blue-600" href="#contact">Contact</a><a className="hover:text-blue-600" href="#privacy">Privacy Policy</a><span className="flex items-center gap-2 text-slate-400"><Icon name="mail" size={16} /> hello@projecthub.edu</span></div></div>
        </div>
        <div className="border-t border-slate-100"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><span>© 2025 ProjectHub. Built for the next generation.</span><span>Academic knowledge, made shareable.</span></div></div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<Register />} path="/register" />
      <Route element={<StudentDashboard />} path="/student/dashboard" />
      <Route element={<MyProjects />} path="/student/projects" />
      <Route element={<UploadProject />} path="/student/projects/upload" />
      <Route element={<ProjectDetails />} path="/projects/:projectId" />
    </Routes>
  )
}

export default App
