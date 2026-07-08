# FAQ & Troubleshooting

Quick answers to common questions. If your problem is not listed, contact your
FutureKawa administrator.

## Using the app

**Which browser should I use?**
Any recent browser works: Chrome, Edge, Firefox or Safari.

**How do I switch between light and dark theme?**
Press `t`, or use the **Settings** screen.

**How do I find a specific lot or warehouse quickly?**
Press `⌘K` (Mac) or `Ctrl+K` (Windows) to open the command palette and start
typing. Press `/` to jump to search.

**Why does the app keep showing only one country?**
A country (and possibly a warehouse) filter is active at the top of the app. Change
or clear it to see the other sites.

## Stocks and lots

**Why is the lot list not sorted by identifier?**
The list is sorted **FIFO** — oldest lot in storage first. This is intentional: it
shows the order in which coffee should leave the warehouse.

**What does "out of range" mean on a lot?**
Temperature or humidity has drifted outside the country's tolerance band. See
[Understanding alerts](alerts.md).

**What does "too old" mean?**
The lot has been stored for more than 365 days and should be shipped in priority.

## Charts and alerts

**The curve briefly left the band but there is no alert. Why?**
A single short spike is not treated as a problem. Only a **sustained** drift raises
an alert. See [Reading the charts](reading-charts.md).

**I fixed a problem — how do I clear the alert?**
Open the alert and **mark it as handled**. It then leaves the active list.

**The values do not seem to change when I refresh. Is it broken?**
Live warehouse views refresh automatically. In a demonstration environment the
measurements are stable on purpose, so the numbers may not move.

## Still stuck?

Contact your FutureKawa administrator or headquarters contact for help.
