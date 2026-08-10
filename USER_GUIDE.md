<div align="center">

# 📘 ParkGo — User Guide

**The complete manual for subscribers, attendants, and managers**

*Everything you need to use the automated parking facility, day to day.*

[← Back to README](README.md)

</div>

---

## Table of Contents

**Getting started**
1. [What ParkGo Is](#1-what-parkgo-is)
2. [Who Does What](#2-who-does-what)
3. [Signing In](#3-signing-in)
4. [Finding Your Way Around](#4-finding-your-way-around)

**For subscribers**
5. [Subscriber Dashboard](#5-subscriber-dashboard)
6. [Reserving a Space](#6-reserving-a-space)
7. [Dropping Off Your Car](#7-dropping-off-your-car)
8. [While Your Car Is Parked](#8-while-your-car-is-parked)
9. [Picking Up Your Car](#9-picking-up-your-car)
10. [Cancelling a Reservation](#10-cancelling-a-reservation)
11. [History and Billing](#11-history-and-billing)
12. [Your Profile and Details](#12-your-profile-and-details)

**For attendants**
13. [Attendant Dashboard](#13-attendant-dashboard)
14. [Registering a Subscriber](#14-registering-a-subscriber)
15. [Monitoring the Facility](#15-monitoring-the-facility)
16. [Handling Faults and Maintenance](#16-handling-faults-and-maintenance)

**For managers**
17. [Manager Dashboard](#17-manager-dashboard)
18. [Building the Facility](#18-building-the-facility)
19. [Managing Staff and Subscribers](#19-managing-staff-and-subscribers)
20. [Reports and Analytics](#20-reports-and-analytics)
21. [Expenses and Profitability](#21-expenses-and-profitability)

**Everyone**
22. [The AI Assistant](#22-the-ai-assistant)
23. [Emails You May Receive](#23-emails-you-may-receive)
24. [The Rules, in Plain Language](#24-the-rules-in-plain-language)
25. [Troubleshooting](#25-troubleshooting)
26. [Glossary](#26-glossary)

---

# Getting Started

## 1. What ParkGo Is

ParkGo runs an **automated parking facility**. You never drive into the lot yourself and
you never look for a space.

Instead:

```
   You arrive          Robotic installer         Your car is parked
   at the bay    ───►  takes the vehicle   ───►  in an assigned space
        │                                                │
        │                                                │
        ▼                                                ▼
   You get a 6-digit                            You return, enter the
   confirmation code                            code, and the car is
                                                brought back to you
```

The **confirmation code** is the single key to your car. Enter it to retrieve your
vehicle. Keep it safe — and if you lose it, ParkGo can email it to you again.

> **Note on timing.** Every time shown in ParkGo is **Israel local time
> (Asia/Jerusalem)**, regardless of your device's timezone.

---

## 2. Who Does What

ParkGo has three kinds of account. What you see when you sign in depends entirely on
which one you have.

| | **Subscriber** (מנוי) | **Attendant** (סדרן) | **Manager** (מנהל) |
|---|---|---|---|
| **Who** | A driver with a parking subscription | Facility floor staff | Facility operator |
| **Main job** | Park and retrieve their car | Keep the facility running | Run the business |
| **Can do** | Reserve, drop off, pick up, extend, view billing | Register subscribers, monitor occupancy, report faults | Build the facility, manage staff, run reports |
| **Cannot do** | See other drivers' data | Delete spaces, view financials | — |

**How accounts are created:**

```
Manager ──creates──► Attendant ──creates──► Subscriber
```

Subscribers cannot sign themselves up. You register in person at the facility and an
attendant creates the account for you.

---

## 3. Signing In

1. Open ParkGo in your browser.
2. Enter the **email address** and **password** for your account.
3. Select **Sign in**.

ParkGo sends you straight to the dashboard for your role — there is nothing to choose.

### If your sign-in fails

| What you see | What it means | What to do |
|---|---|---|
| *Invalid email or password* | Wrong credentials. The message also tells you how many attempts remain. | Check for typos and caps lock. |
| *Too many failed sign-in attempts… temporarily locked* | **3 wrong attempts** locked the account. The owner is emailed a security alert. | Wait for the stated time, then try again. |
| *Too many failed attempts from this device* | Many failures came from your network. | Wait for the stated time. |
| *Your subscription has been cancelled* | The subscription was suspended. | Contact an attendant to reactivate it. |

> **Repeated lockouts get longer.** The first lockout is 15 minutes; each additional one
> doubles, up to a 2-hour maximum. If you receive a lockout alert email you didn't cause,
> someone is trying to guess your password — change it once you can sign in.

### Signing out

Select your name at the bottom of the sidebar and choose **Sign out**. Your session lasts
7 days if you don't sign out manually.

---

## 4. Finding Your Way Around

Every screen shares the same shell:

```
┌────────────┬──────────────────────────────────────────────┐
│            │  Page title and subtitle                     │
│  SIDEBAR   ├──────────────────────────────────────────────┤
│            │                                              │
│  Dashboard │                                              │
│  …         │            Page content                      │
│  …         │                                              │
│            │                                              │
├────────────┤                                              │
│ Your name  │                                        💬 AI │
│ your@email │                                     assistant│
└────────────┴──────────────────────────────────────────────┘
```

- **Sidebar** — your role's sections. The current page is highlighted.
- **Name block (bottom)** — opens your profile and holds **Sign out**.
- **💬 button (bottom-right)** — the [AI assistant](#22-the-ai-assistant).

**On mobile**, the sidebar collapses. Subscribers get a bottom bar with the most common
actions; attendants and managers open the menu with the ☰ button.

---

# For Subscribers

## 5. Subscriber Dashboard

The dashboard is your home screen and answers three questions at a glance.

### If your car is parked

A prominent card shows the live session:

| Element | Meaning |
|---|---|
| **Confirmation code** | The 6-digit key to your car — needed for pickup |
| **Space number** | Where the robot placed your vehicle |
| **Countdown timer** | Time remaining before overtime |
| **Pick up now** | Jumps straight to retrieval |

The timer turns to an **overtime** display once you pass your allowed time, and keeps
counting up. See [The Rules](#24-the-rules-in-plain-language) for what overtime costs.

### Other dashboard sections

| Section | What it shows |
|---|---|
| **My Parking Overview** | Upcoming reservations and this month's charges |
| **Live Parking Status** | A 3D map of the facility with real-time occupancy, plus availability |
| **Parking Services** | The three main actions: *Reserve a spot*, *Drop off car*, *Pick up car* |

> **Reading the 3D map.** Occupied spaces are filled, free spaces are open. You can rotate
> and zoom it. It shows facility-wide occupancy — you cannot pick your own space, since
> allocation is automatic.

---

## 6. Reserving a Space

Reserve when you want a space guaranteed in advance. Reservations are optional — you may
always try a walk-in drop-off instead.

### Booking window

```
 NOW          +24 hours ═══════════════════════════ +7 days
  │                │                                    │
  ✗ too soon       ✓ ─────── you may book here ──────── ✓ ✗ too far
```

You must book **at least 24 hours ahead** and **no more than 7 days ahead**.

### Steps

1. Go to **Reserve a spot** from the dashboard.
2. Pick your **arrival date and time**.
3. ParkGo checks availability for that window and shows the result immediately.
4. Confirm the booking.

### Your confirmation

On success you see — and receive by email — a summary:

| Field | Meaning |
|---|---|
| **Confirmation code** | Your 6-digit key. Bring it when you arrive. |
| **Parking space** | The space held for you |
| **Arrival time** | When your booking starts |
| **Until** | Your window ends 4 hours after it starts |

### If the booking is refused

| Message | Why | What to do |
|---|---|---|
| *Only X% spaces will be free… at least 40% required* | ParkGo keeps at least 40% of the facility free at any booked time, so drivers arriving without a booking can still park. | Choose a different time. |
| *No free spaces for the requested window* | Every space is genuinely taken then. | Choose a different time. |
| *Reservation must be at least 24 hours ahead* | Too soon to book. | Book later — or just arrive and use walk-in drop-off. |
| *Cannot be more than 7 days ahead* | Too far out. | Book closer to the date. |

> **Why the 40% rule exists.** It protects walk-in drivers. Without it, advance bookings
> could fill the facility completely and anyone arriving unannounced would be turned away.

---

## 7. Dropping Off Your Car

Drive to the entrance bay, then use **Drop off car**.

### Two ways to drop off

**A · With a reservation** — enter your confirmation code. ParkGo uses the space already
held for you.

⚠️ **Arrive within 15 minutes of your booked time.** The grace window is tight in both
directions:

```
        booked time
             │
   ─── 15m ──┼── 15m ───
     │       │        │
  too early  ✓ arrive  too late — reservation is void
             │  now    │
```

- **Too early** → *"Please arrive within 15 minutes of your reservation time."*
- **Too late** → the reservation is automatically cancelled as a **no-show**, and you are
  emailed. You may still try a walk-in drop-off if space allows.

**B · Walk-in (no reservation)** — leave the code field empty. ParkGo finds a free space
right now, assigns it, and generates a new code, which is also emailed to you.

> Walk-ins are **not** subject to the 40% rule — that rule only limits future bookings.
> They are subject to actual availability at that moment.

### What happens next

You'll see a short **"Parking your vehicle"** animation while a robotic installer takes
the car — about 20 seconds. Then your confirmation appears with the **code**, the
**space number**, and your **countdown timer**.

### If drop-off fails

| Message | Meaning | What to do |
|---|---|---|
| *All installers are busy* | Every robotic unit is mid-cycle. The message shows how many exist and how many are free. | Wait a moment and retry — cycles take about 20 seconds. |
| *No free parking spaces available* | The facility is genuinely full. | Wait, or ask an attendant. |
| *No active reservation found for this code* | The code is wrong, already used, or cancelled. | Re-check the code in your email. |
| *A parking session is already active for this code* | The car is already parked under it. | Go to **Pick up** instead. |
| *Subscription is inactive* | Your subscription is suspended. | Contact an attendant. |

---

## 8. While Your Car Is Parked

### Your timer

The standard session is **4 hours**. The dashboard counts down; past that, it counts up as
overtime and late-return rules begin to apply.

### Extending your session

Need longer? Use **extend** from the active session card.

- You may add up to **4 extra hours** in total across the whole session.
- Extensions do not stack beyond that cap.

**Extensions respect other people's bookings.** If someone has reserved your exact space
right after you, ParkGo will:

- **Trim** your extension so it ends exactly when their booking starts, and tell you so; or
- **Refuse** it — *"Another reservation starts on this space immediately after your
  session"* — when there is no room at all.

In that case, collect your car on time or retrieve it and drop off again for a new space.

### If you lose your code

Use **lost code**. ParkGo emails the code for your active session to your registered
address. You do not need to visit an attendant.

---

## 9. Picking Up Your Car

1. Go to **Pick up car**.
2. Enter your **6-digit confirmation code**.
3. Confirm.

A **"Retrieving your vehicle"** animation plays while a robotic installer brings the car
to the exit bay — again about 20 seconds. Then you see a summary:

| Field | Meaning |
|---|---|
| **Space number** | Where the car was |
| **Retrieved at** | Completion time |
| **Elapsed minutes** | Total session length |
| **Overtime minutes** | Time beyond your allowance — `0` if you were on time |

The space is freed immediately for the next driver.

### If pickup fails

| Message | Meaning | What to do |
|---|---|---|
| *No active parking session found for this code* | Wrong code, or the car was already collected. | Check the code; use **lost code** to resend it. |
| *This parking session belongs to a different subscriber* | The code isn't yours. | Use your own code. |
| *All installers are busy* | Every robot is mid-cycle. | Wait a few seconds and retry. |

---

## 10. Cancelling a Reservation

Use **Cancel Reservation** in the sidebar, pick the booking, and confirm. The space is
released straight away and you receive a confirmation email.

**You cannot cancel** a reservation whose car is already parked — retrieve the car instead.

> Staff may also cancel a booking on your behalf. If they do, the cancellation email says
> so explicitly.

---

## 11. History and Billing

### My Reservations
Every booking you've made, newest first, with its status: **active**, **cancelled**, or
completed (used for a parking session).

### Parking History
Every session you've had — date, space, duration, and any overtime.

### Billing
Your statement for the selected month:

| Line | How it's calculated |
|---|---|
| **Hourly charges** | ₪50 per started hour of parking |
| **Extension cost** | Hours beyond the standard 4, shown separately for transparency — billed at the same hourly rate, not extra |
| **Late fines** | ₪200 flat per recorded late return |
| **Subscription fee** | ₪150 per month while active |

> **Billing resets each calendar month.** Amounts are in shekels (₪), and the exact rates
> are set by the facility operator — the figures above are the defaults.
>
> **"Per started hour"** means a 61-minute session is billed as 2 hours.

---

## 12. Your Profile and Details

Open your **profile** from the name block at the bottom of the sidebar.

**Update Details** lets you change:

- License plate — format `12-345-67`
- Phone number — Israeli format, e.g. `0501234567`
- Password — at least 8 characters

> **You must enter your current password** to save any change. This prevents someone using
> an unattended session to take over your account. Name and email are managed by staff —
> ask an attendant to change them.

---

# For Attendants

## 13. Attendant Dashboard

Your operational overview: current occupancy, active sessions, and facility health. The
sidebar holds:

| Section | Purpose |
|---|---|
| **Dashboard** | Live overview |
| **Register Subscriber** | Create a new subscriber account |
| **Active Subscribers** | Browse and manage subscribers |
| **Active Parkings** | Every car currently in the facility |
| **Facility Status** | Per-space state and installer availability |
| **Load Level** | Occupancy trends by hour |
| **Maintenance** | Report faults and call a technician |

---

## 14. Registering a Subscriber

Subscribers cannot self-register — you create the account.

1. Go to **Register Subscriber**.
2. Complete the form:

| Field | Requirement |
|---|---|
| First name | 2–50 characters |
| Last name | 2–50 characters |
| Email | Valid and **not already registered** — this is their sign-in ID |
| Phone | Israeli format `0501234567` (optional) |
| License plate | Format `12-345-67` (optional) |
| Password | At least 8 characters |

3. Submit, then give the person their email and initial password and tell them to change
   it at first sign-in via **Update Details**.

> **Email must be unique.** If registration fails on a duplicate, the person likely already
> has an account — check **Active Subscribers** before creating a new one.

### Reactivating a suspended subscriber

Subscriptions are suspended automatically after **3 late returns**. From **Active
Subscribers**, open the person and choose **reactivate**. They can sign in and park again
immediately.

> Only a **manager** can suspend a subscription manually. Attendants can only restore one.

---

## 15. Monitoring the Facility

### Active Parkings
Every car currently inside, with driver name, contact details, license plate, space
number, start time, and elapsed time. Use this to identify a vehicle or contact a driver
who is running late.

### Facility Status
The state of every space and every robotic installer — which units are free, which are
mid-cycle. When drivers report that drop-offs are slow, check here first: if all
installers are busy, the queue is simply saturated.

### Load Level
Occupancy over time, by hour. Useful for anticipating peak periods and staffing.

---

## 16. Handling Faults and Maintenance

Use **Maintenance** when a space is unusable — an obstruction, a damaged bay, a
mechanical fault.

**Space states:**

| State | Meaning | Allocated to drivers? |
|---|---|---|
| **available** | Normal | ✅ Yes |
| **blocked** | Temporarily unusable | ❌ No |
| **maintenance** | Under repair | ❌ No |
| **decommissioned** | Permanently retired | ❌ No |

Only **available** spaces are ever assigned, so marking a space immediately takes it out
of allocation without affecting any parking already recorded there.

**Calling a technician** logs a maintenance event with a timestamp and your account, giving
the manager an auditable record.

---

# For Managers

## 17. Manager Dashboard

A facility-wide view — occupancy, activity, and financial headlines. Your sidebar:

| Section | Purpose |
|---|---|
| **Dashboard** | Facility overview |
| **Add / Remove Facility** | Create and retire floors and spaces |
| **Reports** | Four analytics reports |
| **All Subscribers** | Every subscriber account |
| **Active Parkings** | Live sessions |
| **Attendants / Add Attendant** | Staff management |
| **Maintenance** | Faults and technician dispatch |

---

## 18. Building the Facility

ParkGo has **no hard-coded capacity**. The facility exists exactly as you define it — every
occupancy figure, availability check, and report derives from the spaces you create.

### Adding a floor

Go to **Add Facility**, then give:

- **Location** — the floor or zone label, e.g. `Zone-A`, `Level 1`
- **Number of spaces** — 1 to 200

ParkGo creates the spaces and numbers them automatically. **Lower numbers are closer to
the entrance** — allocation always prefers the lowest free number, so the robot travels the
shortest distance.

### Managing installers

Installers are the robotic units. **Each one can handle only one operation at a time**, so
the count directly sets how many simultaneous drop-offs and pickups the facility supports.

- Too few → drivers see *"All installers are busy"* at peak.
- Add units as throughput demands.

A unit that is currently mid-operation **cannot be removed** — wait for its cycle to
finish.

### Removing floors and spaces

Removal is deliberately restricted. ParkGo **refuses** to remove a space that:

- has a car parked in it right now, or
- has an active future reservation against it.

Cancel or complete those first.

> **Why spaces are retired, not deleted.** Parking and reservation records point at space
> numbers. A space carrying history is **decommissioned** — hidden from allocation but
> preserved — so past reports stay accurate and no history is orphaned.

---

## 19. Managing Staff and Subscribers

### Adding an attendant

**Add Attendant** — first name, last name, email, optional phone, and a password of at
least 8 characters. Attendants can immediately register subscribers and run floor
operations. Only you can create them.

### Managing subscribers

**All Subscribers** lists every account with its status and **delay count** (accumulated
late returns).

- **Deactivate** — suspends a subscription. They cannot sign in or park. Use this for
  non-payment or misuse.
- Reactivation is done by **attendants**.

> The system also suspends automatically at 3 late returns — see
> [The Rules](#24-the-rules-in-plain-language).

---

## 20. Reports and Analytics

**Reports** provides four analyses, each selectable by month and exportable to **CSV**.

### Occupancy Report
How full the facility is over time.

- Average and peak occupancy for the month
- **Hour-of-day heatmap** — average occupancy at each hour across the whole month, so you
  can see exactly when demand peaks
- Peak vs. off-peak comparison

*Use it to* set staffing, plan maintenance windows for quiet hours, and judge whether
capacity needs to grow.

### Behavior Report
How subscribers actually use the facility — session lengths, extension habits, late
returns, and who the heaviest users are.

*Use it to* spot repeat late returners before automatic suspension, and to see whether the
4-hour standard matches real behaviour.

### Reservations Report
Booking outcomes — how many were made, honoured, cancelled, or lost to no-shows.

*Use it to* judge whether the 40% guardrail and 15-minute grace window are set correctly. A
high no-show rate means held spaces are being wasted.

### Financial Report
Full monthly profit and loss:

- **Income** broken down by source — hourly charges, late fines, subscription fees — and by day
- **Expenses** — the values you configure
- **Net profit or loss**
- **Break-even point** — the minimum parking volume needed to cover costs

---

## 21. Expenses and Profitability

The financial report's expense side is yours to configure:

| Expense | Typical meaning |
|---|---|
| **Guard salary** | Security staffing |
| **Manager salary** | Management cost |
| **Electricity** | Power, largely the robotic installers |
| **Facility upkeep** | Cleaning, repairs, general maintenance |
| **Technician fee** | Servicing the robotic units |

Edit these from the reports area. Changes take effect immediately and recalculate both net
profit and the **break-even point** — the volume of parking that must happen before the
facility becomes profitable.

> Income comes from real recorded activity; expenses are the values you enter. Keep them
> current, or the break-even figure will mislead.

---

# For Everyone

## 22. The AI Assistant

The **💬 button** in the bottom-right corner opens the ParkGo assistant. Ask questions in
plain language:

> *"How much do I owe this month?"*
> *"When does my parking expire?"*
> *"Is there space free tomorrow at 9am?"*
> *"How many cars are in the facility right now?"*

**How it behaves:**

- **It knows your role.** A subscriber's assistant can only reach that subscriber's own
  data; a manager's can reach facility-wide figures. It cannot show you anything your
  account couldn't already open.
- **It reads live data.** Answers come from the actual system, not a static FAQ.
- **It asks before acting.** If it can do something for you — such as booking a space — it
  shows a **confirmation card** first. Nothing is committed until you approve it.
- **It remembers the conversation**, so follow-up questions work naturally. You can clear
  the history at any time.

**Limits:** 20 messages per minute. If the facility operator hasn't configured an AI key,
the assistant is unavailable and the rest of ParkGo works normally.

> **Always confirm important details on the real screen.** For anything that costs money or
> affects your car, treat the assistant as a helpful guide, not the final record.

---

## 23. Emails You May Receive

All emails go to the address registered on your account.

| Email | When | Contains |
|---|---|---|
| **Reservation confirmed** | You book a space | Code, space number, start time |
| **Drop-off code** | Walk-in drop-off | Code and space number |
| **Lost code** | You request a resend | Code, space, start time |
| **Reservation cancelled** | You, staff, or a no-show cancels | The reason |
| **Late return** | Your session runs over | Minutes late, strike count, and whether the subscription was suspended |
| **Security alert** | Your account is locked after failed sign-ins | Time, IP, device, lockout length |

> **Not receiving emails?** Check your spam folder, then confirm your address with an
> attendant. Codes are always visible on screen, so a missing email never traps your car.
>
> **A security alert you didn't trigger** means someone is guessing your password. Change it
> as soon as you can sign in.

---

## 24. The Rules, in Plain Language

These defaults are set by the facility operator and may differ at your site.

### Time

| Rule | Value |
|---|---|
| Standard parking session | **4 hours** |
| Maximum extension | **4 extra hours** |
| Book at least | **24 hours ahead** |
| Book at most | **7 days ahead** |
| Reservation window length | **4 hours** from your start time |
| Arrival grace window | **±15 minutes** of your booked time |
| Robotic operation | About **20 seconds** per drop-off or pickup |

### Availability

- A reservation is refused unless at least **40%** of spaces would remain free at that time.
- Walk-ins are exempt from that rule but still need a genuinely free space.
- You are always assigned the **free space closest to the entrance**.

### Late returns — the three-strike rule

```
  Strike 1          Strike 2          Strike 3
     │                 │                 │
   email             email          email + SUBSCRIPTION SUSPENDED
                                              │
                                    An attendant must reactivate you
```

Each overdue session records one strike and a **₪200 fine**. At **3 strikes** the
subscription is suspended: you cannot sign in or park until an attendant restores it.

> **Avoid strikes** by extending before your timer runs out, or collecting on time. Watch
> the dashboard countdown.

### Money

| Charge | Default |
|---|---|
| Parking | **₪50** per started hour |
| Late fine | **₪200** per late return |
| Subscription | **₪150** per month |

Billing resets each calendar month.

### Security

- **3 failed sign-ins** lock an account; repeat lockouts double in length up to 2 hours.
- Locking an account emails its owner a security alert.
- Changing your details requires your current password.

---

## 25. Troubleshooting

### Parking

**"All installers are busy"**
Every robot is mid-cycle. Wait ~20 seconds and retry. If it persists at peak times, the
facility likely needs more units — attendants can confirm on **Facility Status**.

**"No free parking spaces available"**
The facility is full. Wait, or book a reservation for later.

**I lost my confirmation code**
Use **lost code** on your dashboard — it is emailed to you immediately. No staff needed.

**My reservation expired before I arrived**
You missed the 15-minute grace window and it was released as a no-show. Try a walk-in
drop-off if space allows.

**I can't extend my parking**
Either you've used the full 4-hour extension, or a reservation claims your space next.
Collect the car, or retrieve and drop off again for a new space.

**The code says it belongs to a different subscriber**
You've entered someone else's code. Check your own email.

### Account

**I'm locked out**
Wait the stated time. Lockouts lengthen with repetition, so don't keep guessing.

**"Your subscription has been cancelled"**
Either 3 late returns triggered automatic suspension, or a manager suspended it. Contact
an attendant to reactivate.

**I can't change my details**
You must enter your **current password**. Name and email changes go through staff.

### General

**The assistant won't respond**
You may have hit 20 messages/minute — wait a moment. If it never responds, the operator
hasn't enabled it; everything else still works.

**Times look wrong**
All times are **Israel time (Asia/Jerusalem)**, not your device's timezone.

**A page won't load**
Refresh first. If it persists, sign out and back in — your 7-day session may have expired.

---

## 26. Glossary

| Term | Meaning |
|---|---|
| **Confirmation code** | The 6-digit number that identifies your parking session or reservation. The key to your car. |
| **Installer** | A robotic unit that moves cars between the entrance bay and their space. One operation at a time. |
| **Space number** | The identifier of the space holding your car. Lower numbers are closer to the entrance. |
| **Location / Floor / Zone** | A labelled group of spaces, e.g. `Zone-A`. |
| **Reservation window** | The 4-hour period starting at your booked time. |
| **Grace window** | The ±15 minutes around your booked time in which you may arrive. |
| **No-show** | A reservation whose holder never arrived; automatically cancelled and released. |
| **Overtime** | Time parked beyond your allowance. |
| **Strike / delay count** | A recorded late return. Three suspends the subscription. |
| **Walk-in** | Dropping off without a reservation. |
| **Extension** | Extra time added to an active session, up to 4 hours. |
| **Decommissioned** | A space permanently retired from use but kept for historical records. |
| **Break-even point** | The parking volume at which income covers all expenses. |

---

<div align="center">

**Need more help?**
Subscribers → ask an attendant · Attendants → ask your manager · Managers → see the [README](README.md)

<sub>ParkGo — Automated Parking Management System</sub>

</div>
