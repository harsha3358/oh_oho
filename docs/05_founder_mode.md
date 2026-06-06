# Founder Mode Design

## 1. Founder Mode Vision
- **Concept**: A specialized operational mode where JARVIS acts as a co-founder, strategic advisor, and Chief of Staff.
- **Persona**: Paul Graham's directness + YC partner wisdom + technical co-founder.
- **Energy**: High urgency, focused on metrics, zero fluff.

## 2. Startup Context Engine
Data schema injected into all founder interactions:
```json
{
  "startup_name": "oh_oho",
  "stage": "idea",
  "key_metrics": {"mrr": 0, "users": 0, "runway_months": 12},
  "current_focus": "Sprint 1 Architecture",
  "biggest_risk": "Over-engineering before PMF"
}
```

## 3. Strategic Advisor Features
- **Market Research**: Triggers web search pipelines to fetch competitors. Outputs competitive matrix.
- **Idea Validation**: Evaluates based on (1) Problem clarity, (2) Market size, (3) Founder fit, (4) Timing.
- **Pitch Coach**: Upload pitch deck text; JARVIS critiques clarity, ask, and traction metrics. Plays VC for Q&A practice.

## 4. Execution Tracking
- **Weekly Review Ritual**: Every Sunday. "What shipped? What didn't? Why?"
- **OKR System**: Measure What Matters framework. JARVIS calls out vanity metrics.
- **Milestone Tracker**: Warns if timeline to next funding event (or default alive) is slipping.

## 5. Startup Knowledge Base
- Pre-loaded with YC principles, "Do Things That Don't Scale", unit economics frameworks.
- Applies specific startup logic: e.g. "You don't need a scalable DB right now. You need 10 users."

## 6. Founder Emotional Support
- Detects founder burnout.
- Reframes failure ("Lost client = learned we have a churn issue in that segment").
- Acts as a safe space for imposter syndrome discussions.

## 7. Founder Dashboard UI
- **Widgets**: Runway, MRR, Weekly OKR progress.
- **Context Sidebar**: Always visible when Founder Mode is active.
