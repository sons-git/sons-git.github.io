// -------------------------------------------------------------
// Portfolio content — single source of truth.
// Rich, long-form data pulled from biography-full.md.
// -------------------------------------------------------------

export const profile = {
  name: 'Tang Trung Son',
  preferred: 'Son',
  role: 'AI Engineer',
  company: 'Rackspace',
  tagline: 'I design, integrate, deploy, and maintain enterprise AI systems — production agents and copilots that augment expert workflows rather than replace them.',
  location: 'Ho Chi Minh City, Vietnam',
  email: 'Business.ttson@gmail.com',
  phone: '+84 339 104 205',
  github: 'https://github.com/sons-git',
  linkedin: 'https://www.linkedin.com/in/sons-linked-in/',
  resume: '#',  // placeholder — will link to downloadable resume
};

// -------------------------------------------------------------
// SECTION_BEHAVIORS — the single source of truth per section.
// Read by orchestrator.js, shapeSystem.js, layoutMotion.js, and
// scan.js so that adding a section is a data-only edit
// (Requirement R12.1, R12.3; Design §Data Models).
//
// Each entry:
//   idx             — 0..7, matches scrollState.section
//   name            — machine key (kebab)
//   label           — HUD label (uppercased)
//   shape           — SENTINEL preset baseline (R1.3)
//   baselineMode    — companion mode baseline
//   program         — key into orchestrator.buildProgram()
//   layout          — key into layoutMotion recipes (R6.1)
//   layoutStructure — rest-state structural layout id (R9.1–R9.7)
//   home            — normalized fallback anchor {x, y} in [0..1]
//   scanner?        — true only for sections that render the scanner
// -------------------------------------------------------------
export const SECTION_BEHAVIORS = [
  {
    idx: 0, name: 'hero', label: 'HERO',
    shape: 'orb',
    baselineMode: 'idle',
    program: 'hero',
    layout: 'hero',
    layoutStructure: 'hero-split',
    home: { x: 0.78, y: 0.34 },
  },
  {
    idx: 1, name: 'approach', label: 'APPROACH',
    shape: 'prism',
    baselineMode: 'analyze',
    program: 'approach',
    layout: 'approach',
    layoutStructure: 'manifesto-rows',
    home: { x: 0.90, y: 0.70 },
  },
  {
    idx: 2, name: 'journey', label: 'JOURNEY',
    shape: 'ring',
    baselineMode: 'trace',
    program: 'journey',
    layout: 'journey',
    layoutStructure: 'editorial-timeline',
    home: { x: 0.88, y: 0.50 },
  },
  {
    idx: 3, name: 'work', label: 'WORK',
    shape: 'shard',
    baselineMode: 'index',
    program: 'work',
    layout: 'work',
    layoutStructure: 'editorial-spotlight-list',
    home: { x: 0.90, y: 0.50 },
    scanner: true,
  },
  {
    idx: 4, name: 'skills', label: 'SKILLS',
    shape: 'lattice',
    baselineMode: 'parse',
    program: 'skills',
    layout: 'skills',
    layoutStructure: 'terminal-manifest',
    // Sits deep in the right gutter so the mf-manifest column reads
    // clean on the left and SENTINEL's scan-fan visibly reaches
    // across to the hovered group. Capped to stay within EDGE_PAD
    // (40 px) on 1440 px viewports.
    home: { x: 0.94, y: 0.55 },
  },
  {
    idx: 5, name: 'recognition', label: 'RECOGNITION',
    shape: 'seal',
    baselineMode: 'verify',
    program: 'recognition',
    layout: 'recognition',
    layoutStructure: 'trophies-plus-cert-table',
    home: { x: 0.88, y: 0.35 },
  },
  {
    idx: 6, name: 'vision', label: 'VISION',
    shape: 'halo',
    baselineMode: 'broadcast',
    program: 'vision',
    layout: 'vision',
    layoutStructure: 'editorial-column',
    home: { x: 0.50, y: 0.22 },
  },
  {
    idx: 7, name: 'contact', label: 'CONTACT',
    shape: 'arrow',
    baselineMode: 'await',
    program: 'contact',
    layout: 'contact',
    layoutStructure: 'email-hero-meta-strip',
    home: { x: 0.85, y: 0.68 },
  },
];

// ---------- Manifesto / principles ----------
export const principles = [
  {
    num: '01',
    title: 'Capability over tools',
    body: 'Technology stacks change. Engineering judgement compounds. Ship the outcome, name the tool second.',
  },
  {
    num: '02',
    title: 'Configurable by design',
    body: 'YAML over hardcoded logic. Extensible architectures over one-off scripts. Systems that outlive their first requirements.',
  },
  {
    num: '03',
    title: 'Augment, don\'t replace',
    body: 'The best AI keeps the expert in the loop. Reliability, transparency, and trust are features, not overhead.',
  },
  {
    num: '04',
    title: 'First principles',
    body: 'I built my own multi-agent orchestration platform to understand orchestration — not to ship a framework. Curiosity is the compass.',
  },
];

// ---------- Experience timeline ----------
// Ordered latest → oldest (reverse-chronological by most recent activity).
// Rackspace is ongoing so it stays at the top; RMIT graduation (Sep 2025)
// sits above VDI + Club which both ended Jan 2024.
export const experience = [
  {
    title: 'AI Engineer',
    company: 'Rackspace',
    date: 'Jul 2025 — Present',
    location: 'Enterprise AI',
    desc: 'Building production AI agents and copilots for enterprise clients across the full SDLC. Owning UI, enterprise API integration, agent tool configuration, prompt engineering and management, response caching, secure auth and token exchange, cloud deployment, and architecture input for multi-agent evolution.',
    tags: ['Enterprise AI', 'Agent Systems', 'Prompt Engineering', 'Cloud Deployment', 'Production Support'],
  },
  {
    title: 'B.Sc Information Technology',
    company: 'RMIT Vietnam',
    date: 'Graduated Sep 2025',
    location: '3.6 / 4.0 · Top 5% of cohort',
    desc: 'Software engineering, algorithms, OOP, databases, machine learning, AI fundamentals. Sole recipient of the Professor Nguyen Van Dao Scholarship — awarded to the applicant with the highest high school mathematics performance across all applicants that year.',
    tags: ['Software Engineering', 'ML', 'Algorithms', 'Scholarship Recipient'],
  },
  {
    title: 'Big Data Intern',
    company: 'VDI',
    date: 'Jul 2023 — Jan 2024',
    location: 'Hanoi, Vietnam',
    desc: 'Processed and analyzed large-scale datasets. Optimized data pipelines and query performance, cutting execution time by 25% and improving processing efficiency by 20%. Contributed to an API management platform covering authentication, logging, and monitoring.',
    tags: ['Python', 'PySpark', 'Hadoop', 'SQL', 'Docker', 'C#/.NET'],
  },
  {
    title: 'President — Charity & Environment Club',
    company: 'RMIT Vietnam',
    date: 'Feb 2023 — Jan 2024',
    location: 'Hanoi, Vietnam',
    desc: 'Led a 50-member executive team across multiple departments. Delivered 12+ community, fundraising, and environmental events. Secured 50M+ VND in sponsorship through proposals and long-term partnerships; grew total sponsorship funding by 40% and membership by 30%.',
    tags: ['Leadership', 'Ops', 'Stakeholder Mgmt', 'Fundraising'],
  },
];

// ---------- Projects (rich, sourced from Jul 2026 resume + steering) ----------
// Order: Rackspace production first (Design Agent hero), then Real Estate
// MVP pair, then personal research projects (Multi-Agent → Ontology → VNX),
// then academic × industry (AHA), then hackathon (AWS). Each project's
// `sections` array powers the modal case study — richer for personal
// projects since the source material (project-*.md steering) is deeper.
export const projects = [
  {
    id: 'design-agent',
    title: 'Enterprise AI Design Agent',
    subtitle: 'AI engineering assistant for product design',
    badge: 'Production · Rackspace',
    year: '2026',
    role: 'AI Engineer',
    stack: ['Agent Architecture', 'Prompt Mgmt', 'Enterprise APIs', 'Cloud', 'Auth', 'Caching'],
    summary: 'Compressed manufacturing-feasibility evaluations from multi-week engineering reviews to minutes. ~100 ms production latency, 85% accuracy on evaluation benchmarks.',
    sections: [
      {
        heading: 'Business context',
        body: 'Traditionally, designing a viable product required experienced engineers to perform numerous technical evaluations over several weeks — analysing design parameters, validating engineering constraints, determining manufacturing feasibility, identifying compatible production equipment, and ensuring the proposed design could be manufactured within existing factory capabilities.',
      },
      {
        heading: 'What the agent does',
        body: 'Automates much of that reasoning process, enabling complex engineering assessments to complete within minutes rather than weeks — while still allowing engineers to review and validate the final recommendations. It evaluates constraints, performs design calculations, determines manufacturing feasibility, identifies compatible machinery, and retrieves engineering knowledge from enterprise data sources.',
      },
      {
        heading: 'My contributions',
        body: 'Owned prompt engineering and prompt management governing agent reasoning consistency across long conversation traces. Contributed to high-level system architecture and led low-level design across UI, agent tooling, and integration components. Delivered the front-end end-to-end. Built enterprise integration across APIs, structured data sources, secure auth and token-exchange flows. Implemented response caching and reliability instrumentation. Deployed to cloud infrastructure and supported production traffic with client-stakeholder engagement across UAT and post-release.',
      },
      {
        heading: 'What it taught me',
        body: 'Enterprise AI is a discipline, not a technology. Valuable AI systems require combining artificial intelligence with software engineering, cloud infrastructure, security, enterprise integration, deployment, and domain expertise. Model quality matters; everything around the model matters more.',
      },
    ],
  },
  {
    id: 'real-estate-copilot',
    title: 'Enterprise Real Estate Copilot',
    subtitle: 'Conversational decision-support for commercial real estate',
    badge: 'MVP · Rackspace',
    year: '2025',
    role: 'AI Engineer',
    stack: ['Conversational AI', 'Workflow Logic', 'Geospatial Reasoning', 'Structured Search'],
    summary: 'MVP copilot guiding investment teams through property evaluation using orchestrated multi-step workflows over a ~100k-record property dataset.',
    sections: [
      {
        heading: 'What it does',
        body: 'Assists commercial real estate professionals throughout the property evaluation process. Retrieves property information from enterprise data sources, searches structured databases spanning ~100,000 records, answers questions about property characteristics, computes geospatial reasoning for property-to-amenity distances, and guides investment evaluation via conversational workflows.',
      },
      {
        heading: 'The engineering challenge',
        body: 'Unlike consumer chatbots, this required reliable orchestration across multiple enterprise knowledge sources. Not just generating responses — but understanding user intent, retrieving relevant information, coordinating multiple workflows, producing consistent outputs, and guiding users through complex conversational interactions. Balancing conversational flexibility with predictable system behaviour.',
      },
      {
        heading: 'My contributions',
        body: 'Designed and implemented conversational workflows over the ~100k-record property dataset. Shaped agent behaviour and business-specific workflow logic through iterative product discovery with client stakeholders. Improved conversational reliability and response validation across successive MVP iterations.',
      },
      {
        heading: 'What it taught me',
        body: 'Successful enterprise AI assistants require considerably more than strong language models. Effective systems depend equally on workflow design, orchestration, integration, testing, and continuous refinement.',
      },
    ],
  },
  {
    id: 'multi-agent',
    title: 'Configurable Multi-Agent AI Platform',
    subtitle: 'Framework-free Python orchestrator, built from first principles',
    badge: 'Personal Research',
    year: '2026',
    role: 'Sole author',
    stack: ['Multi-Agent', 'MCP', 'YAML Config', 'FastAPI', 'Docker', 'LiteLLM'],
    summary: '~60k Python LOC + ~13k YAML across 371 files. Nine coordination protocols, six-tier memory, MCP integration with 16 built-in SWE tools, autonomous director. CLI + REST + Streamlit.',
    sections: [
      {
        heading: 'Why build this',
        body: 'After exposure to enterprise AI and the rise of agentic frameworks — LangChain, LangGraph, CrewAI, AutoGen, OpenAI Swarm, AWS Agent-Squad — I wanted to understand how collaborative AI systems actually function beneath the abstractions. Rather than adopt any of them, I built the same design space from scratch. No external agent-framework dependency. The goal was first-principles understanding of orchestration.',
      },
      {
        heading: 'Architecture — 5-tier stack',
        body: 'Entry tier (CLI runner, FastAPI REST on :8000, Streamlit UI). Core tier (Orchestrator, WorkflowEngine, ProtocolFactory). Executors — one per protocol plus a nested workflow package with scope triage → plan builder → lazy agent loader → supervisor controller → quality gate → HITL handler. Agents tier with an in-process MessageBus (pub/sub + request/response + topic subscription). Infra tier (LLM clients, DB, cache, embeddings, resilience: retry / rate-limit / circuit breaker, logging).',
      },
      {
        heading: 'Nine coordination protocols',
        body: 'Sequential, parallel, hierarchical, handoff, consensus, auction, broadcast, swarm, group-chat. Seven stable, two WIP (swarm, group-chat). Each executor lives in its own file with a shared interface. Redis blackboard auto-enabled for parallel / swarm / group-chat / consensus / auction so agents can share intermediate state without RPC round-trips.',
      },
      {
        heading: 'Six-tier memory system',
        body: 'ShortTermMemory (TTL cache). LongTermMemory (Postgres + Redis-vector RAG). SharedMemory (Redis blackboard). EpisodicMemory (episode consolidation). SemanticMemory (knowledge search with per-agent Markdown ingest). PhaseContextStore. Async everywhere — asyncio + asyncpg + aioredis.',
      },
      {
        heading: 'MCP integration + 16-tool SWE suite',
        body: 'Native Model Context Protocol client + a built-in MCP server exposing 16 software-engineering tools: write_code, read_code, validate_syntax, review_code, execute_code, run_tests, lint_code, format_code, create_artifact, list_artifacts, read_artifact, project_summary, insert_code, replace_lines, append_code, find_and_replace. Also compatible with standard MCP servers (filesystem, GitHub, Postgres, brave-search, gdrive).',
      },
      {
        heading: 'The autonomous director',
        body: 'Ingests an end-user prompt → clarifying questions (min 2 / max 4) → scope triage (threshold 0.65, rejects out-of-scope with a helpful message) → phase plan across ~25 roles (CEO, CTO, product analyst, UX / UI / accessibility, tech-lead, frontend / backend / DB / security engineers, DevOps / SRE, QA lead + manual / automation / performance / security testers, release manager, technical writer, deployment engineer, support liaison…) → writes runnable project scaffold to disk under `workspace/<name>/{docs, src/frontend, src/backend, src/infrastructure, tests}` with an artifact_manifest.json audit trail. For "build a crossword app" you get a runnable scaffold with HTML/CSS/JS + Docker + CI + tests.',
      },
      {
        heading: 'LLM abstraction — 11 providers',
        body: 'Single unified LiteLLM factory auto-detects provider from endpoint. Typed response wrappers (ChatCompletionResponse, UsageStats, ToolCall). Azure OpenAI + Azure AI Foundry fully tested with gpt-4o + text-embedding-3-small. Also reachable: OpenAI, Anthropic, AWS Bedrock, Google Vertex / Gemini, Ollama, LM Studio, vLLM, any OpenAI-compatible endpoint.',
      },
      {
        heading: 'Scope stats — measured, not estimated',
        body: '371 files total · 80,419 LOC. Python: 60,719 LOC across 256 files. YAML: 12,922 LOC across 78 config files (11 top-level workflows + 8 nested workflow packages). Markdown docs: 32 files, 6,270 lines. ~30 pytest files with live integration for Postgres, Redis vector, MCP, LLM providers, memory, and protocols. Full Docker Compose stack (Postgres 16, Redis Stack, MCP server) with healthchecks. GitHub Actions CI with ruff + mypy + bandit.',
      },
      {
        heading: 'Why it matters',
        body: 'The value is not the technologies but what it demonstrates — first-principles thinking, systems thinking, architectural curiosity, a preference for configurable over hardcoded. 256 Python files and ~30 test suites reflect sustained personal investment well beyond any course project.',
      },
    ],
  },
  {
    id: 'ontology-engine',
    title: 'Ontology Engine',
    subtitle: '"Palantir Foundry for Vietnamese SMEs"',
    badge: 'Personal Research',
    year: '2026',
    role: 'Sole author',
    stack: ['Ontology Inference', 'ReAct Agent', 'Hypothesis PBT', 'Claude Sonnet 4', 'PhoBERT'],
    summary: 'Framework-free engine that ingests messy business data and auto-infers a typed ontology, then lets a ReAct agent answer operational questions through an auto-generated typed tool catalog. ~28,300 source LOC · ~57,500 test LOC · ~3,140 pytest tests (~2× test-to-source ratio).',
    sections: [
      {
        heading: 'The pitch',
        body: 'A Python engine that ingests messy multi-source business data (Excel, Postgres), automatically infers a typed business ontology, and lets an LLM answer operational questions like "why did revenue fall last month?" through an auto-generated typed tool catalog. No dashboards, no analysts, no forward-deployed engineers — a small business connects its data and asks questions in Vietnamese or English.',
      },
      {
        heading: 'Six-stage inference pipeline',
        body: 'Profile → SemanticType → TableRole → Link → EntityResolve → Instantiate. Each stage runs a 3-tier cascade: alias-dict lookup → embedding similarity → LLM fallback. Confidence is multiplicative across stages — every property, link, and instance carries a confidence score. Below 0.3 the system explicitly caveats; above 0.7 it answers confidently.',
      },
      {
        heading: 'Framework-free ReAct agent (~150 LOC)',
        body: 'A hand-rolled ReAct loop — Thought → Action → Observation, capped at 10 iterations and 30 s per step. No LangChain, no LangGraph — TODO.md explicitly rejects them: "we already have all primitives, the loop is 150 lines, avoids dependency bloat." Reasons over an auto-generated typed Tool Catalog that is the single choke point between AI and data.',
      },
      {
        heading: 'Static AST import guard',
        body: 'LLMs never see raw SQL, never touch the store directly. `_import_guard.py` uses static AST analysis to enforce this as an executable invariant — rare to see architectural rules turned into testable, CI-enforced checks. When a new object type joins the pack, the tool catalog auto-generates `get_X`, `count_X`, `traverse_X` methods; the LLM only ever sees these typed tools.',
      },
      {
        heading: 'Four specialized LLM roles',
        body: 'ReAct agent (Tier 2, planning + answering, Sonnet-class model). LLM Reasoner (Tier 1, anomaly detection + causal decomposition, runs on data-sync triggers). LLM Schema Architect (Tier 1, proposes new ObjectType definitions when data doesn\'t fit a pack). LLM Formatter (Haiku-class, cheap synthesis). Coordinated across Anthropic Claude Sonnet 4 + Haiku with an OpenAI GPT-4o swap-in path and cross-provider fallback.',
      },
      {
        heading: 'Vietnamese-first vertical packs',
        body: 'Three vertical packs (Retail, Services, Distribution) shipped as declarative YAML — 5 object types, 4 link types with cardinality (`one_to_many`, `many_to_one`, `many_to_many`), 3 derived metrics per pack. Vietnamese-first locale everywhere: VND number formatting ("2.3 triệu"), dd/mm/yyyy dates, Tết lunar-holiday regressors, PhoBERT embeddings, diacritic-insensitive search. Not a generic template dressed up with translations.',
      },
      {
        heading: 'Roadmap — the "business twin" pivot',
        body: 'Five active specs define the next evolution — from "typed ontology + Q&A" (today) to a business twin capable of prescription and simulation. (1) Kinetic Layer: Action Types + Lifecycles + Roles from Palantir Foundry + DEMO. (2) Structural Discovery: HyFD / Hydra CFD & DC mining, pm4py object-centric process mining, Ditto entity resolution. (3) Statistical Fabric: STL + Prophet with Tết regressors, hierarchical Bayesian productivity profiles. (4) Prescriptive Reasoning: LLM-Modulo pattern (Kambhampati ICML 2024) — LLM formalizes, solver decides, LLM explains. (5) ReAct Hardening: confidence from tool outcomes, memory verification, general-purpose query capability.',
      },
      {
        heading: 'Scope stats — measured, not estimated',
        body: '~28,300 source LOC across 172 Python files. ~57,500 test LOC across 212 test files. ~3,140 pytest tests including hypothesis property-based. 2× test-to-source ratio — way past demo scale. 8 architectural layers with enforced import rules. 5 tool categories auto-generated from the ontology (get_*, count_*, traverse_*, metric_*, search) + 2 power tools (decompose_metric, filter_entities). ~5,800 LOC of deprecated / legacy code preserved under `_deprecated/` — evidence of iterative learning across v1 (regex classifier) → v2 (linear Plan-Execute-Format) → current ReAct.',
      },
    ],
  },
  {
    id: 'vnx-engine',
    title: 'VNX Engine',
    subtitle: 'AI-powered Vietnamese equities intelligence platform',
    badge: 'Personal Research',
    year: '2026',
    role: 'Sole author',
    stack: ['LangGraph', 'PyTorch', 'GAT + LSTM', 'SHAP', 'GCP Vertex AI', 'React'],
    summary: 'End-to-end platform: 12-node LangGraph debate + ReAct supervisor + 12 ML model families + RL portfolio allocator + paper-trading engine. ~37,400 Python LOC, 1,657 tests, ~5,700 frontend LOC.',
    sections: [
      {
        heading: 'The pitch',
        body: 'An AI-powered Vietnamese equities intelligence platform combining 12+ ML models, multi-agent LLM debate, NLP sentiment (VI + EN), reinforcement-learning portfolio allocation, and a paper-trading engine — exposed through a React dashboard, Chainlit chat, and FastAPI backend. Ask "should I buy FPT?" and get a bull/bear/risk debate, technical + fundamental + sentiment analysis, ML price signals, SHAP factor breakdown, and a 5-class rating with conviction level.',
      },
      {
        heading: '12-node LangGraph debate graph',
        body: '4 analyst nodes (technical / sentiment / news / fundamentals) → 3-round bull ↔ bear ↔ research-manager investment debates → trader bridge → 3-way risk debate (aggressive / conservative / neutral) → portfolio-manager gate emitting a 5-class rating (buy / overweight / hold / underweight / sell). Configurable N rounds per debate stage, conditional edges route based on round counter, compiled via `StateGraph.compile()` and streamed via `.stream()`.',
      },
      {
        heading: 'ReAct supervisor + 6 sub-agents',
        body: 'Primary chat mode: 1 top-level ReAct agent, 1 supervisor, 6 specialized sub-agents (analysis, comparison, debate, fundamentals, research, screening), 21 distinct agent prompt templates in `prompts/`. LangGraph 0.4 + `langgraph-supervisor` + `langgraph-checkpoint-sqlite` for persistent conversation memory.',
      },
      {
        heading: 'Twelve ML model families',
        body: 'LSTM, Transformer, TFT, XGBoost, GAT (torch-geometric), LSTM-GNN hybrid, ViT, Wavelet, HMM regime, FinBERT (English sentiment), PhoBERT (Vietnamese sentiment), VD-MEAC reinforcement-learning portfolio allocator. Regime-conditional weighting of ensemble outputs. Explainability across the ensemble via SHAP TreeExplainer for tree models, permutation importance for PyTorch models, TFT attention-weight interpretation.',
      },
      {
        heading: 'Coverage — 401 tickers + 8 data sources',
        body: 'Trained per-ticker across 401 HOSE tickers + HNX + UPCOM. Ingestion adapters: OHLCV (SSI FastConnect + TCBS + CafeF), Level 2 order-book depth, fundamentals (KBS Finance API), news (CafeF + VnExpress + Vietstock scrapers), social forums (F319, StockTraders, VnEconomy, FireAnt), insider filings, macro data (SBV rates, CPI, GDP, FX, SJC gold). Feature matrix: 23 columns per ticker (OHLCV + RSI, MACD, Bollinger, ADX, OBV, VWAP, rolling returns 1d/5d/20d, 20d vol, foreign flow ratio, sector momentum, market breadth).',
      },
      {
        heading: 'Five iterations of the trader agent',
        body: 'v1 → v2 → v4 → v5, culminating in v5 as an agentic ReAct loop where the LLM calls trading tools dynamically. Strategic Planner (monthly allocation) → Tactical Trader (3-day entries) → Auto Trader → Position Manager → Paper Engine. Simulated order execution against VN market fees, position tracking with ATR-based stops / take-profits, live P&L updates via WebSocket, persistent state in `paper_trading.json` + `vnx.db`. Backtests span 2024-02 through 2026-06.',
      },
      {
        heading: 'Delivery — React + Chainlit + FastAPI',
        body: 'React + TypeScript + Vite dashboard with 9 top-level views (Dashboard, MarketLandscape, MarketScanner, Intelligence, PaperTrading, Agents, Chat, AuditLog, Wizard). Chainlit conversational analyzer with tool-call visualizations, multi-agent debate summaries, SHAP factor breakdowns. FastAPI backend with 9 route modules + WebSocket broadcaster, JWT auth. Deployed on GCP Vertex AI + Cloud Run Jobs on T4 GPUs; Cloud Build pipeline.',
      },
      {
        heading: 'Scope stats — measured, not estimated',
        body: '~37,400 Python source LOC across 224 files. ~20,200 test LOC across 61 files with 1,657 test functions (property-based via Hypothesis). ~5,700 frontend LOC in TypeScript / TSX. 85 LangChain `@tool` functions. 5 LLM providers (OpenAI, Anthropic, Google Gemini, Ollama local, rule-based fallback). Actively developed prototype used for research and backtesting — not production-deployed.',
      },
    ],
  },
  {
    id: 'aha',
    title: 'AI Health Assistant (AHA)',
    subtitle: 'Voice-first medical assistant · Bachelor Capstone × FPT partnership',
    badge: 'Bachelor Capstone',
    year: '2025',
    role: 'PM + developer + DevOps',
    stack: ['DSPy', 'FastAPI', 'Qdrant', 'OpenAI Realtime', 'Cloud Run', 'SPLADE + e5'],
    summary: 'Voice-first medically-scoped AI assistant ingesting text, audio, images, documents. Two FastAPI microservices, DSPy-orchestrated, 9 integrated models, 27 API endpoints.',
    sections: [
      {
        heading: 'Two-service architecture',
        body: 'Data / orchestration plane (21 endpoints: auth, users, conversation store, dynamic worker queue, task classification, RAG retrieval, multimodal ingestion) and inference plane (6 endpoints: DSPy LLM / RAG / Summarizer, Whisper STT, OpenAI TTS, Realtime voice agent), coordinated through a shared Redis config store.',
      },
      {
        heading: 'Hybrid retrieval + agent coordination',
        body: 'Hybrid retrieval — dense (multilingual-e5-small, 384-dim) + sparse (SPLADE-cocondenser) embeddings fused via Reciprocal Rank Fusion (k=60) on Qdrant, per-user collections, 50-message rolling window, specialty-named medical knowledge stores per condition. Coordinated 5 agent / model roles: BART-MNLI zero-shot classifier routing to medical / code / off-topic, DSPy ChainOfThought multimodal responder, DSPy Predict summarizer, and an OpenAI Realtime voice agent.',
      },
      {
        heading: 'Two-way voice + multimodal ingest',
        body: 'Live voice loop via WebSocket over the OpenAI Realtime API — PCM16 @ 24 kHz, server VAD, inline Whisper transcription, with pyannote VAD + speaker-diarization-3.1 for multi-speaker clinical audio. Ingested 8+ file types and 8 audio formats with automatic VAD → diarization → per-segment Whisper transcription.',
      },
      {
        heading: 'My ownership',
        body: 'Team of 5; owned PM + developer + DevOps + stakeholder / business-management responsibilities. Balanced technical feasibility with usability under capstone constraints and an industry partnership with FPT — the largest IT firm in Vietnam.',
      },
    ],
  },
  {
    id: 'aws-hackathon',
    title: 'AWS Generative AI Hackathon',
    subtitle: 'End-to-end AI content workflow',
    badge: 'Top 2 · 2025',
    year: '2025',
    role: 'Team member',
    stack: ['AWS', 'GenAI', 'Automation', 'Rapid Prototyping', 'Multi-modal'],
    summary: 'End-to-end AI content pipeline — news retrieval, image generation, caption generation, automated LinkedIn publishing, workflow monitoring. Placed 2nd overall.',
    sections: [
      {
        heading: 'The build',
        body: 'A complete AI-powered content generation workflow. It retrieved current news, generated AI-created images, produced accompanying captions, published finished content to LinkedIn, and provided a UI for triggering and monitoring the workflow.',
      },
      {
        heading: 'What it demonstrated',
        body: 'Rapid prototyping under significant time pressure. Cloud AI integration. Workflow automation. API integration. User-focused application design. Practical deployment thinking. The Top 2 placement validated the ability to turn ideas into functional AI systems fast.',
      },
      {
        heading: 'The bigger point',
        body: 'Reinforced my interest in combining multiple AI capabilities into cohesive end-to-end systems, rather than treating each model or service in isolation.',
      },
    ],
  },
];

// ---------- Skills ----------
// Each group has a stable slug `key` and each item carries a `related`
// group key so `interactions.js` can render `data-related="{key}"` on
// every `.mf-list li` / `.skill-group li` and light up its constellation
// on hover (R7.4, R12.4; Design §Interaction Layer · Constellation).
// `related` defaults to the item's own group key; cross-group edges can
// be added later by overriding `related` on a per-item basis without
// touching interactions.js.
export const skills = [
  {
    key: 'ai-agents',
    group: 'AI & Agents',
    items: [
      { label: 'Conversational AI',        related: 'ai-agents' },
      { label: 'Prompt Engineering',       related: 'ai-agents' },
      { label: 'Prompt Management',        related: 'ai-agents' },
      { label: 'Multi-Agent Orchestration',related: 'ai-agents' },
      { label: 'Tool Use',                 related: 'ai-agents' },
      { label: 'Model Context Protocol',   related: 'ai-agents' },
      { label: 'Retrieval Systems',        related: 'ai-agents' },
      { label: 'Agent Evaluation',         related: 'ai-agents' },
      { label: 'Reinforcement Learning',   related: 'ai-agents' },
    ],
  },
  {
    key: 'languages',
    group: 'Languages',
    items: [
      { label: 'Python', related: 'languages' },
      { label: 'Java',   related: 'languages' },
      { label: 'C++',    related: 'languages' },
      { label: 'C#',     related: 'languages' },
      { label: 'SQL',    related: 'languages' },
      { label: '.NET',   related: 'languages' },
    ],
  },
  {
    key: 'cloud-deployment',
    group: 'Cloud & Deployment',
    items: [
      { label: 'Azure (AI-102, DP-100, AZ-900)', related: 'cloud-deployment' },
      { label: 'Google Cloud',                   related: 'cloud-deployment' },
      { label: 'AWS',                            related: 'cloud-deployment' },
      { label: 'Palantir Foundry',               related: 'cloud-deployment' },
      { label: 'Docker',                         related: 'cloud-deployment' },
      { label: 'Linux',                          related: 'cloud-deployment' },
      { label: 'Cloud-native Deployment',        related: 'cloud-deployment' },
      { label: 'Secure Auth & Token Exchange',   related: 'cloud-deployment' },
    ],
  },
  {
    key: 'data-systems',
    group: 'Data & Systems',
    items: [
      { label: 'PySpark',                related: 'data-systems' },
      { label: 'Hadoop',                 related: 'data-systems' },
      { label: 'SQL',                    related: 'data-systems' },
      { label: 'Pipeline Optimization',  related: 'data-systems' },
      { label: 'API Management',         related: 'data-systems' },
      { label: 'Enterprise Integration', related: 'data-systems' },
      { label: 'Structured Search',      related: 'data-systems' },
    ],
  },
  {
    key: 'software-engineering',
    group: 'Software Engineering',
    items: [
      { label: 'System Architecture',  related: 'software-engineering' },
      { label: 'Modular Design',       related: 'software-engineering' },
      { label: 'Testing & Debugging',  related: 'software-engineering' },
      { label: 'Full SDLC',            related: 'software-engineering' },
      { label: 'Full-Stack Web',       related: 'software-engineering' },
      { label: 'Git',                  related: 'software-engineering' },
      { label: 'Configurable Systems', related: 'software-engineering' },
    ],
  },
  {
    key: 'ways-of-working',
    group: 'Ways of working',
    items: [
      { label: 'Agile',                        related: 'ways-of-working' },
      { label: 'Iterative Delivery',           related: 'ways-of-working' },
      { label: 'UAT',                          related: 'ways-of-working' },
      { label: 'Production Support',           related: 'ways-of-working' },
      { label: 'Cross-functional Collaboration', related: 'ways-of-working' },
      { label: 'Stakeholder Comms',            related: 'ways-of-working' },
    ],
  },
];

// ---------- Recognition / certifications ----------
export const recognition = [
  { kind: 'award',   issuer: 'RMIT Vietnam',    name: 'Professor Nguyen Van Dao Scholarship',   note: 'Sole recipient · 50% tuition · highest maths score in intake year' },
  { kind: 'award',   issuer: 'AWS',             name: 'Generative AI Hackathon — Top 2',       note: '2025' },
  { kind: 'award',   issuer: 'RMIT Vietnam',    name: 'Top 5% of graduating BSc IT cohort',    note: 'GPA 3.6 / 4.0 · Sep 2025' },
  { kind: 'cert',    issuer: 'Microsoft Azure', name: 'Azure AI Engineer Associate',           note: 'AI-102',    link: 'https://learn.microsoft.com/api/credentials/share/en-us/TangSon-3785/59C6A596E733BA24?sharingId=35E44442CF27EF61' },
  { kind: 'cert',    issuer: 'Microsoft Azure', name: 'Azure Data Scientist Associate',        note: 'DP-100',    link: 'https://learn.microsoft.com/api/credentials/share/en-us/TangSon-3785/D0890BF3FCA9E93B?sharingId=35E44442CF27EF61' },
  { kind: 'cert',    issuer: 'Microsoft Azure', name: 'Azure Fundamentals',                    note: 'AZ-900',    link: 'https://learn.microsoft.com/api/credentials/share/en-us/TangSon-3785/A9B38CEAD691B120?sharingId=35E44442CF27EF61' },
  { kind: 'cert',    issuer: 'Google Cloud',    name: 'Cloud Digital Leader',                  note: '',           link: 'https://www.credly.com/badges/ac2fc2b0-2c6b-48a8-a1b7-019e08e01be4/public_url' },
  { kind: 'cert',    issuer: 'Palantir',        name: 'Foundry Aware',                         note: 'Foundry & AIP', link: 'https://verify.skilljar.com/c/vypdhawovas2' },
  { kind: 'cert',    issuer: 'Palantir',        name: 'Foundry Data Engineer',                 note: '',           link: 'https://verify.skilljar.com/c/6f6uzzvy4iez' },
  { kind: 'cert',    issuer: 'HarvardX',        name: 'CS50P — Programming with Python',       note: '',           link: './certs/CS50P.pdf' },
  { kind: 'cert',    issuer: 'BerkeleyX',       name: 'Data Science: Computational Thinking',  note: 'Python',    link: './certs/dataSci.pdf' },
];

// ---------- Vision / research interests ----------
export const vision = {
  headline: 'Designing intelligent systems that create measurable value in real-world environments.',
  body: 'I\'m interested in the complete lifecycle of intelligent systems — from research and system design to deployment, evaluation, maintenance, and continuous improvement. Particularly in problems where AI can augment human expertise rather than replace it.',
  interests: [
    { title: 'AI Systems Engineering', body: 'Models are components of a broader engineering ecosystem — deployment, observability, evaluation, governance, integration. This is the strongest long-term interest.' },
    { title: 'Intelligent Agents',      body: 'Planning, memory, reasoning, tool use, agent evaluation, collaboration between autonomous components.' },
    { title: 'Multi-Agent Systems',     body: 'Orchestration strategies, distributed problem solving, communication protocols, task decomposition, collaborative reasoning.' },
    { title: 'Human-AI Collaboration',  body: 'Decision-support systems, AI copilots, explainability, user trust, interaction design.' },
    { title: 'Enterprise AI',           body: 'Reliability, security, maintainability, scalability, regulatory constraints, real-world integration.' },
  ],
  nextStep: 'Pursuing postgraduate study to deepen the theoretical foundations — advanced ML, optimization, statistical learning, distributed AI systems, research methodology — while continuing to build production systems.',
};

// ---------- Stats (used in hero + about) ----------
export const stats = [
  { num: 'Top 2',  label: 'AWS Generative AI Hackathon 2025' },
  { num: 'Top 5%', label: 'RMIT Vietnam BSc IT cohort' },
  { num: '3.6',    sub: '/4.0', label: 'GPA — graduated Sep 2025' },
  { num: '50M+',   label: 'VND sponsorship secured as club president' },
  { num: '12+',    label: 'Events organized · 50-person team led' },
  { num: '25%',    label: 'Query time reduction · VDI internship' },
];
