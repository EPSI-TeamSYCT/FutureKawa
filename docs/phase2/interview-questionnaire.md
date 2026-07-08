# Interview Questionnaire

Structured questionnaire for the next **client interview**, to scope the phase 2
**warehouse automation** (heating / humidification / ventilation driven by the
sensors). It complements the [automation schema](automation-schema.md): the schema
states the technical principle, this questionnaire gathers the decisions needed to
turn it into a specification.

Use it as a checklist during the interview; capture the answers directly under each
question.

## How to use

- One facilitator asks, one takes notes.
- Mark each answer as **decided**, **to confirm**, or **out of scope**.
- Every "it depends" must end with **who decides** and **by when**.

## 1. Business objectives

1. What problem should automation solve first — reduce spoilage, reduce manual
   workload, ensure traceability, other?
2. What does success look like in one sentence for a warehouse manager?
3. Which warehouses/countries are the priority for a first deployment?
4. Is the goal full automation, or assisted operation with a human in the loop?

## 2. Storage tolerances & setpoints

5. Are the current ideal bands correct (BR 29 °C/55 %, EC 31 °C/60 %,
   CO 26 °C/80 %, ± 3 °C / ± 2 %)? Any per-warehouse exceptions?
6. Are there **hard limits** (never exceed) distinct from the ideal band?
7. How long can a value stay out of band before it is a real risk (minutes, hours,
   days)?
8. Do tolerances change by coffee type, season, or lot age?

## 3. Actuators & installation constraints

9. Which actuators exist or are planned per site — heating, humidification,
   ventilation, dehumidification, cooling?
10. Their capacity vs. warehouse volume — can they actually hold the band in the
    worst season?
11. Electrical, water and space constraints on site?
12. Any existing building-management or HVAC system to integrate with rather than
    replace?

## 4. Manual vs automatic modes

13. Should each warehouse support auto / manual / off modes? Who can switch modes?
14. Should overrides be possible remotely from the web app, on site, or both?
15. What is the expected default state after a power cut or restart?
16. Who is allowed to trigger the **emergency stop**, and what should it do exactly?

## 5. Safety & incident scenarios

17. What must happen if sensor data goes stale (no reading for a while)?
18. What must happen if an actuator fails or has no effect?
19. What must happen if the MQTT broker or the network is down — autonomous local
    control, or safe shutdown?
20. Worst-case scenario to design against (heatwave, flood, prolonged outage)?
21. Are there safety or fire regulations the automation must comply with?

## 6. Constraints — security, maintenance, cost, responsibility

22. **Security:** who may send commands? What authentication/authorisation is
    required for a control action?
23. **Maintenance:** who maintains the hardware on site? Expected availability?
24. **Cost:** budget envelope per site (equipment + running cost)? Energy-cost
    ceiling?
25. **Responsibility:** if automation damages a lot, who is accountable — is a
    human confirmation required for critical actions?
26. Data retention and audit requirements for automatic actions?

## 7. Deployment priorities & rollout

27. Pilot on one warehouse first, or roll out per country?
28. Acceptable downtime / disruption during installation?
29. Who operates the system day-to-day after go-live (site staff vs HQ)?
30. Training needs for warehouse managers?

## 8. Success indicators (KPIs)

31. How to measure success — % of time in band, number of alerts, spoilage rate,
    energy use, manual interventions avoided?
32. What are the target values and over what period?
33. Who reviews these indicators and how often?

## 9. Risks & open questions

34. Biggest fear about handing control to an automated system?
35. Any past incident that must not happen again?
36. Anything in the [automation schema](automation-schema.md) that looks wrong or
    unrealistic on the ground?

## Wrap-up

- Recap the **decided** points aloud for confirmation.
- List **to confirm** items with an owner and a date.
- Agree the next step and who produces the phase 2 specification.
