# Product Requirements Document
## Student Management ERP

| Field | Value |
|---|---|
| **Document version** | 1.0 |
| **Status** | Draft — for review |
| **Last updated** | 2026-07-10 |
| **Owner** | Product |
| **Companion doc** | [ERP_SYSTEM_OVERVIEW.md](ERP_SYSTEM_OVERVIEW.md) — read that first for architecture and module linkage |

> **How to use this document.** This is the structural reference for the project. It defines *what* we are building, *for whom*, *in what order*, and *how we will know it works*. It does not prescribe implementation detail — that belongs in the system overview and in the code. Every ticket should trace back to a requirement ID here (`FR-###` / `NFR-###`).

---

## Table of Contents

1. [Problem & Opportunity](#1-problem--opportunity)
2. [Goals, Non-Goals & Success Metrics](#2-goals-non-goals--success-metrics)
3. [Users & Personas](#3-users--personas)
4. [Scope by Release](#4-scope-by-release)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Model Reference](#7-data-model-reference)
8. [API Conventions](#8-api-conventions)
9. [Project Structure](#9-project-structure)
10. [Permissions Matrix](#10-permissions-matrix)
11. [Integrations](#11-integrations)
12. [Analytics & Instrumentation](#12-analytics--instrumentation)
13. [Rollout Plan](#13-rollout-plan)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Open Questions](#15-open-questions)
16. [Appendix: Glossary](#16-appendix-glossary)

---

## 1. Problem & Opportunity

### 1.1 The problem

Educational institutions of 200–5,000 students run their operations on a patchwork of disconnected tools. The typical institution today uses:

- Spreadsheets for admissions and student lists
- Paper registers or a separate app for attendance
- Desktop accounting software (Tally, QuickBooks) for fees, disconnected from everything
- More spreadsheets for exam marks
- WhatsApp groups for parent communication

This produces four concrete, expensive failures:

| Failure | What it costs |
|---|---|
| **Data is entered 3–5 times** | A single student's name is typed into admissions, attendance, fees, and exams. Staff spend an estimated 30–40% of administrative hours on re-entry. |
| **No single source of truth** | A parent asks about dues. Three staff give three answers. Trust erodes. |
| **Reconciliation is manual and late** | Month-end close takes 5–10 days. Fee collection leakage (fines never billed, discounts never recorded) goes undetected. |
| **Compliance is fragile** | Transcripts are reconstructed from spreadsheets. Audit trails do not exist. A disputed grade cannot be defended. |

### 1.2 The opportunity

A single integrated system where **data is entered once and flows everywhere** eliminates all four failures simultaneously. This is not a novel insight — large institutions have had ERPs for decades. The opportunity is that existing ERPs are either:

- **Enterprise** (SAP, Oracle, Ellucian): six-figure implementations, 12-month rollouts, unusable UI.
- **Legacy SME** (dozens of regional vendors): desktop-era software, no mobile, no API, no audit trail.
- **Point solutions** (an attendance app, a fee app): solve one problem, recreate the integration problem.

There is a gap for a **modern, mobile-first, properly-integrated ERP** priced and scoped for the 200–5,000 student institution.

### 1.3 Why now

- Payment gateways and UPI/e-wallet rails have made online fee collection normal, not exotic.
- Parents expect a portal and a mobile app; post-2020 this became table stakes.
- Cloud hosting has made per-institution deployment economics work at this scale.

---

## 2. Goals, Non-Goals & Success Metrics

### 2.1 Goals

| ID | Goal |
|---|---|
| **G1** | **One record per student, one bill per parent.** Eliminate duplicate data entry entirely. |
| **G2** | **Close the books in one day, not ten.** Every financial event posts automatically to a double-entry ledger. |
| **G3** | **Teachers do their admin from a phone in under two minutes a day.** Attendance and marks entry must be faster than paper, or staff will not adopt it. |
| **G4** | **Parents self-serve.** Fees, attendance, and results visible without calling the office. |
| **G5** | **Every grade and every rupiah is auditable.** Immutable history with who/what/when. |

### 2.2 Non-goals (explicitly out of scope for v1)

Stating these prevents scope creep. Each may be revisited later.

| Not building | Why not |
|---|---|
| Learning Management System (assignments, course content, quizzes) | A different product with a different buyer. Integrate with Google Classroom / Moodle instead. |
| Video conferencing | Solved. Link out to Zoom/Meet. |
| Alumni fundraising & CRM | Distinct workflow, distinct user. Post-v2. |
| Multi-institution / franchise consolidation reporting | Architect for it (`tenant_id` from day one), but do not build the reporting. |
| Government compliance reporting (country-specific filings) | Enormous surface area, varies per jurisdiction. Provide data export instead. |
| Biometric hardware integration | Provide a webhook API; do not ship drivers. |
| Native iOS/Android admin app | Responsive web covers admin. Native mobile is parent/student only, and it's v2. |

### 2.3 Success metrics

| Metric | Baseline (paper/spreadsheets) | Target (6 months post-launch) |
|---|---|---|
| Time to mark attendance for one section | ~5 min (paper + later transcription) | **< 45 seconds** |
| Time to generate all term invoices | 3–5 days | **< 5 minutes** (automated) |
| Month-end close | 5–10 days | **≤ 1 day** |
| Fee collection rate at term start + 30 days | ~70% | **≥ 90%** |
| Parent queries to front office per week | ~120 | **≤ 30** |
| Daily active teachers (of total teachers) | n/a | **≥ 85%** |
| Time to produce a duplicate transcript | 2–3 days | **< 2 minutes** |
| Data-entry duplication | 3–5× per student | **1×** |

### 2.4 The adoption risk, stated plainly

The most likely way this project fails is not technical. It is that **teachers refuse to use it** because marking attendance on the phone takes longer than a paper register.

Every design decision in the teacher-facing flows must be measured against paper. If it is slower than paper, it is broken, regardless of how many features it has.

---

## 3. Users & Personas

### 3.1 Persona summary

| Persona | Volume | Primary device | Frequency | What they need |
|---|---|---|---|---|
| **Registrar / Admin** | 2–5 | Desktop | All day | Speed, bulk operations, keyboard shortcuts |
| **Teacher** | 20–200 | Phone | 2–5× daily, 2 min each | Ruthless speed. Offline tolerance. |
| **Accountant** | 1–3 | Desktop | All day | Correctness, reconciliation, exports |
| **Principal / Director** | 1–2 | Desktop + phone | Weekly | Dashboards. No data entry, ever. |
| **Parent** | 200–5,000 | Phone | 2–4× monthly | Pay fees. See attendance. See results. |
| **Student** | 200–5,000 | Phone | Weekly | Timetable, results, dues |
| **Librarian / Warden / Transport** | 1–5 each | Desktop | Daily | Narrow, deep tools for one domain |

### 3.2 Persona detail

---

#### Priya — Registrar (the power user)

> *"I have 340 applications to process in three weeks and I know every one of them by admission number."*

**Context.** Desktop, two monitors, all day, high volume. Has used the old system for six years and is faster on it than any new hire will be on ours for a year.

**Needs**
- Bulk import (CSV) for students, and bulk actions on selected rows
- Keyboard navigation. She should never need the mouse in the enrollment flow.
- Global search that resolves `2026/0447` instantly, from any screen
- Undo. She will make mistakes at speed.

**Frustrations**
- Modal dialogs that require a mouse click to dismiss
- Any workflow that forces one-at-a-time processing
- Losing 20 minutes of form entry because the session expired

**Design implication:** Priya's screens are dense tables, not cards. Optimize for information density and keystrokes. She is not a casual user and should not be treated as one.

---

#### Mr. Patel — Teacher (the adoption risk)

> *"I have 90 seconds between periods and I'm walking to the next classroom."*

**Context.** Phone, in a corridor, one hand, patchy Wi-Fi, standing up.

**Needs**
- Attendance in ≤ 3 taps: open app → today's section is already selected → mark absentees only (everyone defaults to present) → submit
- **Offline-first.** He marks in a basement classroom with no signal. It must sync when he surfaces.
- Marks entry that behaves like a spreadsheet: type, `Tab`, type, `Tab`
- Never a full-page reload

**Frustrations**
- Any spinner longer than 500ms
- Being asked to select the academic year, term, section, and course when the timetable already knows all four

**Design implication:** the entire teacher experience is one screen deep. If a teacher-facing flow requires more than three taps, it is a bug. **This persona has veto power over the design.**

---

#### Sarah — Accountant

> *"If the trial balance doesn't balance, I'm not going home."*

**Needs**
- Double-entry ledger with drill-down from any figure to the source transaction
- Bank reconciliation against an uploaded statement
- Immutability: nothing changes after a period closes
- Export to Excel. Always. For everything.

**Frustrations**
- Any screen that shows a number she cannot trace to a journal entry
- Rounding discrepancies
- Modules that "helpfully" adjust figures without a journal record

**Design implication:** Sarah's trust is binary and, once lost, unrecoverable. Every number is clickable. Every adjustment leaves a trace.

---

#### Anita — Parent

> *"I got an SMS saying fees are due. I want to pay it right now, on my phone, and be done."*

**Needs**
- Pay from an SMS/email link in under 60 seconds, without creating a password
- One consolidated bill across all her children
- Attendance and results without calling the school
- Receipt as a PDF, immediately

**Frustrations**
- Separate logins per child
- "Please contact the office" as an answer to anything
- Payment gateway failures with no confirmation of whether money left her account

**Design implication:** the payment flow is the highest-stakes path in the product. It must be idempotent, must confirm loudly, and must never leave a parent uncertain about whether they paid.

---

## 4. Scope by Release

Each phase must be independently shippable and independently useful. **Do not build Phase 2 until Phase 1 is in production with real users.**

### Phase 1 — Foundation & Core Records (MVP)
*Target: 12 weeks. Goal: the institution's data lives here.*

| Module | Included | Excluded |
|---|---|---|
| Identity & Access | Login, roles, RBAC, password reset | SSO, 2FA, SAML |
| Organization Setup | Campus, departments, rooms | Multi-campus reporting |
| Person Registry | Person, guardians, contacts | Deduplication engine |
| Academic Calendar | Years, terms, holidays | Recurring rule builder |
| Admissions | Application → admit | Online public application form, entrance tests |
| SIS | Student profile, lifecycle, promotion | Bulk transfer between institutions |
| Academics | Programs, courses, sections, enrollment | Prerequisite enforcement, elective bidding |
| Documents | Upload, store, retrieve | Versioning, e-signature |
| Audit Log | Full write-audit on all tables | Audit search UI (use SQL) |

**Phase 1 exit criteria:** every current student is in the system, correctly enrolled, with correct guardians. The registrar has stopped using her spreadsheet.

---

### Phase 2 — Money
*Target: +8 weeks. Goal: replace the accounting software.*

| Module | Included | Excluded |
|---|---|---|
| Fees & Billing | Fee heads, structures, plans, invoices, discounts, scholarships | Instalment renegotiation workflow |
| Payments | Gateway integration, offline payment recording, receipts | Auto-debit / standing instructions |
| Finance | Chart of accounts, journal, ledger, trial balance, P&L | Balance sheet, budgeting, cost centres |
| Notifications | Email + SMS for invoice and receipt | Push, WhatsApp, in-app inbox |
| Parent Portal | View dues, pay, download receipt | Everything else |

**Phase 2 exit criteria:** one full term billed and collected through the system. Trial balance matches the old system to the rupee.

---

### Phase 3 — Daily Operations
*Target: +10 weeks. Goal: teachers use it every day.*

| Module | Included | Excluded |
|---|---|---|
| Timetable | Manual grid builder with clash detection | Automatic timetable generation |
| Attendance | Period-wise + day-wise, **offline-capable**, mobile-first | Biometric, RFID, geofencing |
| Examinations | Exam setup, marks entry, grade computation, report cards | Question banks, online exams, OMR |
| Transcripts | Cumulative transcript, GPA/CGPA | Digital signing, blockchain verification |
| Teacher Portal | Attendance + marks + my timetable | Lesson planning |
| Student Portal | Timetable, attendance, results, dues | Course registration |

**Phase 3 exit criteria:** ≥85% of teachers marking attendance in-app, daily, unprompted. Paper registers retired.

---

### Phase 4 — Auxiliary Services
*Target: +10 weeks. Goal: every charge reaches the invoice.*

| Module | Included |
|---|---|
| Library | Catalogue, issue/return, fines → Fees |
| Hostel | Blocks, rooms, beds, allocation, fees |
| Transport | Routes, stops, vehicles, assignment, fees |
| HR & Payroll | Staff, contracts, leave, payslips → Finance |
| Inventory & Procurement | Items, PO, GRN, vendor bills → Finance |
| Discipline | Incident logging |

---

### Phase 5 — Intelligence & Reach
*Target: +8 weeks.*

- Reports & Analytics engine, custom report builder
- Executive dashboards
- Mobile app (parent + student), push notifications, WhatsApp
- Public API + webhooks
- Multi-tenancy activation
- Advanced: at-risk-student prediction, fee-default forecasting

---

## 5. Functional Requirements

Requirement IDs are stable. Reference them in tickets, tests, and commit messages.

**Priority key:** `P0` = launch blocker · `P1` = required for phase completion · `P2` = desirable

---

### 5.1 Identity & Access (`FR-1xx`)

| ID | Requirement | Priority |
|---|---|---|
| FR-101 | A user authenticates with email/username + password; passwords are hashed with Argon2id. | P0 |
| FR-102 | A user holds one or more roles; roles hold permissions of the form `resource:action:scope`. | P0 |
| FR-103 | Authorization is enforced server-side on every request. Client-side hiding of UI is presentation only, never a control. | P0 |
| FR-104 | `scope` restricts a permission to the actor's own context: a teacher may write grades only for sections they teach; a parent may read data only for their own children. | P0 |
| FR-105 | Sessions use short-lived JWT access tokens (15 min) + rotating refresh tokens (7 days). Refresh reuse revokes the family. | P0 |
| FR-106 | Password reset by emailed single-use token, valid 30 minutes. | P0 |
| FR-107 | Failed login attempts are rate-limited (5 per 15 min per account, exponential backoff per IP). | P0 |
| FR-108 | An admin can deactivate a user, immediately invalidating all their sessions. | P0 |
| FR-109 | Two-factor authentication (TOTP) available, and **mandatory** for any role with financial write permissions. | P1 |
| FR-110 | SSO via SAML 2.0 / OIDC. | P2 |

---

### 5.2 Person & Student (`FR-2xx`)

| ID | Requirement | Priority |
|---|---|---|
| FR-201 | One human being maps to exactly one `Person` record, regardless of how many roles they hold. | P0 |
| FR-202 | A `Person` may simultaneously hold Student, Staff, Guardian, and Vendor profiles. | P0 |
| FR-203 | On creating a Person, the system searches for likely duplicates (name + DOB, or phone, or national ID) and warns before saving. | P1 |
| FR-204 | A student has exactly one lifecycle status at any time: `Admitted → Enrolled → Active → {Promoted, Suspended, Withdrawn, Graduated}`. | P0 |
| FR-205 | Students are **never** hard-deleted. Status changes only. All historical records remain queryable indefinitely. | P0 |
| FR-206 | A student has ≥1 guardian; exactly one guardian is flagged `is_primary_contact`. | P0 |
| FR-207 | A guardian may be linked to multiple students (siblings), and sees all of them under one login. | P0 |
| FR-208 | Admission numbers are generated from a configurable, gap-free sequence per academic year. | P0 |
| FR-209 | Bulk student import via CSV, with a dry-run validation pass that reports every error before any row is written. | P1 |
| FR-210 | Year-end promotion: bulk-advance a batch to the next year, with per-student override for retention. | P1 |

---

### 5.3 Academics (`FR-3xx`)

| ID | Requirement | Priority |
|---|---|---|
| FR-301 | A `Program` contains a versioned `Curriculum`, which lists `Courses` with credit values. | P0 |
| FR-302 | Changing a curriculum creates a **new version**. Students remain attached to the curriculum version in force at their admission. | P0 |
| FR-303 | A `Course` is delivered as one or more `Sections`, each with a capacity, a teacher, and a room. | P0 |
| FR-304 | An `Enrollment` links exactly one student to one section, for one term, in one academic year. It is the atomic unit of the academic system. | P0 |
| FR-305 | Enrolling into a full section is rejected at the database level (unique constraint + capacity check), not merely in the UI. | P0 |
| FR-306 | Every academic record carries `academic_year_id`. Queries are year-scoped by default. | P0 |
| FR-307 | Prerequisite enforcement: enrollment is blocked if a prerequisite course was not passed. Overridable by a registrar, with a logged reason. | P2 |

---

### 5.4 Fees & Billing (`FR-4xx`)

| ID | Requirement | Priority |
|---|---|---|
| FR-401 | A `FeeHead` is a single named charge (Tuition, Lab, Bus, Late Fine). A `FeeStructure` binds fee heads + amounts to a program + academic year. | P0 |
| FR-402 | A `FeePlan` defines the instalment schedule and due dates. | P0 |
| FR-403 | On `student.enrolled`, an invoice is generated automatically from the applicable structure and plan. | P0 |
| FR-404 | Other modules **never write to `Invoice` directly.** They emit a charge event `{ student_id, fee_head, amount, reference }`; Fees appends the line. | P0 |
| FR-405 | Discounts and scholarships apply as negative invoice lines, each with an approver and a reason. They never mutate the original charge line. | P0 |
| FR-406 | An invoice is immutable once paid in full. Adjustments create a credit note. | P0 |
| FR-407 | Payments are matched to invoices by reference; unmatched payments land in a suspense account and raise an alert. | P0 |
| FR-408 | **Payment processing is idempotent.** A gateway webhook delivered twice must produce exactly one payment record. Enforced by a unique constraint on the gateway transaction ID. | P0 |
| FR-409 | A PDF receipt is generated and emailed on every successful payment. | P0 |
| FR-410 | Partial payments are supported; the invoice tracks `amount_due`, `amount_paid`, `balance`. | P0 |
| FR-411 | Overdue invoices trigger `invoice.overdue` on a configurable schedule (e.g. T+7, T+15, T+30). | P1 |
| FR-412 | Refunds require dual approval and post a reversing journal entry. | P1 |
| FR-413 | Siblings' invoices are consolidated into one payable statement per guardian. | P1 |

---

### 5.5 Finance & Accounting (`FR-5xx`)

| ID | Requirement | Priority |
|---|---|---|
| FR-501 | A configurable Chart of Accounts with the five standard types: Asset, Liability, Equity, Income, Expense. | P0 |
| FR-502 | Every financial event posts a balanced `JournalEntry`. **A journal entry where `sum(debits) != sum(credits)` is rejected by a database constraint.** | P0 |
| FR-503 | Journal entries are append-only. A correction is a new reversing entry, never an edit or a delete. | P0 |
| FR-504 | Finance **never initiates** business actions. It only records events emitted by other modules. | P0 |
| FR-505 | Trial balance, general ledger, and P&L are generated for any date range. | P0 |
| FR-506 | Every figure in every financial report drills down to the source journal entry, and from there to the originating business document. | P0 |
| FR-507 | Closing an accounting period blocks all further postings dated within it, system-wide. | P0 |
| FR-508 | Money is stored as `DECIMAL(18,2)` or integer minor units. **Floating-point is prohibited for monetary values.** | P0 |
| FR-509 | Bank reconciliation: upload a statement, auto-match by amount + date + reference, present exceptions. | P1 |
| FR-510 | Multi-currency, with the exchange rate captured at transaction time. | P2 |

---

### 5.6 Attendance (`FR-6xx`)

| ID | Requirement | Priority |
|---|---|---|
| FR-601 | A nightly job generates blank attendance registers from the published timetable and current enrollments, skipping holidays. | P0 |
| FR-602 | Attendance supports both day-wise (schools) and period-wise (colleges) modes, configurable per program. | P0 |
| FR-603 | Marking defaults every student to **Present**. The teacher marks only exceptions. | P0 |
| FR-604 | **Offline capable.** A teacher can mark attendance with no network. Data is queued locally and synced on reconnect, with conflict resolution favouring the earliest client timestamp. | P0 |
| FR-605 | Marking a full section takes ≤ 45 seconds and ≤ 3 taps to reach the marking screen. | P0 |
| FR-606 | Attendance is editable by the teacher for 24 hours; thereafter it requires an admin override, which is logged with a reason. | P0 |
| FR-607 | Attendance percentage is recomputed nightly; crossing below a configurable threshold emits `attendance.below_threshold`. | P1 |
| FR-608 | Approved leave is excluded from the absence count. | P1 |
| FR-609 | Attendance module raises alerts but **enforces nothing**. Consequences (parent SMS, exam blocking) are owned by the subscribing modules. | P0 |

---

### 5.7 Examinations & Grading (`FR-7xx`)

| ID | Requirement | Priority |
|---|---|---|
| FR-701 | Exams are defined per course per term, with a max mark, a pass mark, and a weight toward the final grade. | P0 |
| FR-702 | Exam eligibility is evaluated against independent gates (attendance ≥ threshold; fees cleared). Each gate reports its own reason for blocking. | P0 |
| FR-703 | Marks entry behaves like a spreadsheet: keyboard-navigable, autosaving, resumable. | P0 |
| FR-704 | Marks outside `[0, max_mark]` are rejected on entry, client and server. | P0 |
| FR-705 | Grade computation applies a configurable grade scale (percentage bands → letter → grade point). | P0 |
| FR-706 | Marks pass through `Draft → Submitted → Moderated → Finalized`. Only `Finalized` marks appear on a report card. | P0 |
| FR-707 | **A finalized grade is immutable.** Corrections create a new versioned record carrying a reason, an approver, and a timestamp. The prior value remains permanently retrievable. | P0 |
| FR-708 | A report card renders one term. A transcript renders the full academic history with cumulative GPA. | P0 |
| FR-709 | Result publication is a deliberate, explicit action, scheduled to a datetime. Nothing is visible to students before it. | P0 |
| FR-710 | Re-evaluation requests are logged, tracked, and either close as `no change` or produce a versioned correction under FR-707. | P1 |

---

### 5.8 Cross-module contracts (`FR-8xx`)

These are the requirements that make the modules a *system* rather than a folder of apps. They are the most important requirements in this document.

| ID | Requirement | Priority |
|---|---|---|
| FR-801 | Modules communicate across layers **exclusively via events**. Direct cross-module imports of write-methods are prohibited and enforced by lint rule. | P0 |
| FR-802 | Every event handler is **idempotent.** Processing the same event ID twice produces exactly the same state as processing it once. | P0 |
| FR-803 | Event payloads are versioned and typed in the shared `packages/events` package. Adding a required field is a breaking change requiring a new version. | P0 |
| FR-804 | A failed event handler retries with exponential backoff, then lands in a dead-letter queue that raises an operational alert. **Events are never silently dropped.** | P0 |
| FR-805 | Operations that must be atomic (create student + create login) use a database transaction, **not** an event. Events are for eventual consistency only. | P0 |
| FR-806 | Every mutating request carries a `request_id`; every write records `created_by` / `updated_by` / timestamps; every table has `deleted_at`. | P0 |
| FR-807 | Every table carries `tenant_id`, enforced by PostgreSQL Row-Level Security — not by application-layer `WHERE` clauses. | P0 |
| FR-808 | All timestamps are stored in UTC. Conversion to local time happens only at the presentation layer. | P0 |

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | **Performance** | p95 API response < 300 ms; p99 < 800 ms, measured under production load. |
| NFR-02 | **Performance** | Any list view returns its first page in < 500 ms with 100,000 rows in the table. Pagination is mandatory; unbounded queries are prohibited. |
| NFR-03 | **Performance** | Attendance submission for a 40-student section completes in < 1 s on 3G. |
| NFR-04 | **Scale** | Support 10,000 students and 1,000 concurrent users per tenant without architectural change. |
| NFR-05 | **Scale** | Results-day peak: 5,000 concurrent portal reads. This is the designed peak; load-test against it before every results day. |
| NFR-06 | **Availability** | 99.9% uptime during business hours (07:00–19:00 local). Planned maintenance outside this window only. |
| NFR-07 | **Availability** | Attendance and marks entry degrade gracefully to offline mode. They must never hard-fail on network loss. |
| NFR-08 | **Durability** | Automated daily backups, 30-day retention, PITR to any second in the last 7 days. **Restores tested quarterly.** An untested backup is not a backup. |
| NFR-09 | **Durability** | RPO ≤ 5 minutes. RTO ≤ 1 hour. |
| NFR-10 | **Security** | TLS 1.3 in transit; AES-256 at rest. |
| NFR-11 | **Security** | Passwords: Argon2id. Never logged, never emailed, never returned by any API. |
| NFR-12 | **Security** | PII (national ID, DOB, address, guardian phone) is encrypted at the column level and masked in logs. |
| NFR-13 | **Security** | Every request is authorized server-side. Assume the client is hostile. |
| NFR-14 | **Security** | Dependency scanning + SAST in CI. Build fails on any known critical CVE. |
| NFR-15 | **Security** | Annual third-party penetration test. |
| NFR-16 | **Compliance** | Full audit trail (actor, action, before, after, timestamp, IP) on all financial and academic writes. Retained 7 years. |
| NFR-17 | **Compliance** | GDPR-style data subject rights: export and erasure. Erasure anonymizes the `Person`; it does not delete financial or academic records required by law. |
| NFR-18 | **Compliance** | Student data residency configurable per tenant. |
| NFR-19 | **Accessibility** | WCAG 2.1 AA. Keyboard-navigable throughout. Screen-reader labels on all interactive elements. |
| NFR-20 | **Usability** | All parent- and student-facing surfaces are mobile-first, functional at 360 px width. |
| NFR-21 | **Usability** | Bundle: < 200 KB gzipped JS on first load for portal routes. |
| NFR-22 | **i18n** | All user-facing strings externalized from day one. RTL layout support. Locale-aware dates, numbers, and currency. |
| NFR-23 | **Observability** | Structured JSON logs with `request_id`, `tenant_id`, `user_id` on every line. Distributed tracing on every request. |
| NFR-24 | **Maintainability** | ≥ 80% test coverage on business logic. 100% on financial calculations and grade computation. |
| NFR-25 | **Maintainability** | Every schema change is a reviewed, versioned, reversible migration. No manual production DDL, ever. |

---

## 7. Data Model Reference

> Illustrative, not exhaustive. Authoritative schema lives in `packages/database/prisma/schema.prisma`.

### 7.1 Core entities

```
┌─────────────┐
│   Person    │  id, tenant_id, first_name, last_name, dob, gender,
│             │  email, phone, national_id (encrypted), photo_url
└──────┬──────┘
       │ 1──*
       ├──────────▶ StudentProfile   (admission_no, status, joined_at, program_id)
       ├──────────▶ StaffProfile     (employee_no, department_id, designation_id)
       ├──────────▶ GuardianProfile  (relationship, occupation)
       └──────────▶ User             (username, password_hash, last_login_at)

StudentGuardian  (student_id, guardian_id, is_primary_contact, can_pickup)
                 └─ many-to-many join; siblings share guardians

User *──* Role *──* Permission     (resource, action, scope)
```

### 7.2 Academic entities

```
AcademicYear (code "2026-2027", start_date, end_date, status)
   └── Term  (name "Term 1", start_date, end_date, is_current)

Program (name, level, duration_terms, department_id)
   └── Curriculum (version, effective_from, status)
         └── CurriculumCourse (course_id, term_number, credits, is_elective)

Course  (code "ACC101", title, credits, department_id)
   └── Section (code "ACC101-B", capacity, teacher_id, room_id,
                academic_year_id, term_id)

Enrollment  ◀── THE PIVOT
   student_id, section_id, course_id, academic_year_id, term_id,
   status (active|dropped|completed), enrolled_at, final_grade_id
   UNIQUE (student_id, section_id)
```

### 7.3 Financial entities

```
FeeHead      (code "TUITION", name, account_id, is_refundable)
FeeStructure (program_id, academic_year_id)
   └── FeeStructureLine (fee_head_id, amount)
FeePlan      (name "50-50", instalments[])

Invoice   (number, student_id, academic_year_id, term_id,
           issue_date, due_date, subtotal, discount, total,
           amount_paid, balance, status)
   └── InvoiceLine (fee_head_id, description, amount, source_module,
                    source_reference)   ◀── how Library/Transport charges arrive

Payment   (invoice_id, amount, method, gateway_txn_id UNIQUE,  ◀── idempotency
           received_at, status, journal_entry_id)

Account       (code, name, type, parent_id)         ◀── chart of accounts
JournalEntry  (date, narration, source_module, source_reference, posted_at)
   └── JournalLine (account_id, debit, credit)
       CONSTRAINT: SUM(debit) = SUM(credit) per entry   ◀── enforced in DB
```

### 7.4 Operational entities

```
TimetableSlot    (section_id, course_id, teacher_id, room_id,
                  day_of_week, period_id, academic_year_id, term_id)
                  UNIQUE (teacher_id, day, period, term)  ◀── no double-booking
                  UNIQUE (room_id,    day, period, term)
                  UNIQUE (section_id, day, period, term)

AttendanceRecord (enrollment_id, date, period_id, status, marked_by,
                  marked_at, client_timestamp)   ◀── client_timestamp for offline sync
                  UNIQUE (enrollment_id, date, period_id)

Exam  (course_id, term_id, type, max_mark, pass_mark, weight, held_on)
Mark  (enrollment_id, exam_id, obtained, status, entered_by, version)
      UNIQUE (enrollment_id, exam_id, version)   ◀── versioned corrections
Grade (enrollment_id, letter, grade_point, finalized_at, finalized_by)
```

### 7.5 Columns present on every table

| Column | Type | Purpose |
|---|---|---|
| `id` | `uuid` | Primary key. UUIDv7 for time-ordered inserts. |
| `tenant_id` | `uuid` | Multi-tenancy. Enforced by RLS. |
| `created_at` | `timestamptz` | UTC. |
| `updated_at` | `timestamptz` | UTC. |
| `deleted_at` | `timestamptz \| null` | Soft delete. **Never hard-delete.** |
| `created_by` | `uuid` | Audit. |
| `updated_by` | `uuid` | Audit. |
| `version` | `int` | Optimistic locking on contended rows. |

---

## 8. API Conventions

### 8.1 Shape

```
Base:      /api/v1
Auth:      Authorization: Bearer <access_token>
Tenant:    resolved from the token — never from a client-supplied header
Idempotency: Idempotency-Key: <uuid>   (required on all POST/PATCH/DELETE)
```

### 8.2 Resources

```
GET    /api/v1/students?page=1&limit=50&status=active&q=patel
POST   /api/v1/students
GET    /api/v1/students/:id
PATCH  /api/v1/students/:id
DELETE /api/v1/students/:id            → soft delete (sets deleted_at)

POST   /api/v1/students/:id/promote    → verbs on sub-resources for
POST   /api/v1/invoices/:id/void          state transitions that are
POST   /api/v1/marks/:id/finalize         not plain field updates
```

### 8.3 Responses

```jsonc
// success — single
{ "data": { "id": "...", "type": "student", "attributes": { } } }

// success — collection
{
  "data": [ ],
  "meta": { "page": 1, "limit": 50, "total": 1247, "totalPages": 25 }
}

// error — RFC 7807 Problem Details
{
  "type":   "https://errors.erp.app/validation-failed",
  "title":  "Validation failed",
  "status": 422,
  "detail": "The request body did not pass validation.",
  "instance": "/api/v1/students",
  "errors": [
    { "field": "email", "code": "invalid_format", "message": "Must be a valid email." }
  ]
}
```

### 8.4 Rules

| Rule | Rationale |
|---|---|
| Version in the path (`/v1`). Never break `v1`. | Third parties will integrate. |
| Every list endpoint paginates. **No unbounded queries.** | One tenant with 50,000 students must not OOM the server. |
| Filters are explicit query params, not a query DSL. | A DSL becomes an injection surface and an unindexed-query generator. |
| `PATCH` is partial. `PUT` is not offered. | Removes an entire class of accidental-null bugs. |
| Idempotency keys on all mutations, stored 24 h. | Networks retry. Users double-click. Gateways double-fire. |
| Money in responses: integer minor units + a currency code. Never a float, never a formatted string. | `{"amount": 4500000, "currency": "IDR"}` |
| Timestamps: ISO 8601, UTC, `Z` suffix. | |
| `429` with `Retry-After` on rate limit. | |
| Validation with Zod, from a schema shared with the frontend. | One definition. Two enforcement points. |

---

## 9. Project Structure

```
erp-system/
│
├── apps/
│   ├── web/                          # Next.js 15 — admin console + all portals
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/           # login, forgot-password
│   │   │   │   ├── (admin)/          # registrar, principal
│   │   │   │   │   ├── students/
│   │   │   │   │   ├── academics/
│   │   │   │   │   ├── fees/
│   │   │   │   │   ├── finance/
│   │   │   │   │   └── settings/
│   │   │   │   ├── (teacher)/        # attendance, marks, timetable
│   │   │   │   ├── (parent)/         # dues, pay, children
│   │   │   │   ├── (student)/        # timetable, results
│   │   │   │   └── api/              # BFF routes only; no business logic
│   │   │   ├── components/           # app-specific composites
│   │   │   ├── features/             # colocated by domain, not by file type
│   │   │   │   ├── attendance/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   ├── api.ts
│   │   │   │   │   └── offline-queue.ts
│   │   │   │   └── fees/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   ├── api/                          # NestJS — one module per ERP module
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── identity/
│   │   │   │   ├── organization/
│   │   │   │   ├── person/
│   │   │   │   ├── calendar/
│   │   │   │   ├── admissions/
│   │   │   │   ├── sis/
│   │   │   │   ├── academics/
│   │   │   │   ├── fees/
│   │   │   │   ├── finance/
│   │   │   │   ├── hr/
│   │   │   │   ├── timetable/
│   │   │   │   ├── attendance/
│   │   │   │   ├── examinations/
│   │   │   │   ├── library/
│   │   │   │   ├── hostel/
│   │   │   │   ├── transport/
│   │   │   │   ├── procurement/
│   │   │   │   └── notifications/
│   │   │   │
│   │   │   │   # Every module has the same internal shape:
│   │   │   │   #   <module>.module.ts
│   │   │   │   #   <module>.controller.ts    ← HTTP only. No logic.
│   │   │   │   #   <module>.service.ts       ← business logic lives here
│   │   │   │   #   <module>.repository.ts    ← Prisma access. Only place with DB calls.
│   │   │   │   #   dto/
│   │   │   │   #   events/
│   │   │   │   #     published/              ← events this module emits
│   │   │   │   #     handlers/               ← events this module consumes
│   │   │   │   #   __tests__/
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── guards/           # auth, RBAC
│   │   │   │   ├── interceptors/     # audit, logging, tenant context
│   │   │   │   ├── filters/          # RFC 7807 error mapping
│   │   │   │   └── decorators/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   ├── worker/                       # BullMQ processors — no HTTP surface
│   │   └── src/jobs/
│   │       ├── generate-attendance-registers.ts   # nightly
│   │       ├── generate-term-invoices.ts
│   │       ├── recompute-attendance-pct.ts
│   │       ├── send-fee-reminders.ts
│   │       └── close-accounting-period.ts
│   │
│   └── mobile/                       # Phase 5 — Expo
│
├── packages/
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # single source of truth for the schema
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/client.ts
│   │
│   ├── contracts/                    # ◀── Zod schemas + inferred TS types.
│   │   └── src/                      #     Imported by BOTH web and api.
│   │       ├── student.ts            #     Change a field here → both sides
│   │       ├── invoice.ts            #     fail to compile. This is the point.
│   │       └── attendance.ts
│   │
│   ├── events/                       # ◀── The event backbone, as code.
│   │   └── src/
│   │       ├── student.events.ts     #     student.admitted, student.enrolled
│   │       ├── fee.events.ts         #     invoice.issued, payment.received
│   │       ├── academic.events.ts    #     grade.finalized
│   │       └── index.ts              #     Typed names + typed payloads.
│   │
│   ├── ui/                           # shadcn/ui components, owned in-repo
│   ├── auth/                         # CASL ability definitions, JWT helpers
│   └── config/                       # eslint, tsconfig, tailwind presets
│
├── docs/
│   ├── ERP_SYSTEM_OVERVIEW.md        # architecture + module linkage
│   ├── PRD.md                        # this file
│   ├── adr/                          # architecture decision records
│   └── runbooks/                     # on-call procedures
│
├── infra/
│   ├── docker/
│   ├── terraform/
│   └── k8s/
│
├── .github/workflows/
│   ├── ci.yml                        # lint → typecheck → test → build
│   └── deploy.yml
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 9.1 Structural rules

These are enforced by lint rules and CI, not by good intentions.

| # | Rule | Why |
|---|---|---|
| 1 | **Controllers hold no business logic.** They parse, delegate, and serialize. | Keeps logic testable without HTTP. |
| 2 | **Only repositories touch Prisma.** Services never import the DB client. | One place to add tenant scoping, soft-delete filters, and query logging. |
| 3 | **A module never imports another module's service.** Cross-module communication is by event, or by a read-only query interface. | This is [FR-801](#58-cross-module-contracts-fr-8xx). It is what keeps the monolith modular enough to split later. |
| 4 | **Types are defined once, in `packages/contracts`.** | Prevents frontend and backend drifting into disagreement about what a `Student` is. |
| 5 | **Event names and payloads live in `packages/events`.** Never a raw string. | A typo in an event name is a silent, undetectable bug. Make it a compile error. |
| 6 | **`features/` colocates by domain, not by file type.** | Everything about attendance is in one folder. You delete a feature by deleting a folder. |
| 7 | **No business logic in `apps/web/src/app/api/`.** Those routes proxy and shape; they do not decide. | Business rules must not depend on which client called them. |

### 9.2 The two packages that matter most

`packages/contracts` and `packages/events` are the entire reason to use a TypeScript monorepo for this project.

Without them, "the modules are linked by events" is a diagram in a document that slowly stops matching reality. With them, it is a compile-time guarantee: rename a field on `student.enrolled`, and every module that consumes it fails to build, immediately, before code review.

**If you cut one thing from this plan, do not cut these.**

---

## 10. Permissions Matrix

`C` create · `R` read · `U` update · `D` delete(soft) · `—` no access
Scoped entries in **bold** are restricted to the actor's own context.

| Resource | Admin | Principal | Teacher | Accountant | Librarian | Parent | Student |
|---|---|---|---|---|---|---|---|
| Student profile | CRUD | R | **R** *(own sections)* | R | R | **R** *(own children)* | **R** *(self)* |
| Enrollment | CRUD | R | **R** | R | — | **R** | **R** |
| Attendance | CRUD | R | **CRU** *(own sections, 24 h)* | — | — | **R** | **R** |
| Marks | R | R | **CRU** *(own sections, pre-finalize)* | — | — | — | — |
| Grades (finalized) | R | R | **R** | — | — | **R** *(post-publish)* | **R** *(post-publish)* |
| Transcript | R | R | — | — | — | **R** | **R** |
| Fee structure | CRUD | R | — | CRUD | — | — | — |
| Invoice | R | R | — | CRUD | — | **R** | **R** |
| Payment | R | R | — | CRU | — | **C** *(own)* | — |
| Journal entry | R | R | — | **C, R** *(append-only)* | — | — | — |
| Chart of accounts | R | R | — | CRUD | — | — | — |
| Staff profile | CRUD | R | **R** *(self)* | R | — | — | — |
| Payroll | — | R | **R** *(own payslip)* | CRUD | — | — | — |
| Library catalogue | R | R | R | — | CRUD | R | R |
| Book issue | — | — | — | — | CRUD | **R** | **R** |
| Timetable | CRUD | R | **R** | — | — | **R** | **R** |
| Audit log | R | R | — | R | — | — | — |
| System settings | CRUD | — | — | — | — | — | — |

### Notes on the matrix

- **Nobody can update a finalized grade.** Not the admin, not the principal. Corrections go through the versioned re-evaluation flow ([FR-707](#57-examinations--grading-fr-7xx)). This is deliberate and must survive the first angry phone call.
- **Nobody can update or delete a journal entry.** Not even the accountant. Corrections are reversing entries ([FR-503](#55-finance--accounting-fr-5xx)).
- **The Principal has read-only access to everything and write access to nothing.** Executives who can edit data eventually do, and then the data cannot be trusted.
- Payroll is invisible to Admin by default. Salary data is the most commonly leaked dataset in any ERP.

---

## 11. Integrations

| System | Direction | Purpose | Phase | Notes |
|---|---|---|---|---|
| **Payment gateway** | Bidirectional | Collect fees | 2 | Wrap behind a `PaymentProvider` interface. Stripe (global), Midtrans/Xendit (Indonesia), Razorpay (India). **You will change provider.** Webhooks must be signature-verified and idempotent. |
| **Email** | Outbound | Invoices, receipts, credentials | 2 | Resend or SES. Transactional only. |
| **SMS** | Outbound | Absence + fee reminders | 2 | Twilio. Regional aggregators are often cheaper — keep the interface abstract. |
| **WhatsApp Business** | Outbound | Same as SMS, higher open rate | 5 | In many markets this is the primary channel, not a nice-to-have. |
| **Push (FCM)** | Outbound | Mobile app | 5 | |
| **Accounting export** | Outbound | Tally / QuickBooks / Xero | 3 | The accountant will not switch on day one. Meet them where they are. |
| **Google Classroom / Moodle** | Outbound roster sync | We own identity; they own content | 5 | Reinforces the non-goal: we are not an LMS. |
| **Biometric / RFID** | Inbound webhook | Attendance capture | 5 | Publish a webhook contract. Do not ship device drivers. |
| **GPS tracker** | Inbound | Bus tracking | 5 | |
| **Public API + webhooks** | Bidirectional | Third-party extension | 5 | OpenAPI spec generated from the code, never hand-maintained. |

---

## 12. Analytics & Instrumentation

We cannot improve what we do not measure, and the [success metrics](#23-success-metrics) are meaningless without instrumentation shipped alongside the feature.

### Product events to emit from day one

| Event | Properties | Answers |
|---|---|---|
| `attendance_marked` | `duration_ms`, `section_size`, `was_offline`, `taps_to_submit` | Are we beating paper? (G3) |
| `invoice_paid` | `time_since_issue`, `channel`, `attempts`, `device` | Is the payment flow working? (G4) |
| `payment_failed` | `gateway_error_code`, `attempt_number` | Where are parents dropping off? |
| `report_generated` | `report_type`, `duration_ms`, `row_count` | Which reports are slow? Which are unused? |
| `login` | `role`, `device_type` | Is Mr. Patel actually logging in? (G3) |
| `search_performed` | `query_length`, `results_count`, `clicked_position` | Is global search finding what Priya needs? |
| `offline_sync_completed` | `queued_items`, `conflicts`, `delay_ms` | Is offline mode trustworthy? |

### Operational dashboards required at launch

1. **Adoption** — DAU by role. If teacher DAU is below 85%, everything else is theatre.
2. **Attendance latency** — p50/p95 of `attendance_marked.duration_ms`. This is the G3 metric.
3. **Payment funnel** — invoice issued → link clicked → gateway opened → paid. Watch the drop-offs.
4. **Event backbone health** — queue depth, handler failure rate, dead-letter count. A growing DLQ means invoices are silently not being created.
5. **Financial integrity** — a scheduled job asserting `SUM(debits) = SUM(credits)` across the whole ledger. It should always pass. If it ever fails, page someone.

---

## 13. Rollout Plan

Rolling out an ERP is where these projects usually die. The software is rarely the hard part.

### 13.1 Sequencing

| Stage | Duration | What happens |
|---|---|---|
| **1. Data migration dry-run** | 2 weeks | Import last year's data into staging. Reconcile student counts, fee totals, and grade records against the old system. **Do not proceed until they match exactly.** |
| **2. Parallel run — Finance** | 1 term | Both systems record fees. Compare trial balances weekly. The accountant does double work for one term. This is unpleasant, non-negotiable, and it is what earns Sarah's trust. |
| **3. Pilot — one department** | 4 weeks | 5 teachers, ~150 students. Real attendance, real marks. Fix what breaks. |
| **4. Teacher rollout** | 2 weeks | Train in groups of 10. 20 minutes each. If training takes longer than 20 minutes, the UI is wrong — fix the UI, not the training. |
| **5. Parent rollout** | 2 weeks | Launch with a real invoice, not a demo. Parents engage with money. |
| **6. Legacy shutdown** | — | Only after one clean term-end close and one clean results publication. |

### 13.2 Data migration checklist

- [ ] Every student has a unique, stable admission number
- [ ] Every student has ≥ 1 guardian with a valid, reachable phone number
- [ ] Historical grades imported and locked as `finalized`, with the original source noted
- [ ] Opening balances posted as a single, balanced journal entry
- [ ] Outstanding invoices migrated with correct `balance` figures
- [ ] Total receivable in the new system == total receivable in the old system, **to the rupee**
- [ ] Duplicate `Person` records identified and merged **before** go-live, never after

### 13.3 Go/no-go criteria

Do not launch a phase unless all are true:

- [ ] All `P0` requirements for the phase pass acceptance tests
- [ ] Load test passes at 2× expected peak
- [ ] Backup restore has been tested, from scratch, within the last 30 days
- [ ] The rollback plan is written and has been rehearsed
- [ ] On-call rota is staffed for the first two weeks
- [ ] The financial integrity job (`debits == credits`) has passed for 7 consecutive days

---

## 14. Risks & Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Teachers reject the system** because attendance is slower than paper. | **High** | **Critical** | Treat the 45-second target ([FR-605](#56-attendance-fr-6xx)) as a hard requirement, not a goal. Pilot with the most skeptical teacher on staff. Instrument `duration_ms` from day one. If we lose the teachers, nothing downstream has data. |
| R2 | **Dirty migrated data** poisons the launch — duplicate students, wrong balances. | **High** | **High** | Dry-run migration, reconcile to the rupee, run the deduplication pass before go-live. Budget 2 full weeks. It always takes 2 full weeks. |
| R3 | **Double-charging parents** via duplicate webhook delivery. | Medium | **Critical** | Idempotency keys + a unique constraint on `gateway_txn_id` ([FR-408](#54-fees--billing-fr-4xx)). Test with deliberately replayed webhooks in CI. |
| R4 | **Silent event loss** — an invoice never gets created because a handler failed and nobody noticed. | Medium | **Critical** | Dead-letter queue with alerting ([FR-804](#58-cross-module-contracts-fr-8xx)). A DLQ with items in it is a page, not a dashboard tile. |
| R5 | **A finalized grade is altered** without a trace. | Low | **Critical** | Append-only versioned marks ([FR-707](#57-examinations--grading-fr-7xx)). No update permission exists in any role. Enforce in the database, not the service layer. |
| R6 | **Results-day traffic** takes the system down at the worst possible moment. | Medium | High | Load-test to 2× peak. Read replica for portals. Cache published results aggressively — they're immutable. Publish in cohorts if needed. |
| R7 | **Scope creep** — "can it also do the LMS?" | **High** | Medium | The [non-goals list](#22-non-goals-explicitly-out-of-scope-for-v1) exists precisely to be pointed at. Every phase must ship before the next begins. |
| R8 | **The modular monolith degenerates** into a tangle of cross-module imports. | Medium | High | Lint rule blocking cross-module service imports ([FR-801](#58-cross-module-contracts-fr-8xx)). It fails the build. Not a code review comment — a build failure. |
| R9 | **Multi-tenancy retrofitted later.** | Low | **Critical** | `tenant_id` + RLS from the very first migration, even with one tenant. Retrofitting this is a rewrite. |
| R10 | **Accountant refuses to trust the ledger** and keeps a parallel spreadsheet. | Medium | High | Full drill-down from every figure ([FR-506](#55-finance--accounting-fr-5xx)). One term of parallel running. Her sign-off is a launch gate. |
| R11 | Payment gateway change forced by pricing or regulation. | Medium | Medium | `PaymentProvider` interface from day one. Never let gateway types leak into the Fees module. |
| R12 | **Key-person dependency** — one developer understands the fee engine. | Medium | High | ADRs in `docs/adr/`. 100% test coverage on financial logic ([NFR-24](#6-non-functional-requirements)) doubles as executable documentation. |

### The two risks that actually matter

Everything above is real, but **R1 and R2** are the ones that kill ERP projects. Technical risks have technical fixes. R1 is a design problem disguised as an adoption problem, and R2 is a boring, unglamorous data problem that teams consistently under-budget by a factor of three.

Allocate accordingly.

---

## 15. Open Questions

| # | Question | Owner | Needed by | Blocks |
|---|---|---|---|---|
| Q1 | Single institution, or multi-tenant SaaS from launch? | Product | **Before first migration** | Determines whether RLS ships in migration 001. Answering this late is a rewrite. |
| Q2 | Which payment gateway(s), and in which markets? | Finance | Phase 2 start | The `PaymentProvider` interface absorbs this, but currency and minor-unit handling depend on it. |
| Q3 | Day-wise or period-wise attendance? Both? | Academic head | Phase 3 design | Changes the attendance data model and the teacher UX. |
| Q4 | Exact grade scale and GPA formula. Any moderation policy? | Academic head | Phase 3 design | Grade computation is 100%-coverage code. It must be right the first time. |
| Q5 | Does exam eligibility depend on fees, attendance, both, or neither? | Principal | Phase 3 design | Determines whether Examinations subscribes to `payment.received`. |
| Q6 | How many years of historical data must be migrated? | Registrar | **Before migration planning** | Directly scales R2. Three years is very different from fifteen. |
| Q7 | Statutory payroll deductions and filing formats for the target jurisdiction. | Finance | Phase 4 | Tax logic is jurisdiction-specific and cannot be guessed. |
| Q8 | Required languages at launch. Any RTL? | Product | Phase 1 | i18n is cheap on day one and expensive on day two hundred. |
| Q9 | Is a native mobile app truly required, or is a PWA sufficient for parents? | Product | Phase 5 | Halves or doubles Phase 5. |
| Q10 | Data residency requirements. | Legal | **Before infrastructure provisioning** | Determines hosting region and whether the architecture must support per-tenant regions. |

> **Q1, Q6, and Q10 must be answered before any code is written.** The rest can be answered during their phase. Each of those three, answered late, is a rewrite rather than a change.

---

## 16. Appendix: Glossary

| Term | Meaning |
|---|---|
| **Academic Year** | The top-level time container. E.g. 2026–2027. Everything academic is scoped to one. |
| **Term / Semester** | A subdivision of an academic year. Billing and grading cycles align to it. |
| **Enrollment** | The row linking one student to one section for one term. **The pivot of the academic system.** |
| **Section** | A specific delivery of a course: a teacher, a room, a timetable, a roster. |
| **Curriculum** | The versioned rulebook of which courses a program requires. |
| **Fee Head** | A single named charge. Tuition, Bus Fee, Late Fine. |
| **Fee Structure** | Fee heads + amounts, bound to a program and a year. |
| **Fee Plan** | The instalment schedule and due dates. |
| **Invoice** | What one student owes right now. **The pivot of the financial system.** |
| **Chart of Accounts** | The tree of accounts that money is classified into. |
| **Journal Entry** | A balanced set of debits and credits recording one financial event. |
| **General Ledger** | The permanent, append-only record of all journal entries. The only place money is true. |
| **Double-entry** | Every transaction touches ≥ 2 accounts; debits must equal credits. |
| **Trial Balance** | A report asserting that total debits equal total credits. If it fails, something is broken. |
| **Period Close** | Freezing an accounting period so nothing can post into it. |
| **Event** | An announcement that something happened. Modules subscribe; the emitter knows nothing of them. |
| **Idempotent** | Safe to run twice with the same input, producing the same result. |
| **Soft delete** | Setting `deleted_at` instead of removing the row. |
| **RLS** | Row-Level Security. PostgreSQL enforcing tenant isolation at the database, not the application. |
| **Modular monolith** | One deployable unit, strictly internally partitioned — so it *can* be split into services, but isn't yet. |
| **BFF** | Backend-for-frontend. A thin proxy layer shaping API responses for one client. Holds no business logic. |
| **DLQ** | Dead-letter queue. Where events go after retries are exhausted. Must be monitored. |
| **RPO / RTO** | How much data you can lose / how long you can be down. |

---

## Document control

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-07-10 | Product | Initial draft |

**Review required from:** Engineering Lead · Academic Head · Finance · Registrar

**Next action:** answer [Q1, Q6, Q10](#15-open-questions) before Phase 1 development begins.
