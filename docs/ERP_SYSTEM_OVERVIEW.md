# Student Management ERP — System Overview

> **Purpose of this document:** Explain, in plain language, what this ERP system does, what each module is responsible for, and — most importantly — **how the modules connect to each other**. If you read only one document before touching the code, read this one.

---

## Table of Contents

1. [What is this system, really?](#1-what-is-this-system-really)
2. [The Core Mental Model: Three Spines](#2-the-core-mental-model-three-spines)
3. [The Module Map](#3-the-module-map)
4. [How the Modules Link Together](#4-how-the-modules-link-together)
5. [Module-by-Module Breakdown](#5-module-by-module-breakdown)
6. [The Event Backbone](#6-the-event-backbone)
7. [Key Data Relationships](#7-key-data-relationships)
8. [Walkthroughs: A Day in the Life](#8-walkthroughs-a-day-in-the-life)
9. [Cross-Cutting Concerns](#9-cross-cutting-concerns)
10. [Tech Stack](#10-tech-stack)

---

## 1. What is this system, really?

An ERP (Enterprise Resource Planning) system is **one shared brain for an entire organization**.

Without an ERP, a school or college typically runs on scattered tools: admissions in a spreadsheet, attendance in a notebook, fees in accounting software, exam marks in another spreadsheet, and library records in a desktop app. Nothing talks to anything else. When a parent asks "why does my daughter's report card say she has unpaid fees?", three different people check three different systems and give three different answers.

**An ERP fixes this by making every module write to the same database and speak the same language.**

### The simple analogy

Think of the ERP as a **hospital**:

| Hospital | Our ERP |
|---|---|
| Patient file (one per person, follows them everywhere) | **Student record** |
| Departments (cardiology, radiology, pharmacy) | **Modules** (Academics, Fees, Library) |
| Every department writes into the same patient file | Every module writes to the same database |
| Billing pulls from every department automatically | **Finance** pulls charges from every module |
| Doctor sees full history in one screen | Admin sees the full student 360° view |

The critical property is: **you enter data once, and everyone who needs it sees it instantly.**

### What this system does concretely

- Turns an inquiry from a prospective parent into an enrolled student
- Places that student into a program, a batch, and a class timetable
- Tracks their attendance every day
- Records their exam marks and computes their grades and transcript
- Generates their fee invoice, accepts payment, and posts it to the accounting ledger
- Lets them borrow library books, ride the school bus, and live in the hostel — each generating charges that flow back into the same invoice
- Pays the teachers who taught them
- Shows the principal a single dashboard where all of this is visible

---

## 2. The Core Mental Model: Three Spines

Almost every confusing question in an ERP ("where should this data live?", "which module owns this?") becomes easy once you understand that the system is built around **three spines**. A spine is a backbone that everything else attaches to.

```
                    ┌─────────────────────────────────┐
                    │      THE THREE SPINES           │
                    └─────────────────────────────────┘

   PEOPLE SPINE            TIME SPINE              MONEY SPINE
        │                       │                       │
   ┌────┴────┐            ┌─────┴─────┐           ┌────┴────┐
   │ Person  │            │ Academic  │           │ General │
   │ (one    │            │   Year    │           │ Ledger  │
   │ record) │            └─────┬─────┘           └────┬────┘
   └────┬────┘                  │                      │
        │                  ┌────┴────┐                 │
   ┌────┴──────┐           │  Term   │            ┌────┴─────┐
   │ Student   │           │ /Semester│           │ Every    │
   │ Staff     │           └────┬────┘            │ rupiah,  │
   │ Guardian  │                │                 │ dollar,  │
   │ Vendor    │           ┌────┴────┐            │ or rupee │
   └───────────┘           │  Week   │            │ lands    │
                           │  Day    │            │ here.    │
                           │  Period │            └──────────┘
                           └─────────┘
```

### Spine 1 — The People Spine

**Rule: one human being = exactly one `Person` record. Forever.**

A person can wear many hats. A teacher's son might be a student. A former student might come back as staff. A parent might also be a vendor supplying uniforms.

If you create a separate record for each role, you will eventually have four rows for the same human, and reconciling them is a nightmare that never ends.

So instead:

```
Person (name, DOB, email, phone, photo, national ID)
   │
   ├──▶ StudentProfile   (admission no, batch, program)
   ├──▶ StaffProfile     (employee no, department, salary grade)
   ├──▶ GuardianProfile  (relationship to student, is_primary_contact)
   └──▶ VendorContact    (company, tax ID)
```

A `Person` has zero or more **role profiles** attached. Contact details, identity, and documents live once, on the `Person`. Role-specific data lives on the profile.

### Spine 2 — The Time Spine

**Rule: nothing academic exists outside of a time period.**

A student is not simply "in Grade 10". They are **in Grade 10 during Academic Year 2026–2027**. A fee is not "5,000". It is "5,000 for Term 1 of AY 2026–2027". A timetable is not "Math on Monday". It is "Math on Monday during Term 2".

The hierarchy:

```
Academic Year (2026-2027)
   └── Term / Semester (Term 1: Aug–Dec)
         └── Week
               └── Day
                     └── Period / Time Slot (09:00–09:45)
```

Every academic record — enrollment, attendance, grades, fee assignment, timetable — carries an `academic_year_id` and usually a `term_id`. This is what makes the system able to answer "show me last year's results" without any special code.

**Why this matters:** when a year rolls over, you don't delete anything. You create a new Academic Year and promote students into it. Last year's data stays intact and queryable forever. This is how transcripts work.

### Spine 3 — The Money Spine

**Rule: every single financial event, from every module, ends up as a journal entry in the General Ledger.**

The Library charges a late fee. The Transport module bills a bus route. The Hostel bills a room. The Academics module bills tuition. HR pays a salary.

None of these modules do their own accounting. They all emit a financial event, and the **Finance module** translates it into a double-entry journal record.

```
   Library fine ──┐
   Bus fee ───────┤
   Hostel fee ────┼──▶  Finance Module  ──▶  Invoice  ──▶  Payment  ──▶  General Ledger
   Tuition ───────┤        (the only          (what        (what        (the permanent,
   Exam fee ──────┤         module that        they         they         auditable
   Payroll ───────┘         does math on       owe)         paid)        record)
                            money)
```

**Why this matters:** the accountant should never have to ask "did the library fines get counted?" There is exactly one place where money is truthful, and it is the ledger. Everything else is a view of it.

---

## 3. The Module Map

Modules are grouped into four layers. Higher layers depend on lower layers — **never the reverse**.

```
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 4 — EXPERIENCE                                                  │
│  Dashboards · Reports & Analytics · Student Portal · Parent Portal     │
│  Teacher Portal · Notifications                                        │
└────────────────────────────────────────────────────────────────────────┘
                                   ▲  reads from everything below
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 3 — OPERATIONS (the day-to-day work)                            │
│  Attendance · Examinations & Grading · Timetable · Library ·           │
│  Hostel · Transport · Inventory & Procurement · Discipline             │
└────────────────────────────────────────────────────────────────────────┘
                                   ▲
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 2 — CORE BUSINESS                                               │
│  Admissions · Student Information (SIS) · Academics & Curriculum ·     │
│  Fees & Billing · Finance & Accounting · Human Resources & Payroll     │
└────────────────────────────────────────────────────────────────────────┘
                                   ▲
┌────────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — FOUNDATION (everything depends on this)                     │
│  Identity & Access (Auth/RBAC) · Organization Setup · Person Registry  │
│  Academic Calendar · Documents · Audit Log · Settings                  │
└────────────────────────────────────────────────────────────────────────┘
```

### One-line purpose of every module

| # | Module | Layer | What it exists to do |
|---|---|---|---|
| 1 | **Identity & Access** | Foundation | Decide who can log in and what they're allowed to touch |
| 2 | **Organization Setup** | Foundation | Define the institution: campuses, buildings, departments, rooms |
| 3 | **Person Registry** | Foundation | Hold the one-and-only record of each human being |
| 4 | **Academic Calendar** | Foundation | Define years, terms, holidays, working days |
| 5 | **Documents** | Foundation | Store and version every uploaded file, linked to a person or record |
| 6 | **Audit Log** | Foundation | Record who changed what, when, and from where |
| 7 | **Admissions** | Core | Convert an inquiry into an admitted student |
| 8 | **Student Information (SIS)** | Core | Own the student's profile, guardians, and lifecycle status |
| 9 | **Academics & Curriculum** | Core | Define programs, courses, credits, batches, and sections |
| 10 | **Fees & Billing** | Core | Decide what each student owes and issue invoices |
| 11 | **Finance & Accounting** | Core | Record every transaction in a double-entry ledger |
| 12 | **HR & Payroll** | Core | Manage staff, contracts, leave, and salaries |
| 13 | **Timetable** | Operations | Assign teacher + subject + room + time slot without clashes |
| 14 | **Attendance** | Operations | Record who was present, for students and staff |
| 15 | **Examinations & Grading** | Operations | Schedule exams, capture marks, compute grades and transcripts |
| 16 | **Library** | Operations | Track the catalogue, issues, returns, and fines |
| 17 | **Hostel** | Operations | Allocate rooms and beds, track occupancy |
| 18 | **Transport** | Operations | Manage routes, stops, vehicles, and student assignments |
| 19 | **Inventory & Procurement** | Operations | Track assets, supplies, purchase orders, and vendors |
| 20 | **Discipline** | Operations | Log incidents, warnings, and resolutions |
| 21 | **Notifications** | Experience | Deliver messages via email, SMS, push, and in-app |
| 22 | **Reports & Analytics** | Experience | Turn the data into decisions |
| 23 | **Portals** | Experience | Give students, parents, and teachers their own view |

---

## 4. How the Modules Link Together

This is the heart of the document. Modules link in **three distinct ways**, and it's important not to confuse them.

### Link Type A — Reference links (a hard pointer)

One module stores a foreign key to another module's record. This is the most common link.

> Example: an `Enrollment` row stores `student_id`, `section_id`, and `academic_year_id`. It literally points at rows owned by SIS, Academics, and the Calendar.

**Rule:** you may only point *downward or sideways* in the layer stack. Attendance may point at Student. Student may **not** point at Attendance.

### Link Type B — Event links (a soft announcement)

One module finishes something and **announces it**. Other modules listen and react. The announcer does not know or care who is listening.

> Example: Admissions announces `student.admitted`. Fees hears it and creates an invoice. Identity hears it and creates a login. Notifications hears it and sends a welcome email. Admissions knows nothing about any of them.

**Rule:** this is how you cross layers *upward*, and how you avoid a tangled web where every module imports every other module.

### Link Type C — Query links (a read-only view)

A module reads another module's data purely to display or compute, and never writes to it.

> Example: the report card generator reads Attendance, Grades, and Fees — but writes to none of them.

---

### The Master Linkage Diagram

```
                            ┌──────────────┐
                            │  ADMISSIONS  │
                            └──────┬───────┘
                     emits `student.admitted`
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
      ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
      │     SIS      │   │ IDENTITY/ACCESS  │   │NOTIFICATIONS │
      │ creates the  │   │ creates login    │   │ welcome mail │
      │ student rec. │   │ + assigns role   │   └──────────────┘
      └──────┬───────┘   └──────────────────┘
             │
      emits `student.enrolled`
             │
   ┌─────────┼──────────────────────────────┐
   ▼         ▼                              ▼
┌────────────────┐              ┌──────────────────────┐
│   ACADEMICS    │              │    FEES & BILLING    │
│ places student │              │ looks up fee plan    │
│ into a Section │              │ for that program     │
└───────┬────────┘              │ + generates Invoice  │
        │                       └──────────┬───────────┘
        │ Section drives:                  │ emits `invoice.issued`
        │                                  ▼
        ├──▶ TIMETABLE  ──────▶  ┌──────────────────────┐
        │    (who teaches        │ FINANCE & ACCOUNTING │
        │     what, when)        │ Dr Accounts Receiv.  │
        │         │              │ Cr Fee Income        │
        │         ▼              └──────────▲───────────┘
        ├──▶ ATTENDANCE                     │
        │    (per period,                   │ every module's money
        │     per student)                  │ event lands here
        │         │                         │
        │         │             ┌───────────┴─────────────┐
        ├──▶ EXAMINATIONS       │                         │
        │    (marks → grades)   │   LIBRARY (fines)       │
        │         │             │   TRANSPORT (bus fee)   │
        │         │             │   HOSTEL (room fee)     │
        │         │             │   HR/PAYROLL (salaries) │
        │         │             │   PROCUREMENT (bills)   │
        │         │             └─────────────────────────┘
        │         ▼
        │  ┌──────────────┐
        └─▶│  TRANSCRIPT  │◀── reads Attendance + Grades + Enrollment
           │  REPORT CARD │◀── reads Fees (to show dues / block release)
           └──────────────┘
                   │
                   ▼
           ┌──────────────────────────────────────┐
           │  PORTALS + REPORTS + DASHBOARDS      │
           │  (read-only across everything)       │
           └──────────────────────────────────────┘
```

### The single most important linkage to understand

Look at the diagram again and notice this chain:

```
Student ──▶ Enrollment ──▶ Section ──▶ Timetable Slot ──▶ Attendance Record
                 │                           │
                 │                           └──▶ Teacher (Staff)
                 └──▶ Course ──▶ Exam ──▶ Mark ──▶ Grade ──▶ Transcript
```

**`Enrollment` is the pivot of the entire academic side.** It is the row that says "this student, in this section, for this course, during this term." Attendance can't exist without it. Grades can't exist without it. Fees are computed from it.

And on the money side:

```
Any Charge ──▶ Invoice Line ──▶ Invoice ──▶ Payment ──▶ Journal Entry ──▶ Ledger
```

**`Invoice` is the pivot of the entire financial side.** Everything a student owes, from any module, becomes a line on an invoice. Nothing bypasses it.

Learn these two chains and you understand 80% of the system.

---

## 5. Module-by-Module Breakdown

For each module: **what it owns** (writes), **what it reads**, and **what it announces** (events).

---

### 5.1 Identity & Access

| | |
|---|---|
| **Owns** | Users, credentials, sessions, roles, permissions, API keys |
| **Reads** | `Person` (to link a login to a human) |
| **Emits** | `user.created`, `user.login`, `user.role_changed`, `user.deactivated` |
| **Listens to** | `student.admitted` (create student login), `staff.hired` (create staff login), `student.graduated` (downgrade to alumni role) |

**How it works in simple terms:** every login is a `User` attached to exactly one `Person`. A `User` holds one or more `Roles` (Admin, Principal, Teacher, Accountant, Student, Parent, Librarian). Each `Role` holds a bag of `Permissions` shaped like `resource:action:scope`, for example `grade:write:own_sections`.

The `scope` part is what makes it real. A teacher can write grades — but only for sections they teach. A parent can read attendance — but only for their own children. This is enforced in one shared policy layer, not re-implemented in every module.

---

### 5.2 Organization Setup

| | |
|---|---|
| **Owns** | Institution, campuses, buildings, rooms, departments, designations |
| **Reads** | Nothing |
| **Emits** | `room.created`, `department.created` |

**Links:** Rooms are consumed by **Timetable** (classrooms), **Examinations** (exam halls), and **Hostel** (dorm rooms). Departments are consumed by **HR** (staff assignment) and **Academics** (which department owns a course).

---

### 5.3 Person Registry

| | |
|---|---|
| **Owns** | `Person`, addresses, contact numbers, emergency contacts, identity documents |
| **Reads** | Nothing |
| **Emits** | `person.created`, `person.contact_updated` |

**Links:** This is the trunk of the People Spine. `StudentProfile`, `StaffProfile`, `GuardianProfile`, and `VendorContact` all hang off it via `person_id`.

> **A concrete payoff:** when a parent changes their phone number, they change it once. The SMS module, the emergency-contact list, the fee-reminder job, and the parent portal all pick it up instantly. There is no "sync" step, because there was never a copy.

---

### 5.4 Academic Calendar

| | |
|---|---|
| **Owns** | Academic years, terms/semesters, holidays, working-day rules, period/bell schedule |
| **Reads** | Nothing |
| **Emits** | `academic_year.opened`, `academic_year.closed`, `term.started`, `term.ended` |

**Links:** This is the Time Spine. Nearly every operational table carries `academic_year_id`. **Attendance** consults the holiday calendar to decide which days require marking. **Fees** uses `term.started` to trigger the next billing cycle. **Examinations** schedules within term boundaries.

---

### 5.5 Admissions

| | |
|---|---|
| **Owns** | Inquiries, applications, entrance test scores, application status, offer letters, seat confirmations |
| **Reads** | Academics (available programs and seat counts), Calendar (which year they're applying for) |
| **Emits** | `application.submitted`, `application.shortlisted`, `offer.issued`, **`student.admitted`** |

**How it works:** an inquiry becomes an application. The application is screened, possibly tested and interviewed, then either rejected or given an offer. When the applicant accepts the offer and pays the admission deposit, the module emits `student.admitted` — and that single event kicks off the rest of the system.

**This is the system's front door.** Before this event, the person is a *prospect*. After it, they are a *student*, and every downstream module now has a reason to care about them.

---

### 5.6 Student Information System (SIS)

| | |
|---|---|
| **Owns** | `StudentProfile`, admission number, guardian links, student lifecycle status, promotions, transfers, alumni records |
| **Reads** | Person Registry, Academics, Calendar |
| **Emits** | **`student.enrolled`**, `student.promoted`, `student.transferred`, `student.suspended`, `student.graduated` |
| **Listens to** | `student.admitted` |

**Lifecycle states** — a student is always in exactly one:

```
  Admitted ──▶ Enrolled ──▶ Active ──┬──▶ Promoted ──▶ (Active, next year)
                                      ├──▶ Suspended ──▶ Active | Withdrawn
                                      ├──▶ Withdrawn (left voluntarily)
                                      └──▶ Graduated ──▶ Alumni
```

**Why lifecycle status is a big deal:** it is the master switch for almost every other module. A `Withdrawn` student should not be billed, should not appear on attendance sheets, should not be able to borrow library books, and should lose portal access — but their transcript and financial history must remain permanently intact and queryable.

You get all of this for free if modules check `student.status` instead of deleting rows. **Never delete a student. Change their status.**

---

### 5.7 Academics & Curriculum

| | |
|---|---|
| **Owns** | Programs, courses/subjects, credit hours, prerequisites, curriculum versions, batches, sections, `Enrollment` |
| **Reads** | Calendar, Organization (departments), HR (teachers) |
| **Emits** | `course.created`, `section.created`, `enrollment.created`, `curriculum.published` |

**The structure, from big to small:**

```
Program            "Bachelor of Commerce" / "Grade 10"
  └── Curriculum   the rulebook: which courses, how many credits, what order
        └── Course "Accounting I" (4 credits, dept: Commerce)
              └── Section  "Accounting I — Section B" (max 40 students, Mr. Patel, Room 204)
                    └── Enrollment  "Student #4471 is in this section, Term 1, AY 2026-27"
```

**`Enrollment` is the most important row in the academic system.** It is where the People Spine, the Time Spine, and the curriculum all meet. Attendance, grades, and fee calculation every one of them start from an `Enrollment`.

---

### 5.8 Fees & Billing

| | |
|---|---|
| **Owns** | Fee heads, fee structures, fee plans, discounts, scholarships, `Invoice`, `InvoiceLine`, `Payment`, receipts, refunds |
| **Reads** | SIS (who to bill), Academics (what program → which fee plan), and charges emitted by Library/Transport/Hostel/Exams |
| **Emits** | **`invoice.issued`**, **`payment.received`**, `payment.failed`, `invoice.overdue`, `refund.processed` |
| **Listens to** | `student.enrolled`, `term.started`, `book.overdue`, `transport.assigned`, `hostel.allocated`, `exam.registered` |

**The vocabulary, kept simple:**

- **Fee Head** — a single named charge. "Tuition". "Library Fee". "Bus Fee". "Late Fine".
- **Fee Structure** — a set of fee heads with amounts, attached to a program and a year. "B.Com AY 2026-27: Tuition 40,000 + Lab 5,000 + Library 2,000."
- **Fee Plan** — the schedule of *when* it's due. "50% at Term 1 start, 50% at Term 2 start."
- **Invoice** — what one specific student owes right now. Built from the structure and the plan.
- **Payment** — money actually received, matched against an invoice.

**How other modules bill a student:** they do **not** touch the invoice table. They emit an event with a fee head and an amount. Fees & Billing decides how to apply it — as a new invoice line, a new invoice, or a credit note.

```
Library:   "book.overdue"      → { student_id, fee_head: LATE_FINE,  amount: 50 }
Transport: "transport.assigned"→ { student_id, fee_head: BUS_FEE,    amount: 8000 }
Hostel:    "hostel.allocated"  → { student_id, fee_head: HOSTEL_FEE, amount: 30000 }
                                          │
                                          ▼
                              Fees & Billing appends invoice lines
```

This is why the parent gets **one bill**, not four.

---

### 5.9 Finance & Accounting

| | |
|---|---|
| **Owns** | Chart of accounts, journal entries, ledgers, trial balance, P&L, balance sheet, bank accounts, reconciliation, budgets |
| **Reads** | Every financial event in the system |
| **Emits** | `journal.posted`, `period.closed` |
| **Listens to** | `invoice.issued`, `payment.received`, `refund.processed`, `payroll.processed`, `purchase.received`, `asset.depreciated` |

**Double-entry, explained in one breath:** every transaction touches at least two accounts, and debits must equal credits. This isn't bureaucracy — it's a self-checking mechanism. If the books don't balance, you know something is wrong before it reaches a regulator.

**Worked example — a student pays 20,000 tuition:**

```
Step 1 — Invoice is issued (the student now owes us)
   Dr  Accounts Receivable       20,000
       Cr  Tuition Fee Income            20,000

Step 2 — Student pays by bank transfer
   Dr  Bank Account              20,000
       Cr  Accounts Receivable           20,000

Net result: Bank +20,000, Income +20,000, Receivable back to 0. Balanced.
```

**The rule that keeps this module sane:** Finance **never initiates** a business action. It only *records* what other modules did. It is the system's memory, not its will.

**Period closing** is the one thing Finance imposes on everyone: once an accounting period is closed, no module may post a transaction dated inside it. Late charges go to the next open period.

---

### 5.10 HR & Payroll

| | |
|---|---|
| **Owns** | `StaffProfile`, contracts, designations, leave types, leave balances, leave requests, salary components, payslips |
| **Reads** | Person Registry, Organization (departments), Attendance (staff attendance for LOP calculation) |
| **Emits** | **`staff.hired`**, `staff.terminated`, `leave.approved`, **`payroll.processed`** |

**Links:**
- → **Identity**: `staff.hired` creates a login with the Teacher/Accountant role.
- → **Academics**: a `Staff` member is assigned as the teacher of a `Section`.
- → **Timetable**: teacher availability and max weekly load constrain the scheduler.
- → **Attendance**: staff attendance and approved leave feed *Loss of Pay* in payroll.
- → **Finance**: `payroll.processed` posts `Dr Salary Expense / Cr Bank + Cr Tax Payable`.

---

### 5.11 Timetable

| | |
|---|---|
| **Owns** | Time slots, the schedule grid, substitutions |
| **Reads** | Academics (sections + courses), HR (teachers + availability), Organization (rooms), Calendar (working days) |
| **Emits** | `timetable.published`, `substitution.assigned` |

**What it actually solves:** it assigns a unique combination of `(Section, Course, Teacher, Room, Day, Period)` such that no teacher, room, or section is double-booked.

The three hard constraints:

1. A **teacher** cannot be in two rooms in the same period.
2. A **room** cannot hold two sections in the same period.
3. A **section** cannot attend two courses in the same period.

**Downstream:** a published timetable is what generates the *empty* attendance registers each morning. No timetable, no attendance.

---

### 5.12 Attendance

| | |
|---|---|
| **Owns** | Attendance records (per student, per period or per day), leave applications, attendance percentage snapshots |
| **Reads** | Timetable (what classes exist today), Enrollment (who should be in them), Calendar (is today a holiday?) |
| **Emits** | `attendance.marked`, `attendance.below_threshold` |

**The daily flow:**

```
06:00  Scheduled job reads Calendar. Is today a working day? Yes.
06:01  Job reads today's Timetable → 47 periods across 12 sections.
06:02  Job reads Enrollment → generates blank registers with the right students.
09:15  Mr. Patel opens his phone, marks Section B. Emits `attendance.marked`.
17:00  Job recomputes attendance %. Student #4471 drops to 71%.
17:01  Emits `attendance.below_threshold`.
17:02  Notifications hears it → SMS to parent.
17:02  Examinations hears it → flags student as exam-ineligible (<75% rule).
```

Notice that Attendance itself sends no SMS and blocks no exam. It just states a fact. Other modules decide what that fact means to them. **This is the event backbone doing its job.**

---

### 5.13 Examinations & Grading

| | |
|---|---|
| **Owns** | Exam definitions, exam schedules, seating plans, marks, grade scales, GPA/CGPA, report cards, transcripts, re-evaluation requests |
| **Reads** | Enrollment (who sits which exam), Attendance (eligibility), Fees (dues blocking), Organization (halls) |
| **Emits** | `exam.scheduled`, `marks.entered`, **`grade.finalized`**, `result.published`, `exam.registered` |

**The pipeline:**

```
Exam defined  →  Students registered  →  Eligibility check  →  Seating plan
                                              │
                        ┌─────────────────────┴──────────────────────┐
                        │  Attendance ≥ 75%?  Fees cleared?          │
                        │  No → blocked, with a reason the           │
                        │       student can see in their portal      │
                        └─────────────────────┬──────────────────────┘
                                              ▼
        Exam conducted → Marks entered → Moderated → Grades computed
                                              │
                                              ▼
                        `grade.finalized` (immutable from here)
                                              │
                        ┌─────────────────────┴─────────────────────┐
                        ▼                                           ▼
                  Report Card                                  Transcript
              (one term, detailed)                    (whole degree, official)
```

**The immutability rule:** once `grade.finalized` fires, the mark is frozen. Corrections do not overwrite it — they create a **new versioned record** with a reason and an approver. A transcript is a legal document; you must always be able to prove what it said on any given date, and who changed it.

---

### 5.14 Library

| | |
|---|---|
| **Owns** | Catalogue, copies, issues, returns, reservations, fines |
| **Reads** | SIS (is this student active?), HR (is this staff active?) |
| **Emits** | `book.issued`, `book.returned`, **`book.overdue`** → picked up by Fees |

**Link:** the borrowing limit is derived from the borrower's role and status. A `Withdrawn` student cannot borrow. An overdue book emits a fine event; **Library never touches the invoice table.**

---

### 5.15 Hostel

| | |
|---|---|
| **Owns** | Blocks, rooms, beds, allocations, occupancy, mess plans, visitor logs |
| **Reads** | SIS, Organization (buildings) |
| **Emits** | **`hostel.allocated`** → Fees, `hostel.vacated` |

---

### 5.16 Transport

| | |
|---|---|
| **Owns** | Vehicles, drivers, routes, stops, student route assignments, GPS pings |
| **Reads** | SIS, HR (drivers are staff), Person (home address → nearest stop) |
| **Emits** | **`transport.assigned`** → Fees, `vehicle.departed`, `student.boarded` |

---

### 5.17 Inventory & Procurement

| | |
|---|---|
| **Owns** | Items, stock levels, warehouses, purchase requisitions, purchase orders, goods receipts, vendors, vendor bills, assets, depreciation |
| **Reads** | Organization (which department requested), Finance (budget availability) |
| **Emits** | `po.approved`, **`purchase.received`** → Finance, `stock.low`, `asset.depreciated` |

**The procure-to-pay chain** — the mirror image of the student billing chain:

```
Requisition ──▶ Purchase Order ──▶ Goods Receipt ──▶ Vendor Bill ──▶ Payment ──▶ Ledger
 (I need it)     (approved to buy)   (it arrived)     (they billed)   (we paid)
```

---

### 5.18 Notifications

| | |
|---|---|
| **Owns** | Templates, delivery channels, send queue, delivery receipts, user preferences |
| **Reads** | Person (contact details), Identity (preferences) |
| **Listens to** | Almost every event in the system |

**Design note:** no module ever calls "send an email" directly. Modules emit facts. Notifications subscribes to facts and decides — based on templates and user preferences — whether that fact deserves an SMS, an email, a push, or silence.

This means adding a new alert is a config change, not a code change in six modules.

---

### 5.19 Reports & Analytics

| | |
|---|---|
| **Owns** | Report definitions, saved queries, scheduled report runs, dashboard layouts |
| **Reads** | **Everything.** Writes **nothing.** |

Strictly read-only, ideally against a **read replica** so a heavy year-end report never slows down a teacher marking attendance on their phone.

---

## 6. The Event Backbone

Here is the full list of the events that hold the system together. If you understand this table, you understand the system's nervous system.

| Event | Emitted by | Consumed by | What happens |
|---|---|---|---|
| `student.admitted` | Admissions | SIS, Identity, Notifications | Student record + login created, welcome email sent |
| `student.enrolled` | SIS | Academics, Fees, Library, Transport | Section assigned, first invoice generated, borrowing enabled |
| `student.graduated` | SIS | Identity, Fees, Library, Hostel | Role → Alumni, final settlement, clearances checked |
| `term.started` | Calendar | Fees, Timetable, Attendance | Next billing cycle, timetable activated, registers begin |
| `invoice.issued` | Fees | Finance, Notifications | `Dr Receivable / Cr Income`, bill emailed to parent |
| `payment.received` | Fees | Finance, Notifications, Examinations | `Dr Bank / Cr Receivable`, receipt sent, exam block lifted |
| `attendance.marked` | Attendance | Analytics | Percentages recomputed |
| `attendance.below_threshold` | Attendance | Notifications, Examinations | Parent alerted, exam eligibility flagged |
| `book.overdue` | Library | Fees, Notifications | Fine added to next invoice, reminder sent |
| `transport.assigned` | Transport | Fees | Bus fee added to invoice |
| `hostel.allocated` | Hostel | Fees | Room fee added to invoice |
| `grade.finalized` | Examinations | SIS, Notifications, Analytics | Transcript updated, result published |
| `staff.hired` | HR | Identity, Notifications | Login created with correct role |
| `payroll.processed` | HR | Finance | `Dr Salary Expense / Cr Bank + Tax Payable` |
| `purchase.received` | Procurement | Finance, Inventory | `Dr Inventory / Cr Accounts Payable`, stock incremented |

### Why events instead of direct calls?

Consider what happens **without** events. Admissions would need to import and call SIS, Identity, Fees, Library, Transport, and Notifications. Six dependencies. Add a seventh module next year and you edit Admissions again.

With events, Admissions says `student.admitted` into the void. It has **zero** dependencies on those modules. The seventh module simply subscribes. Admissions never changes.

```
       WITHOUT EVENTS (fragile)           WITH EVENTS (resilient)

         ┌────────────┐                     ┌────────────┐
         │ Admissions │                     │ Admissions │
         └──┬─┬─┬─┬─┬─┘                     └──────┬─────┘
            │ │ │ │ │                              │ emits one event
    ┌───────┘ │ │ │ └────────┐              ┌──────▼──────┐
    ▼         ▼ ▼ ▼          ▼              │  EVENT BUS  │
  SIS   Identity Fees Library Transport     └──┬──┬──┬──┬─┘
                                               │  │  │  │  (they subscribe;
  Admissions must know all 5.                  ▼  ▼  ▼  ▼   Admissions knows none)
  Change one → risk breaking Admissions.     SIS  Id Fees Lib
```

**The one caveat:** events are asynchronous. Do not use them where you need an immediate, transactional guarantee. Creating a student record and creating their login must both succeed or both fail — that's a transaction, not an event. Use events for things that can happen *a second later* without breaking correctness (emails, fee lines, analytics).

---

## 7. Key Data Relationships

The essential tables and how they point at each other. `1──*` means one-to-many.

```
Person 1──* StudentProfile          (a person can be a student)
Person 1──* StaffProfile            (…and later, staff)
Person 1──* GuardianProfile
Person 1──1 User                    (login)
User   *──* Role  *──* Permission

AcademicYear 1──* Term
Program 1──* Curriculum 1──* Course
Course  1──* Section
Section *──1 StaffProfile           (the teacher)
Section *──1 Room

StudentProfile 1──* Enrollment *──1 Section
Enrollment     *──1 AcademicYear
Enrollment     *──1 Term

           ┌── Enrollment is the pivot ──┐
           ▼                             ▼
   AttendanceRecord                    Mark
     *──1 Enrollment                    *──1 Enrollment
     *──1 TimetableSlot                 *──1 Exam
                                        │
                                        ▼
                                      Grade ──▶ Transcript

StudentProfile 1──* Invoice 1──* InvoiceLine *──1 FeeHead
Invoice 1──* Payment
Payment 1──1 JournalEntry 1──* JournalLine *──1 Account
Account *──1 ChartOfAccounts
```

### Three non-negotiable data rules

**1. Soft delete, always.**
Every table has `deleted_at`, `created_at`, `updated_at`, `created_by`, `updated_by`. Nothing is ever hard-deleted. A student who left in 2019 must still resolve on their 2019 transcript in 2035.

**2. Money is never a float.**
Use `DECIMAL(18,2)`, or store integer minor units (cents/paise/sen). `0.1 + 0.2 !== 0.3` in floating point, and an auditor will find that discrepancy.

**3. Every academic row is scoped by year.**
`academic_year_id` on enrollment, attendance, marks, invoices, timetables. Without it, "how many students did we have in 2024?" becomes an unanswerable question.

---

## 8. Walkthroughs: A Day in the Life

Concrete traces through the system. Follow the module names.

### Walkthrough A — A new student joins

```
1.  Parent submits an online inquiry.
      → ADMISSIONS creates Inquiry.

2.  Parent completes the application, uploads birth certificate.
      → ADMISSIONS creates Application.  DOCUMENTS stores the file.

3.  Admin shortlists, schedules entrance test, records the score.
      → ADMISSIONS updates Application.status = SHORTLISTED.

4.  Offer issued. Parent accepts and pays the deposit.
      → ADMISSIONS emits `student.admitted`.

5.  ── The cascade ──
      SIS           creates StudentProfile, assigns admission no. 2026/0447.
      IDENTITY      creates a User with role=Student, and one with role=Parent.
      NOTIFICATIONS emails the welcome pack and portal credentials.
      DOCUMENTS     moves the application files under the new student.

6.  Admin places the student into Grade 10, Section B.
      → ACADEMICS creates Enrollment rows (one per course in the curriculum).
      → SIS emits `student.enrolled`.

7.  ── The second cascade ──
      FEES       reads the Grade-10 fee structure → issues Invoice #INV-2026-0447
                 for 45,000 (Tuition 40,000 + Lab 3,000 + Library 2,000).
                 Emits `invoice.issued`.
      FINANCE    posts:  Dr Accounts Receivable 45,000
                             Cr Tuition Income      40,000
                             Cr Lab Fee Income       3,000
                             Cr Library Fee Income   2,000
      LIBRARY    enables borrowing, limit 3 books.
      NOTIFICATIONS emails the invoice to the parent.

8.  Parent adds bus service at Stop 12.
      → TRANSPORT emits `transport.assigned` { fee_head: BUS_FEE, amount: 8000 }.
      → FEES appends an InvoiceLine to the *existing* invoice. Total now 53,000.
      → FINANCE posts Dr Receivable 8,000 / Cr Transport Income 8,000.

    The parent receives ONE invoice for 53,000, not two bills from two departments.
```

### Walkthrough B — An ordinary Tuesday

```
06:00  CALENDAR    → "Tuesday 12 Aug is a working day."
06:01  ATTENDANCE  → reads TIMETABLE (47 periods), reads ENROLLMENT,
                      generates 47 blank registers.
09:15  Mr. Patel marks Section B on his phone. 2 absent.
       → ATTENDANCE emits `attendance.marked`.
11:00  Student #4471 returns a library book, 4 days late.
       → LIBRARY emits `book.overdue` { fee_head: LATE_FINE, amount: 200 }.
       → FEES appends a line to his next invoice.
17:00  Nightly job recomputes attendance percentages.
       → #4471 is now at 71%. ATTENDANCE emits `attendance.below_threshold`.
17:01  NOTIFICATIONS  → SMS to his parent.
       EXAMINATIONS   → marks him exam-ineligible (policy: ≥75% required).
17:02  He opens the student portal and sees, on one screen:
         • Attendance 71% ⚠ (below the 75% requirement)
         • Outstanding dues: 200 (library fine)
         • Exam status: BLOCKED — reason: attendance below threshold

    Three modules produced that screen. He experiences it as one system.
```

### Walkthrough C — Money moves, end to end

```
Parent pays 53,000 via the payment gateway.

1.  Gateway webhook hits the API.
      → FEES verifies the signature, creates a Payment, matches it to Invoice #0447.
      → FEES emits `payment.received`.

2.  FINANCE posts:
        Dr  Bank Account            53,000
            Cr  Accounts Receivable        53,000
    Receivable is now 0. The student owes nothing.

3.  NOTIFICATIONS emails a PDF receipt.

4.  EXAMINATIONS hears `payment.received`, re-checks the fee block, lifts it.
    (The attendance block, however, stays. Two independent gates.)

5.  At month end, FINANCE runs the trial balance. Debits = Credits.
    The P&L shows 53,000 of income, correctly split across four income accounts,
    with no accountant ever having touched a spreadsheet.
```

---

## 9. Cross-Cutting Concerns

Things every module must respect, and that no module owns alone.

### Multi-tenancy
If the platform ever serves more than one institution, every table needs `tenant_id`, and it must be enforced at the database level with Row-Level Security — **not** by remembering to add `WHERE tenant_id = ?` in every query. Someone will forget. Decide this on day one; retrofitting it is brutal.

### Authorization scope
Permissions are `resource:action:scope`. The scope is evaluated per-request against the user's context (their sections, their children, their department). Implement it once in a shared policy layer. If two modules write their own permission checks, they will disagree, and the disagreement will be a security hole.

### Audit trail
Every write records who, what, when, before-value, after-value, and IP. This is non-negotiable for grades and money. When a mark changes from 45 to 65 the night before results are published, you need to know who did it.

### Idempotency
Payment webhooks fire twice. Event consumers get replayed. Every handler must be safe to run twice with the same input. Use an idempotency key on payments and an event-ID dedupe table on consumers, or you will double-charge a parent.

### Concurrency
Two clerks allocating the last hostel bed. Two teachers marking the same register. Use optimistic locking (a `version` column) on contended rows, and a database unique constraint as the final arbiter. Application-level checks alone always lose the race eventually.

### Time zones
Store every timestamp in UTC. Convert at the presentation layer only. An institution with two campuses in two time zones will otherwise mark attendance on the wrong day, twice a year, forever.

---

## 10. Tech Stack

> This section stands alone. It states what to use, and — more usefully — **why**, and what the alternative costs.

### 10.1 At a glance

| Layer | Choice | Why |
|---|---|---|
| **Language** | TypeScript 5.x (everywhere) | One language across web, API, and scripts. Types shared end-to-end, so a change to the `Student` shape breaks the frontend build instead of production. |
| **Runtime** | Node.js 22 LTS | Long-term support, mature ecosystem, excellent I/O concurrency — exactly right for an ERP, which is I/O-bound, not CPU-bound. |
| **Frontend** | Next.js 15 (App Router) + React 19 | Server Components cut the JS shipped to the browser. Same framework serves the admin console, the parent portal, and the marketing site. |
| **Backend** | NestJS 10 | Modular by design — its module system maps 1:1 onto the ERP modules in this document. Built-in DI, guards (for RBAC), interceptors (for audit), and an event bus. |
| **Database** | PostgreSQL 16 | ACID transactions are non-negotiable when money is involved. Plus RLS for multi-tenancy, JSONB for flexible fields, and window functions for reporting. |
| **ORM** | Prisma 5 | Type-safe queries generated from the schema, first-class migrations, readable relation syntax. |
| **Cache / Queue** | Redis 7 + BullMQ | Sessions, rate limits, and the background jobs that make attendance registers and send fee reminders. |
| **Auth** | Auth.js (or Keycloak at scale) | JWT access + rotating refresh tokens. Keycloak when you need SSO/SAML for a university. |
| **Authorization** | CASL | Expresses `teacher can update Grade where section.teacherId = user.id` as data, not scattered `if` statements. |
| **File storage** | S3-compatible (R2 / MinIO / S3) | Never store PDFs in the database. Store keys; serve via short-lived signed URLs. |
| **Monorepo** | Turborepo + pnpm | Share types, validation schemas, and UI components across apps without publishing packages. |

### 10.2 Frontend detail

| Concern | Library | Note |
|---|---|---|
| UI components | **shadcn/ui** + Radix | You own the code. No fighting a component library's opinions two years in. |
| Styling | **Tailwind CSS** | Fast, consistent, no dead CSS. |
| Server state | **TanStack Query** | Caching, refetch, optimistic updates. Do not put server data in Redux. |
| Client state | **Zustand** | Only for genuinely client-side state (sidebar open, active filters). |
| Data grids | **TanStack Table** | ERPs are 60% tables. Needs virtualization for a 5,000-row fee report. |
| Forms | **React Hook Form** + **Zod** | The Zod schema is shared with the backend. One definition, validated on both sides. |
| Charts | **Recharts** | Sufficient for dashboards. Reach for D3 only when Recharts genuinely can't. |
| Tables → PDF | **React PDF** / Puppeteer | Report cards, invoices, transcripts. |
| i18n | **next-intl** | Assume a second language will be requested. It always is. |

### 10.3 Backend detail

| Concern | Choice | Note |
|---|---|---|
| API style | REST + OpenAPI | Generate the spec from decorators. Third parties (a payment gateway, a government portal) will need it. |
| Internal typing | **tRPC** (optional) | If the web app is the only consumer, tRPC removes the codegen step entirely. |
| Validation | **Zod** | Same schemas as the frontend, via a shared package. |
| Background jobs | **BullMQ** | Nightly attendance %, invoice generation, fee reminders, report exports. |
| Events | NestJS `EventEmitter` → **Redis Streams** / **NATS** | Start in-process. Move to a broker when you split into services. The interface shouldn't change. |
| Search | Postgres FTS → **Meilisearch** | Postgres full-text search is fine to ~1M rows. Don't add infrastructure before you need it. |
| PDF / Excel | Puppeteer, ExcelJS | Every ERP user eventually asks to "export to Excel." |
| Email | **Resend** or SES | Transactional only. |
| SMS / WhatsApp | **Twilio** | Fee reminders and absence alerts. In many regions, WhatsApp beats SMS on delivery. |
| Push | **Firebase Cloud Messaging** | For the parent mobile app. |
| Payments | **Stripe** (global), **Midtrans**/**Xendit** (Indonesia), **Razorpay** (India) | Wrap the gateway behind a `PaymentProvider` interface from day one. You will switch providers. |

### 10.4 Infrastructure & operations

| Concern | Choice | Note |
|---|---|---|
| Containers | **Docker** + Compose (dev) | |
| Hosting (start) | **Railway** / **Render** / **Fly.io** | Do not run Kubernetes for your first 5,000 students. |
| Hosting (scale) | **Kubernetes** (EKS/GKE) | Only when you have someone whose job it is to run it. |
| CDN / Edge | **Cloudflare** | |
| CI/CD | **GitHub Actions** | Lint → typecheck → test → migrate → deploy. Block merge on red. |
| IaC | **Terraform** | Once you have more than a database and a web service. |
| Migrations | **Prisma Migrate** | Every schema change is a reviewed, versioned file. Never hand-edit production. |
| Secrets | **Doppler** / AWS Secrets Manager | Never in `.env` in git. |

### 10.5 Quality & observability

| Concern | Choice | Note |
|---|---|---|
| Unit / integration tests | **Vitest** | Fast. Same config as the frontend. |
| API tests | **Supertest** | Hit real endpoints against a throwaway Postgres in Docker. |
| E2E tests | **Playwright** | Cover the flows that lose money if they break: enroll, invoice, pay, publish results. |
| Load testing | **k6** | Results day is your peak. Test for it before it arrives. |
| Errors | **Sentry** | |
| Tracing | **OpenTelemetry** + Grafana Tempo | When "the fee page is slow", tracing tells you which query. |
| Metrics | Prometheus + Grafana | |
| Logging | **Pino** (structured JSON) | Always log `request_id`, `tenant_id`, `user_id`. |
| Uptime | Better Stack / Pingdom | |

### 10.6 Repository layout

```
erp-system/
├── apps/
│   ├── web/                 # Next.js — admin console + all portals
│   ├── api/                 # NestJS — one folder per ERP module
│   ├── worker/              # BullMQ job processors
│   └── mobile/              # (later) Expo — parent + student app
├── packages/
│   ├── database/            # Prisma schema, migrations, seeds
│   ├── contracts/           # Zod schemas + TS types shared by web & api
│   ├── events/              # Event names + payload types (the backbone)
│   ├── ui/                  # shadcn components
│   ├── auth/                # CASL abilities, JWT helpers
│   └── config/              # eslint, tsconfig, tailwind presets
├── docs/
│   ├── ERP_SYSTEM_OVERVIEW.md   ← this file
│   └── PRD.md
└── infra/                   # Docker, Terraform, k8s manifests
```

The `packages/contracts` and `packages/events` folders are the two that make this stack worth choosing. They are the enforced, compile-time-checked version of everything described in [Section 6](#6-the-event-backbone). If someone renames a field on `Student`, the build fails in every module that depended on it — before it reaches a user.

### 10.7 What we deliberately did *not* choose, and why

| Rejected | Reason |
|---|---|
| **MongoDB** | An ERP is relational to its bones. Enrollment joins students, sections, terms, and courses in a single query. You would spend your life reimplementing joins and transactions. |
| **Microservices from day one** | You do not yet know where the boundaries are. Build a well-modularized monolith (a "modular monolith"), and split off a service only when a specific module has a genuinely different scaling profile. |
| **GraphQL** | Real benefits for wildly varied clients. But it adds N+1 hazards, caching complexity, and authorization-per-field. With one web client, REST or tRPC is simpler and faster to ship. |
| **Float for money** | See [Section 7](#7-key-data-relationships). Non-negotiable. |
| **Hard deletes** | Regulators, auditors, and alumni all need history. |

---

## Appendix: A one-paragraph summary

A student enters through **Admissions** and becomes a **Person** with a **StudentProfile**. **Academics** places them into a **Section**, creating an **Enrollment** — the single row on which the entire academic system pivots. The **Timetable** turns that Section into daily periods, which generate **Attendance** registers, while **Examinations** turns the Section's courses into marks, grades, and ultimately a **Transcript**. Meanwhile, that same Enrollment tells **Fees** what to bill, producing an **Invoice**, which every other module — Library fines, Transport, Hostel — appends to rather than duplicating. When money moves, **Finance** records it as a balanced double-entry in the **General Ledger**, which is the only place money is ever considered true. Modules never call each other directly for anything that can wait a second; they announce **events**, and whoever cares subscribes. Everything is scoped by **Academic Year**, nothing is ever deleted, and every change is audited.

That is the whole system.
