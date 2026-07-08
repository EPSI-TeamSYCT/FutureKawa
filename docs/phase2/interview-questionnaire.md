# 📝 Phase 2 — client cadrage interview

Structured questionnaire to run the **phase‑2 client cadrage interview** (framing
meeting) for warehouse automation — heating, aeration and humidification driven by
the existing sensors. It complements the [automation schema](automation-schema.md):
the schema states the **technical principle**, this questionnaire gathers the
**decisions** needed to turn it into a specification.

The questions are **open‑ended and ready to send** to the client. Group by group,
capture the answers directly under each question.

## Table of contents

- [How to use](#how-to-use)
- [A. Business objectives of automation](#a-business-objectives-of-automation)
- [B. Constraints — safety, maintenance, cost, responsibility](#b-constraints--safety-maintenance-cost-responsibility)
- [C. Tolerances & setpoints](#c-tolerances--setpoints)
- [D. Manual vs. automatic modes](#d-manual-vs-automatic-modes)
- [E. Deployment priorities & success indicators (KPIs)](#e-deployment-priorities--success-indicators-kpis)
- [F. Risks & incident scenarios](#f-risks--incident-scenarios)
- [Wrap-up](#wrap-up)

## How to use

| Rule | Why |
|---|---|
| 🎤 One facilitator asks, one takes notes. | Keeps the conversation flowing, nothing lost. |
| 🏷️ Tag each answer **decided** / **to confirm** / **out of scope**. | Separates a specification from a wish list. |
| 👤 Every "it depends" ends with **who decides** and **by when**. | Turns ambiguity into an owned action. |
| 📎 Attach the [automation schema](automation-schema.md) as support. | Grounds the discussion in a concrete loop. |

> 💡 Questions are intentionally **open** ("how", "what", "who") so the client
> describes their reality rather than answering yes/no.

## A. Business objectives of automation

1. What problem should automation solve **first** — reduce spoilage, cut manual
   workload, strengthen traceability proof, something else? Rank them.
2. In one sentence, what does **success look like** for a warehouse manager the day
   after go‑live?
3. Today, how are out‑of‑band conditions handled manually, and how much operator
   time and reaction delay does that cost?
4. Is the target **full automation**, or **assisted operation** with a human kept
   in the loop for anything that acts on a lot?
5. Which of the three countries (🇧🇷 / 🇪🇨 / 🇨🇴) feels the pain the most and would
   benefit first?

## B. Constraints — safety, maintenance, cost, responsibility

6. **🔐 Security** — who is allowed to send a control command, and what
   authentication/authorisation should a control action require?
7. **🧰 Maintenance** — who maintains the actuators and controller on site, and what
   availability / response time is expected when something fails?
8. **💶 Cost** — what is the budget envelope per site (equipment + running cost), and
   is there an **energy‑cost ceiling** the automation must respect?
9. **⚖️ Responsibility / liability** — if an automatic action **damages a lot**, who
   is accountable, and does a critical action require **human confirmation**?
10. **📜 Regulation** — are there safety, fire, electrical or food‑storage
    regulations the automation must comply with per country?
11. What are the **electrical, water and space** constraints on site, and is there an
    existing HVAC / building‑management system to **integrate with rather than
    replace**?

## C. Tolerances & setpoints

12. Are the current ideal bands correct — 🇧🇷 29 °C / 55 %, 🇪🇨 31 °C / 60 %,
    🇨🇴 26 °C / 80 %, ± 3 °C / ± 2 %? Any **per‑warehouse** exceptions?
13. Are there **hard limits** (never‑exceed values) that are stricter than, or
    distinct from, the ideal band?
14. How long may a value stay **out of band** before it becomes a real risk to the
    beans — minutes, hours, days?
15. Do tolerances change by **coffee type, season, or lot age** (recall: a lot is a
    risk past 365 days)?
16. How tight should the **hysteresis deadband** be — is a little more drift
    acceptable to save energy and spare the equipment?

## D. Manual vs. automatic modes

17. Should each warehouse support **auto / manual / off** modes, and **who** may
    switch between them?
18. Should overrides be possible **remotely** from the web app, **on site**, or
    both — and should one take precedence over the other?
19. What should the **default state** be after a power cut or a restart — resume
    auto, or stay safe until a human confirms?
20. Who is allowed to trigger the **logical emergency stop**, and what exactly
    should it do (stop everything, or a subset)?
21. When the system acts automatically, how should it **notify** the operator — and
    can the operator veto an action before it happens?

## E. Deployment priorities & success indicators (KPIs)

22. Should we **pilot one warehouse** first, or roll out **per country**? Which site
    is the pilot candidate?
23. What downtime or disruption is acceptable **during installation**?
24. Who **operates** the system day‑to‑day after go‑live — site staff, or HQ?
25. What **training** do warehouse managers need to trust and run the system?
26. How will we **measure success** — % of time in band, number of alerts, spoilage
    rate, energy use, manual interventions avoided?
27. What are the **target values** for those KPIs, and over what period?
28. **Who reviews** the indicators, and how often?

## F. Risks & incident scenarios

29. What is the **biggest fear** about handing control to an automated system?
30. What must happen if **sensor data goes stale** (no reading for a while)?
31. What must happen if an **actuator fails** or has no measurable effect?
32. What must happen if the **MQTT broker or network is down** — autonomous local
    control, or a safe shutdown?
33. What is the **worst‑case scenario** to design against (heatwave, flood,
    prolonged power outage)?
34. Has there been a **past incident** that must never happen again?
35. Is there anything in the [automation schema](automation-schema.md) that looks
    **wrong or unrealistic** on the ground?

## Wrap-up

- ✅ Recap the **decided** points aloud for confirmation.
- 🕓 List the **to confirm** items, each with an **owner** and a **date**.
- ➡️ Agree the next step and **who produces** the phase‑2 specification.

> 📸 **[SCREENSHOT]** — the completed questionnaire (this template with answers and
> decided/to-confirm/out-of-scope tags filled in) as the annex to the phase‑2
> framing note.

See also the [automation schema](automation-schema.md) for the technical principle
these answers will turn into a specification.
