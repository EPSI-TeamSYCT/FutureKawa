# 🔄 Change management — supervising green coffee across three countries

> 🌐 **Languages:** **English** · [Français](../fr/conduite-du-changement.md) · [Português](../pt/gestao-da-mudanca.md) · [Español](../es/gestion-del-cambio.md)

This plan describes how FutureKawa moves from **semi-manual, hard-to-audit** storage
tracking to a **supervised, multi-country platform** — and, above all, **how the
people on the ground adopt it**. The whole approach is built around one principle:
change happens **on-site and in the local language** (🇧🇷 Portuguese for Brazil,
🇪🇨🇨🇴 Spanish for Ecuador and Colombia), never as a remote instruction pushed from
headquarters.

It is a companion to the [user guide](../../user-guide/en/index.md) (how to use the
app) and to the [phase 2 automation schema](../../phase2/automation-schema.md) (where
this change is heading next).

## Table of contents

- [🎯 Context & goal of the change](#-context--goal-of-the-change)
- [👥 Stakeholders & impact](#-stakeholders--impact)
- [🧭 Adoption approach — the three pillars](#-adoption-approach--the-three-pillars)
- [🗺️ Phased rollout](#-phased-rollout)
- [🎓 Training plan](#-training-plan)
- [📣 Communication plan](#-communication-plan)
- [🧱 Resistance management](#-resistance-management)
- [🛟 Support model](#-support-model)
- [📊 Success indicators (KPIs)](#-success-indicators-kpis)
- [🔮 Link to phase 2](#-link-to-phase-2)
- [🔗 Related docs](#-related-docs)

## 🎯 Context & goal of the change

Today, storage conditions for green coffee are tracked in a **semi-manual** way:
readings noted by hand or in scattered spreadsheets, **FIFO** rotation applied from
memory, and no reliable audit trail when a client asks for **traceability proof**.
When temperature or humidity drifts, nobody finds out until the beans have already
lost aroma or been downgraded — the loss is discovered **after** the damage.

The change introduces a single **supervised platform**: sensors publish
temperature/humidity automatically, lots are tracked oldest-first, **alerts** fire the
moment conditions leave the ideal band, and headquarters consolidates the three
countries into one view — while **each country keeps its own data** (sovereignty).

| | Before — semi-manual | After — supervised platform |
|---|---|---|
| 🌡️ Conditions | Read by hand, intermittently | Measured automatically, continuously |
| 🔁 FIFO rotation | From memory, error-prone | Oldest-first list, always visible |
| 🚨 Drift | Noticed after damage | Alert the moment it happens |
| 🧾 Traceability | Hard to reconstruct | Recorded history per lot |
| 🌍 Multi-country view | None | Consolidated at HQ, data stays local |

> 💡 **Why it matters to field teams.** This is not "more screens to fill in." It
> removes manual note-taking, replaces guesswork on rotation with a clear list, and
> means a warehouse manager is **warned in time** to save a lot instead of explaining a
> loss afterwards. The goal of change management is to make that benefit **felt**, not
> just announced.

> 📸 **[SCREENSHOT]** — HQ dashboard, Brazil selected, warehouse wh-01 open, one lot
> EN ALERTE with its temperature/humidity curve leaving the green band.

## 👥 Stakeholders & impact

Everyone touched by the platform, what changes for them, and the concrete benefit that
earns their buy-in. Support tiers **N1** (local SI correspondent) and **N2**
(infra/DevOps) are described in the [support model](#-support-model).

| Role | 🔧 Impact (what changes) | 🎁 Benefit (what they gain) |
|---|---|---|
| 🏭 **Exploitation / farm manager** | Receives storage alerts by email; acts on drift and lot age. | Fewer losses; reacts in time instead of explaining damage. |
| 📦 **Warehouse manager** | Uses the FIFO lot list and curves daily instead of manual notes. | Clear rotation order; conditions visible at a glance. |
| 🔬 **Quality manager** | Reads recorded history to certify a lot's conditions. | Real traceability proof for clients and audits. |
| 🚚 **Supply-chain manager** | Plans shipments on consolidated, reliable stock data. | Fewer surprises; ships the right lots first. |
| 🏢 **HQ supervisor (siège)** | Gains a single, consolidated multi-country view. | Steers three countries from one dashboard; spots trends. |
| 🧑‍💻 **Local SI correspondent (N1)** | Becomes the on-site first point of contact and relay. | Recognised local role; direct line to N2. |
| ⚙️ **Infra / DevOps (N2)** | Operates and monitors the per-country and HQ stacks. | Repeatable deploys; one stack per country, env-driven. |

> 📸 **[SCREENSHOT]** — Alert email received by the exploitation manager: warehouse,
> lot id, out-of-band temperature/humidity value, timestamp.

## 🧭 Adoption approach — the three pillars

Adoption rests on the three MSPR pillars. None works alone: **participation** earns
trust, **communication** keeps everyone informed, **training** builds the skill — all
delivered **on-site, in the local language**.

| Pillar | What it means here | How we deliver it |
|---|---|---|
| 🤝 **Participation** | Field teams help shape the rollout, not just receive it. | On-site workshops per country; local key users chosen early; feedback drives fixes. |
| 📣 **Communication** | Everyone knows the why, the when, and where to get help. | Local-language kickoff, regular updates, a two-way feedback loop (see below). |
| 🎓 **Training** | Each role can do its daily job in the tool, confidently. | Role-based, hands-on sessions **on-site and in PT / ES**; train-the-trainer. |

> 💡 The three pillars are **repeated in the local language at every country**, by a
> local trainer where possible. A message that lands in Portuguese in a Brazilian
> warehouse is worth more than a perfect slide deck in English.

## 🗺️ Phased rollout

We do **not** switch on all three countries at once. We **pilot on one country**,
prove the value, then **generalize** to the other two — carrying the lessons across.

| Phase | Scope | Focus | Exit → next phase |
|---|---|---|---|
| 0️⃣ **Prepare** | HQ + pilot country | Stacks deployed, key users named, materials translated. | Environment ready, trainers ready. |
| 1️⃣ **Pilot** | 🇧🇷 Brazil (1–2 warehouses) | Real use on real lots; collect friction; tune thresholds/alerts. | **Go/no-go** met (below). |
| 2️⃣ **Generalize** | 🇪🇨 Ecuador + 🇨🇴 Colombia | Repeat the proven playbook, in ES, on-site. | Same go/no-go per country. |
| 3️⃣ **Run & improve** | All 3 countries | Steady-state support, KPI review, prep phase 2. | KPIs stable; phase-2 interview launched. |

Brazil is the natural pilot: largest operation and the reference for the storage
thresholds. Adding a country is a **repeat of the same stack**, configured only by
environment variables — see [running the stack](../../deployment/running-the-stack.md).

### ✅ Go / no-go criteria

Before generalizing beyond the pilot, **all** of these must hold:

| Criterion | 🎯 Target |
|---|---|
| 📈 Adoption | Key users log in and use the FIFO list **daily** for 2 weeks. |
| 🚨 Alerts trusted | Alerts are acted on, and **false alerts** are within an agreed low rate. |
| 📥 Data completeness | Measurements arriving from every pilot warehouse, few gaps. |
| 🧑‍🏫 Local capacity | At least **one trained local trainer** per pilot site. |
| 😀 Satisfaction | Pilot users report the tool **saves time** vs. the manual way. |

> ⚠️ A **no-go** is not a failure — it pauses generalization until the blocking
> criterion is fixed (e.g. too many false alerts → retune tolerances before rollout).

## 🎓 Training plan

Training is **on-site and in the local language** — this is the heart of the plan. No
role is trained over a generic English webinar; a trainer is **in the warehouse**,
speaking **Portuguese in Brazil** and **Spanish in Ecuador and Colombia**.

### Per-role sessions

| Role | Language | Format | Covers |
|---|---|---|---|
| 🏭 Exploitation manager | PT / ES | On-site, ~½ day | Reading alerts, acting on drift & lot age, escalation. |
| 📦 Warehouse manager | PT / ES | On-site, hands-on | FIFO list, opening a lot, reading the curves daily. |
| 🔬 Quality manager | PT / ES | On-site, ~½ day | History & traceability, exporting proof for clients. |
| 🚚 Supply-chain manager | PT / ES | On-site / remote | Consolidated stock view, planning on reliable data. |
| 🏢 HQ supervisor | EN / local | Remote + on-site | Multi-country dashboard, cross-country trends. |
| 🧑‍💻 N1 correspondent | Local | Deep, on-site | Everything above + first-line troubleshooting + when to escalate to N2. |

### Materials & train-the-trainer

| Item | Language | Notes |
|---|---|---|
| 🧑‍🏫 **Train-the-trainer** | PT / ES | HQ trains local trainers first; they then teach in-country. |
| 📘 **Quick-start guide** | PT / ES | Short, screenshot-led; mirrors the [user guide](../../user-guide/en/index.md). |
| 🎬 **Screen-recorded walkthroughs** | PT / ES | FIFO list, reading a curve, reacting to an alert. |
| 🃏 **One-page cheat sheet** | PT / ES | Pinned in the warehouse; thresholds + "what to do on an alert". |
| ❓ **FAQ** | PT / ES | Local mirror of the guide's [FAQ](../../user-guide/en/faq.md). |

> 💡 **Train-the-trainer** is what makes on-site, local-language training scale to three
> countries: HQ trains a handful of local trainers, and **they** run the warehouse
> sessions in PT / ES — so knowledge stays local and support does too.

> 📸 **[SCREENSHOT]** — Quick-start guide cover page, localized to Portuguese, showing
> the FIFO lot list of a Brazilian warehouse.

## 📣 Communication plan

Clear, repeated, **two-way**, and always available in the local language.

| Channel | Audience | Cadence | Purpose |
|---|---|---|---|
| 🚀 **Kickoff meeting (on-site)** | All roles per country | Once, at phase start | Explain the why, the plan, and who to ask for help. |
| 🗞️ **Progress update** | All stakeholders | Weekly during rollout | What shipped, what's next, wins from the pilot. |
| 🧑‍🤝‍🧑 **Local stand-up / check-in** | Warehouse + N1 | Daily during pilot | Surface friction fast; nothing waits a week. |
| 📧 **Alert emails** | Exploitation managers | Event-driven | The operational signal itself (drift / lot age). |
| 🗣️ **Feedback channel** | Everyone | Always open | Collect issues & ideas; close the loop. |

### 🔑 Key messages

- **"It saves your lots."** The platform warns you **in time** to act, not after.
- **"Your data stays in your country."** HQ consolidates a view; it never takes your DB.
- **"It replaces manual notes,"** it does not add paperwork on top of them.
- **"Help is local."** Your first contact is your on-site N1 correspondent.

### 🔁 Feedback loop

Every objection, bug, or idea goes to the local **N1 correspondent**, is triaged with
**N2** if technical, and the outcome is **reported back** to the person who raised it.
Visible follow-through is what turns communication into trust.

## 🧱 Resistance management

Objections are expected and legitimate. We name them and answer them **before** they
harden — in the local language, on-site.

| 🗣️ Expected objection | ✅ How we address it |
|---|---|
| "The manual way worked fine." | Show side-by-side: an alert catching a drift the manual way would have missed. |
| "It's extra work on top of my job." | Demonstrate it **removes** manual notes; the daily action is a glance, not data entry. |
| "Too many/false alerts, I'll ignore them." | Tune tolerances during the pilot; a low false-alert rate is a **go/no-go** criterion. |
| "I don't trust the sensor numbers." | Cross-check readings on-site during training; explain the ideal band & tolerance. |
| "In English I don't fully get it." | **Everything** is delivered in PT / ES, on-site, by a local trainer. |
| "Is HQ watching / taking our data?" | Explain sovereignty: the country owns its DB; HQ only queries a consolidated view. |
| "Who do I call when it breaks?" | A named **local N1** correspondent, with N2 behind them — printed on the cheat sheet. |

> 💡 The strongest antidote to resistance is a **local champion**: a respected
> warehouse colleague, trained first, who answers in the local language and proves the
> tool on the team's own lots.

## 🛟 Support model

Two tiers, matching the client context — **local first**, infra behind.

| Tier | Who | Scope | Reaches for |
|---|---|---|---|
| 🧑‍💻 **N1 — local SI correspondent** | On-site, per country, speaks the local language | First contact: usage questions, "is this alert real?", basic checks, triage. | Escalates infra/platform issues to N2. |
| ⚙️ **N2 — infra / DevOps** | Central, cross-country | Platform: stacks, broker, APIs, deploys, incidents, data flow. | Owns the [distributed system](../../architecture/distributed-system.md) & deploys. |

```
Field user  ──▶  N1 (local, on-site, PT/ES)  ──▶  N2 (infra / DevOps, central)
   ▲                     │                              │
   └─────── answer ◀──────┴──── platform fix ◀──────────┘
```

> 💡 Most day-to-day questions are **usage** questions and stop at **N1** — in the
> local language, on-site. Only genuine platform faults travel to N2. This keeps help
> fast, local, and understandable.

## 📊 Success indicators (KPIs)

How we know the change has actually landed — reviewed per country and at HQ.

| KPI | 📐 What it measures | 🎯 Direction |
|---|---|---|
| 📈 **Adoption rate** | Active users vs. expected, and daily FIFO-list use. | ⬆️ Up to steady, near-full use. |
| ⏱️ **Alert response time** | Time from alert fired → action taken. | ⬇️ Down — react before damage. |
| 📉 **Reduction of losses** | Downgraded/lost lots vs. the manual baseline. | ⬇️ Down — the core business win. |
| 📥 **Data completeness** | Share of expected measurements actually received. | ⬆️ Up — few gaps per warehouse. |
| 😀 **User satisfaction** | Field teams report time saved & trust in alerts. | ⬆️ Up — sustained buy-in. |
| 🧑‍🏫 **Local autonomy** | Questions resolved at N1 without escalating. | ⬆️ Up — local support works. |

> 💡 KPIs are reviewed **with** the local teams, in their language — the review is
> itself a communication and participation moment, not an audit.

> 📸 **[SCREENSHOT]** — HQ dashboard KPI/overview area: per-country stock and active
> alert counts side by side for Brazil, Ecuador and Colombia.

## 🔮 Link to phase 2

Phase 1 makes people **trust supervision**: they learn to rely on alerts, act on drift,
and read the curves. Phase 2 **closes the loop** — the same measurements drive
**actuators** (heating, aeration, humidification) that hold each warehouse in its ideal
band **automatically** (see the [automation schema](../../phase2/automation-schema.md)).

That automation only earns acceptance if the **human phase came first**:

| Phase-1 change habit | Prepares phase-2 acceptance of… |
|---|---|
| Trusting alerts & the ideal band | Trusting the controller that acts on the same band. |
| Reacting to drift by hand | Letting actuators react, with a **manual override** kept. |
| Reading recorded history | Reviewing the automatic-command audit trail. |
| Local N1 + central N2 support | The same support tiers operating the control loop. |

> 💡 A team that already trusts the alerts will accept an actuator acting on those same
> alerts. Change management in phase 1 is what makes phase-2 automation **welcome**
> instead of imposed. The open decisions are gathered in the
> [interview questionnaire](../../phase2/interview-questionnaire.md).

## 🔗 Related docs

- [User guide](../../user-guide/en/index.md) — how field teams use the app day-to-day.
- [Phase 2 — automation schema](../../phase2/automation-schema.md) — where this change heads next.
- [Phase 2 — interview questionnaire](../../phase2/interview-questionnaire.md) — decisions still open.
- [Distributed system](../../architecture/distributed-system.md) — the sovereign multi-country topology.
- [Running the stack](../../deployment/running-the-stack.md) — deploying one stack per country.
