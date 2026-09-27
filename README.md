# TestForge — AI-Powered API Testing Platform

> **A full-stack API testing platform where LLMs generate structured test cases and analyze failures, while a deterministic execution and assertion engine guarantees reliable, verifiable test results.**

---

## ⚡ Architecture Overview

TestForge separates **deterministic truth** from **probabilistic AI reasoning**:

```text
                           ┌──────────────────────────┐
                           │   Next.js 15 Frontend    │
                           │ (React, Tailwind, Lucide)│
                           └────────────┬─────────────┘
                                        │
                                   REST API
                                        │
                           ┌────────────▼─────────────┐
                           │     Fastify Backend      │
                           │  (TypeScript, Node.js)   │
                           └────────────┬─────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
 ┌──────────────┐               ┌───────────────┐               ┌───────────────┐
 │ Test & Suite │               │ Deterministic │               │   AI Layer    │
 │  Management  │               │ Runner Engine │               │  (Groq / LLM) │
 └──────┬───────┘               └───────┬───────┘               └───────┬───────┘
        │                               │                               │
        │                               ▼                               │
        │                      ┌─────────────────┐                      │
        │                      │Assertion Engine │                      │
        │                      │(Status, Latency,│                      │
        │                      │ Body Contains)  │                      │
        │                      └────────┬────────┘                      │
        │                               │                               │
        │                       ┌───────┴───────┐                       │
        │                       ▼               ▼                       │
        │                     PASS             FAIL                     │
        │                      │                │                       │
        │                      │                ▼                       │
        │                      │         Secret Redactor                │
        │                      │                │                       │
        │                      │                ▼                       │
        │                      │       AI Failure Analyzer ◄────────────┤
        │                      │       (Root-cause hypothesis,          │
        │                      │        evidence, suggested fixes)      │
        │                      │                │                       │
        │                      ▼                ▼                       │
        └──────────────────────►  PostgreSQL  ◄─────────────────────────┘
                                 (Prisma ORM)
```

---

## 🌟 Core Features

### 1. AI Test Generation (Human-in-the-Loop)
- Converts plain-English API requirements into structured, executable test cases.
- Generates positive happy paths, negative tests (missing fields, invalid inputs), authentication checks, and edge cases.
- Strict Zod validation guarantees schema conformity before rendering.
- **Human-in-the-loop review**: select specific tests or save all tests directly to persistent project suites.

### 2. Deterministic Test Execution & Assertion Engine
- **Source of Truth**: The test runner never asks AI whether a test passed.
- Executes HTTP requests (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) with custom headers and bodies.
- Deterministic assertions:
  - `status`: HTTP status code verification.
  - `response_time`: Latency threshold checks in milliseconds.
  - `body_contains`: Substring / property presence verification.

### 3. AI-Assisted Root Cause Analysis & Debugging
- Triggered exclusively on **FAILED** test runs.
- Constructs an authoritative context of facts (actual status, latency, response body, failed assertion messages).
- **Secret Redaction Layer**: Automatically redacts sensitive tokens (`Authorization`, `Cookie`, `X-Api-Key`) before LLM ingestion.
- Returns grounded root-cause explanations, concrete evidence, actionable suggestions, and confidence ratings (`low`, `medium`, `high`).

### 4. Real-Time Dashboard Metrics & Systemic AI Insights
- **Deterministic Analytics**: Computes real-time test count, total executions, pass rate (`%`), and failure counts via SQL aggregations.
- **Aggregate AI Failure Insights**: Evaluates recent test failures across suites to identify recurring patterns (e.g. widespread authentication rejections, contract mismatches, or latency regressions).

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, TypeScript
- **Backend**: Fastify, TypeScript, Node.js (`tsx`)
- **Database & ORM**: PostgreSQL, Prisma 6
- **AI & Validation**: Groq SDK (`openai/gpt-oss-120b` / `llama-3.3-70b-versatile`), Zod

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running locally
- Groq API Key

### Backend Setup
```bash
cd backend
npm install

# Configure environment variables in backend/.env
# DATABASE_URL="postgresql://user:password@localhost:5432/testforge"
# GROQ_API_KEY="gsk_..."

# Run migrations
npx prisma migrate dev

# Start development server (runs on http://localhost:4000)
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

---

## 📋 API Endpoints

### Test Suites & Cases
- `GET /api/projects`: List all test projects.
- `POST /api/projects`: Create a new project.
- `GET /api/projects/:projectId/stats`: Get deterministic execution metrics (tests, runs, pass rate, failures).
- `POST /api/projects/:projectId/insights`: Aggregate AI analysis of recurring failure patterns.
- `GET /api/projects/:projectId/test-cases`: List test cases for a project.
- `POST /api/test-cases`: Create and persist a new test case.

### Test Execution & Runner
- `POST /api/test-cases/:testCaseId/run`: Execute test case, run assertion engine, and record run history.
- `GET /api/test-cases/:testCaseId/runs`: Fetch execution history for a test case.

### AI Engine
- `POST /api/ai/generate-tests`: Generate structured test cases from natural language.
- `POST /api/ai/analyze-failure`: Analyze raw failure context.
- `POST /api/test-runs/:runId/analyze`: Grounded AI root-cause analysis for a failed test run.

---

## 💼 Resume & Interview Talking Points

> **TestForge — AI-Powered API Testing Platform**
> Built a full-stack API testing platform that uses LLMs to generate structured API test cases from natural-language requirements and analyze failed test runs using request, response, and assertion evidence. Implemented deterministic API execution, assertion validation, PostgreSQL-based test/run history, human-in-the-loop test review, structured LLM outputs with runtime validation, and secret redaction.

- **System Design & Separation of Concerns**: Engineered a deterministic test execution and assertion engine to ensure reliable, reproducible PASS/FAIL verdicts while utilizing probabilistic LLMs strictly for test generation and root-cause explanation.
- **LLM Engineering & Reliability**: Implemented structured output generation with runtime Zod validation, low-temperature inference for consistent reasoning, and zero-shot grounded failure analysis.
- **Security & Data Minimization**: Designed a header redaction layer to strip authorization credentials and API tokens prior to sending diagnostic context to external AI providers.
- **Full-Stack Execution**: Developed a responsive Next.js 15 UI paired with a high-throughput Fastify backend and PostgreSQL/Prisma relational schema tracking projects, test suites, execution runs, and assertion results.
