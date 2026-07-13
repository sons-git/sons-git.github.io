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

// ---------- Projects (rich, sourced from Jul 2026 resume) ----------
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
    id: 'multi-agent',
    title: 'Configurable Multi-Agent AI Platform',
    subtitle: 'Framework-free Python orchestrator, built from first principles',
    badge: 'Personal Research',
    year: '2025 — Present',
    role: 'Sole author',
    stack: ['Multi-Agent', 'MCP', 'YAML Config', 'FastAPI', 'Docker', 'LiteLLM'],
    summary: '~60,000 LOC Python + ~13,000 LOC YAML. Nine coordination protocols, six-tier memory system, MCP integration, autonomous director. CLI + REST + Streamlit surfaces.',
    sections: [
      {
        heading: 'Why build this?',
        body: 'After exposure to enterprise AI and the rise of agentic frameworks, I wanted to understand how collaborative AI systems actually function beneath existing abstractions. Rather than adopting AWS Agent-Squad, LangChain, AutoGen, or OpenAI Swarm as-is, I built from scratch — same design space, no external agent-framework dependency, to develop first-principles understanding of orchestration.',
      },
      {
        heading: 'What it supports',
        body: 'YAML-configurable agents, prompts, tools, workflows, and memory. Nine coordination protocols — sequential, parallel, hierarchical, handoff, consensus, auction, broadcast, swarm, group-chat. Six-tier memory system: short-term, long-term (Postgres + Redis-vector RAG), shared blackboard, episodic, semantic, phase-context. Native Model Context Protocol integration with a 16-tool built-in SWE suite plus standard MCP servers.',
      },
      {
        heading: 'The autonomous director',
        body: 'Ingests an end-user prompt, runs scope triage, plans phases across ~25 product / engineering / QA / DevOps roles, and writes a runnable project scaffold to disk under governed HITL checkpoints. Three delivery surfaces (CLI, FastAPI REST, Streamlit UI) over a Docker Compose stack, reachable through 11 LLM providers via a LiteLLM abstraction with Azure OpenAI + Azure AI Foundry fully wired.',
      },
      {
        heading: 'Why it matters',
        body: 'The value is not in the technologies used but in what it demonstrates — first-principles thinking, systems thinking, architectural curiosity, experimentation, a preference for configurable systems, and continuous learning. The scale (256 Python files, ~30 pytest suites including live integration) reflects sustained personal investment beyond the shape of any single course.',
      },
    ],
  },
  {
    id: 'ontology-engine',
    title: 'Ontology Engine',
    subtitle: '"Palantir Foundry for Vietnamese SMEs"',
    badge: 'Personal Research',
    year: '2025 — Present',
    role: 'Sole author',
    stack: ['Ontology Inference', 'ReAct Agent', 'Hypothesis PBT', 'Claude Sonnet 4', 'PhoBERT'],
    summary: 'Framework-free engine that ingests messy multi-source business data and auto-infers a typed business ontology. ~28,300 source LOC · ~57,500 test LOC · ~3,140 pytest tests (~2× test-to-source ratio).',
    sections: [
      {
        heading: 'The inference pipeline',
        body: 'A 6-stage cascade — Profile → SemanticType → TableRole → Link → EntityResolve → Instantiate — with a 3-tier alias-dict → embedding → LLM cascade per stage, and multiplicative confidence propagation across the resulting ontology. Ingests Excel and Postgres sources with typed business semantics.',
      },
      {
        heading: 'Framework-free ReAct agent',
        body: 'A hand-rolled ~150-line ReAct loop — no LangChain, no LangGraph — reasoning over an auto-generated typed tool catalog. LLMs never see raw SQL, enforced as an executable invariant by a static AST import guard. Coordinates 4 specialised LLM roles (planner, reasoner, schema architect, formatter) across Anthropic Claude Sonnet 4 + Haiku with an OpenAI GPT-4o swap-in path and cross-provider fallback.',
      },
      {
        heading: 'Vietnamese-first, vertical packs',
        body: 'Three vertical packs (Retail, Services, Distribution) shipped as declarative YAML — 5 object types, 4 link types, 3 derived metrics per pack. Vietnamese-first locale: VND, dd/mm/yyyy, Tết lunar-holiday regressors, PhoBERT embeddings.',
      },
      {
        heading: 'Roadmap grounded in research',
        body: 'Five active specs — kinetic layer (actions / lifecycles / roles), structural discovery, statistical fabric, prescriptive reasoning, ReAct hardening — grounded in Palantir Foundry, DEMO, REA, Kambhampati LLM-Modulo (ICML 2024), pm4py process mining, and Prophet forecasting. Reflects a commitment to build AI infrastructure Vietnamese SMEs could actually use.',
      },
    ],
  },
  {
    id: 'vnx-engine',
    title: 'VNX Engine',
    subtitle: 'AI-powered Vietnamese equities intelligence platform',
    badge: 'Personal Research',
    year: '2025 — Present',
    role: 'Sole author',
    stack: ['LangGraph', 'PyTorch', 'GAT + LSTM', 'SHAP', 'GCP Vertex AI', 'React'],
    summary: 'End-to-end research platform: 12-node LangGraph debate + 12 ML model families + RL portfolio allocator + paper-trading engine. ~37,400 Python LOC, 1,657 test functions.',
    sections: [
      {
        heading: 'Multi-agent debate architecture',
        body: 'A 12-node LangGraph debate graph — 4 analyst nodes (technical / sentiment / news / fundamentals), 3-round bull ↔ bear ↔ research-manager debates, a trader bridge, 3-way risk debate (aggressive / conservative / neutral), and a portfolio-manager gate emitting a 5-class rating (buy / overweight / hold / underweight / sell) per ticker.',
      },
      {
        heading: 'Twelve ML model families',
        body: 'Ensemble of LSTM, Transformer, TFT, XGBoost, GAT (torch-geometric), LSTM-GNN hybrid, ViT, Wavelet, HMM regime, FinBERT, PhoBERT, and a VD-MEAC reinforcement-learning portfolio allocator — with regime-conditional weighting of ensemble outputs. Explainability across model families via SHAP TreeExplainer, permutation importance, and TFT attention-weight interpretation.',
      },
      {
        heading: 'Coverage + deployment',
        body: 'Trained per-ticker across 401 HOSE tickers + HNX + UPCOM with an ingestion layer for OHLCV, order-book depth, fundamentals, news, social forums, insider filings, and macro data (SBV rates, CPI, FX, SJC gold). Deployed on GCP Vertex AI + Cloud Run Jobs on T4 GPUs; backtests span 2024-02 through 2026-06 across 5 iterations of the trading agent (v5 an agentic ReAct loop over dynamic trading tools).',
      },
      {
        heading: 'Delivery surfaces',
        body: 'Served through a React dashboard, Chainlit chat, and FastAPI backend. Full-stack combining production ML engineering with front-end and API delivery on a scale that lives well outside a course project.',
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
