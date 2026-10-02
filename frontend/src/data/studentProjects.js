const unavailable = 'Not available yet'

export const studentProjects = [
  {
    id: 'dengue-prediction',
    title: 'Dengue Prediction',
    icon: 'brain',
    iconStyle: 'bg-sky-50 text-sky-600',
    category: 'AI / Machine Learning',
    description:
      'A classification model that explores blood count data to support early dengue prediction.',
    overview:
      'A classification model that explores blood count data to support early dengue prediction.',
    abstract: unavailable,
    technologies: unavailable,
    objectives: unavailable,
    implementationDetails: unavailable,
    researchPaper: unavailable,
    sourceCode: unavailable,
  },
  {
    id: 'mental-health-detection',
    title: 'Mental Health Detection',
    icon: 'users',
    iconStyle: 'bg-emerald-50 text-emerald-600',
    category: 'Data Science',
    description:
      'A data-driven study for identifying patterns in student mental health.',
    overview:
      'A data-driven study for identifying patterns in student mental health.',
    abstract: unavailable,
    technologies: unavailable,
    objectives: unavailable,
    implementationDetails: unavailable,
    researchPaper: unavailable,
    sourceCode: unavailable,
  },
  {
    id: 'diabetic-retinopathy',
    title: 'Diabetic Retinopathy',
    icon: 'search',
    iconStyle: 'bg-blue-50 text-blue-600',
    category: 'Computer Vision',
    description:
      'An image analysis project that helps identify signs of diabetic retinopathy.',
    overview:
      'An image analysis project that helps identify signs of diabetic retinopathy.',
    abstract: unavailable,
    technologies: unavailable,
    objectives: unavailable,
    implementationDetails: unavailable,
    researchPaper: unavailable,
    sourceCode: unavailable,
  },
  {
    id: 'college-bus-registration-system',
    title: 'College Bus Registration System',
    icon: 'mobile',
    iconStyle: 'bg-amber-50 text-amber-700',
    category: unavailable,
    description: unavailable,
    overview: unavailable,
    abstract: unavailable,
    technologies: unavailable,
    objectives: unavailable,
    implementationDetails: unavailable,
    researchPaper: unavailable,
    sourceCode: unavailable,
  },
]

export function getStudentProject(projectId) {
  return studentProjects.find((project) => project.id === projectId) ?? null
}