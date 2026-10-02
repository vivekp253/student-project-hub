# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


 # Student Project Hub

Student Project Hub is a secure full-stack academic project repository where students can publish complete project documentation and future students can discover, study, and learn from approved work. The platform supports the full project lifecycle, from student registration and project submission to administrative review and authenticated project access.

## Project Overview

Academic projects often contain valuable research, implementation details, datasets, methodologies, and results, but this knowledge is frequently scattered across personal drives, repositories, reports, and presentations. Student Project Hub brings these materials together in a structured platform.

Students can create project profiles with comprehensive technical and research documentation. Administrators can review submissions and approve, reject, or request changes before projects become available to authenticated users. The system is designed to support future integration with machine learning projects, including the Dengue Prediction ML project.

## Problem Statement

Students and academic teams need a reliable way to preserve and share complete project knowledge. Existing storage methods do not consistently provide:

- Structured documentation for academic and technical projects
- Secure authentication and controlled access
- A review and approval process for submitted work
- Searchable project categories and metadata
- A single location for research papers, datasets, diagrams, screenshots, and links
- Clear records of team members and individual contributions

Without such a platform, useful project knowledge can be difficult to find, difficult to verify, and easily lost when students graduate.

## Main Objective

To develop a secure, searchable, and review-driven platform that enables students to upload, document, manage, and share complete academic projects while helping future students learn from approved project work.

## Key Features

- Student registration and login
- Secure authentication and authorization
- Student dashboard for managing submissions and profile activity
- Project creation, editing, and file upload
- Complete project documentation, including abstracts, objectives, scope, and outcomes
- Research paper upload
- Dataset description and methodology documentation
- Frontend and backend implementation documentation
- System architecture diagrams
- Results, screenshots, and evaluation details
- Demo and GitHub repository links
- Team member and contribution details
- Project categories, tags, and search
- Secure viewing of approved projects for authenticated users
- Ownership-based editing, allowing students to edit only their own projects
- Administrative review with approve, reject, and request-changes actions
- Project status tracking throughout the review workflow
- Extensible design for future machine learning project integration

## User Roles

### Student

- Register and authenticate securely
- Create and manage academic project submissions
- Upload supporting documents and media
- Add team member and contribution information
- Submit projects for administrative review
- Edit or update only projects they own
- View the status and feedback of their submissions
- Browse and learn from approved projects

### Administrator

- Access an administrative dashboard
- Review submitted projects and supporting materials
- Approve projects for publication
- Reject projects that do not meet requirements
- Request changes and provide review feedback
- Manage project categories and moderation status
- Monitor platform content and user activity

### Authenticated Viewer

- Search and filter approved projects
- View complete project documentation
- Access permitted files, diagrams, results, and links
- Use published projects as academic learning resources

## Project Workflow

1. A student creates an account and signs in.
2. The student creates a project entry and adds its academic and technical details.
3. The student uploads documentation, research papers, datasets, diagrams, screenshots, and other permitted files.
4. The student adds team members, contribution details, categories, and external links.
5. The project is submitted for administrative review.
6. An administrator reviews the project and chooses one of the following actions:
	- **Approve:** The project becomes available to authenticated viewers.
	- **Request changes:** The student receives feedback and can update the project.
	- **Reject:** The project is not published and the decision is recorded.
7. Approved projects can be searched, viewed, and used as learning resources.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | PostgreSQL |
| Authentication | Token-based authentication with role-based authorization |
| File and media handling | Backend-managed validation and storage integration |
| Machine learning | Python-based ML services and future Dengue Prediction integration |
| Development | Git and GitHub |

## Planned Folder Structure

The following structure is planned for the application as development progresses:

```text
student-project-hub/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── services/
│       ├── hooks/
│       ├── context/
│       └── assets/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   └── tests/
├── ml/
│   ├── models/
│   ├── notebooks/
│   ├── datasets/
│   └── services/
├── docs/
│   ├── architecture/
│   ├── api/
│   └── deployment/
├── README.md
└── .gitignore
```

## Security Considerations

Security is a core requirement because the platform handles student accounts, uploaded academic materials, and potentially sensitive datasets.

- Hash passwords using a modern, secure password-hashing algorithm; never store plain-text passwords.
- Use secure token-based authentication with expiration and refresh policies where appropriate.
- Enforce role-based authorization for student, administrator, and viewer actions.
- Verify project ownership on every update and delete operation.
- Validate file type, file size, file name, and content before accepting uploads.
- Store uploaded files outside executable application paths and serve them through authorized endpoints.
- Protect against SQL injection by using parameterized queries or the ORM/database layer correctly.
- Apply input validation and output encoding to reduce injection and cross-site scripting risks.
- Use HTTPS in deployed environments and protect secrets through environment variables or a secrets manager.
- Configure CORS narrowly for trusted frontend origins.
- Apply rate limiting and account protections to authentication endpoints.
- Record administrative review actions and important security events for auditing.
- Restrict dataset access when submitted materials contain personal, confidential, or restricted information.
- Keep dependencies, database software, and deployment infrastructure updated.
- Back up the database and uploaded content using a tested recovery process.

## Future Scope

- Integration with the Dengue Prediction ML project through dedicated APIs or services
- ML project metadata, model versioning, metrics, and experiment tracking
- Preview support for common documents, images, diagrams, and presentation files
- Advanced search using full-text indexing, tags, departments, technologies, and academic year
- Similar-project recommendations for students and researchers
- Notifications for review feedback, approvals, and requested changes
- Institution, department, and course-level access controls
- Plagiarism and duplicate-content detection workflows
- Version history for project documentation and uploaded files
- Analytics for project engagement and learning-resource usage
- Cloud object storage and scalable deployment
- Automated testing, CI/CD, monitoring, and security scanning

## Project Status

Student Project Hub is currently in the planning and development stage. The repository is being organized to support the frontend, backend, documentation, and future machine learning components described above.
