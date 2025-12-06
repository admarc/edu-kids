# EduKids

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

## Table of Contents
1. [Description](#description)  
2. [Tech Stack](#tech-stack)  
3. [Getting Started](#getting-started)  
4. [Available Scripts](#available-scripts)  
5. [Project Scope](#project-scope)  
6. [Project Status](#project-status)  
7. [License](#license)  

## Description
EduKids is a web platform for teachers and parents to generate themed, AI-supported question sets tailored by a child’s age and chosen topic. Users can:
- Register and log in with email/password  
- Generate up to 10 questions per session  
- Accept, reject, or edit each proposed question  
- Store accepted questions in a database with filtering by age and topic  

## Tech Stack
- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui  
- **Backend & Database:** Supabase (PostgreSQL, SDK, authentication)  
- **AI Integration:** Openrouter.ai (multi-model support, cost-control)  
- **Testing:** Vitest (unit & integration tests), Playwright (E2E tests)  
- **CI/CD & Hosting:** GitHub Actions, Docker on DigitalOcean  

## Getting Started
### Prerequisites
- Node.js v22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) via `.nvmrc`)  
- A Supabase project (URL & anon key)  
- An Openrouter.ai API key  

### Setup
```bash
# Clone the repository
git clone https://github.com/adnarc/edu-kids.git
cd edu-kids

# Switch to Node version
nvm use

# Install dependencies
npm install
```

### Configuration
Create a `.env` file in the project root with the following variables:
```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
OPENROUTER_API_KEY=<your-openrouter-api-key>
```

### Run Locally
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

## Available Scripts
- `npm run dev`  
  Starts the development server with live reload.  
- `npm run build`  
  Builds the production-ready site to `dist/`.  
- `npm run preview`  
  Preview the production build locally.  
- `npm run astro`  
  Run the Astro CLI.  
- `npm run test`  
  Run unit and integration tests with Vitest.  
- `npm run test:ui`  
  Run tests with Vitest UI.  
- `npm run test:e2e`  
  Run end-to-end tests with Playwright.  
- `npm run lint`  
  Run ESLint to analyze code for issues.  
- `npm run lint:fix`  
  Run ESLint and automatically fix problems.  
- `npm run format`  
  Format code with Prettier.  

## Project Scope
### MVP Features
- User registration, login, password change, and account deletion  
- Generate question sets (max 10) by age & topic  
- Accept, reject, and edit AI-generated questions  
- Store and review accepted questions with filtering  
- CRUD operations for topics  
- Error handling for AI/API calls with retry  

### Out of Scope
- Task sharing between users  
- Mobile applications  
- Automated difficulty rating  
- Advanced caching strategies  
- Detailed analytics beyond accept/reject counts  
- Privacy policy and GDPR compliance  

## Project Status
🚧 **In Development (MVP)**  
Key user flows and core features are being implemented. Contributions and feedback are welcome!

## License
This project is licensed under the **MIT License**.  