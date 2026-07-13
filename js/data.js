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
    stack: ['Enterprise AI', 'Agent Design', 'Prompt Engineering', 'Production Deployment', 'Client Delivery'],
    summary: 'Compressed manufacturing-feasibility evaluations from multi-week engineering reviews to minutes. ~100 ms production latency, 85% accuracy on evaluation benchmarks.',
    sections: [
      {
        heading: 'The problem',
        body: 'Designing a viable product used to take experienced engineers weeks — checking constraints, running calculations, deciding whether the shape they had in mind could actually be manufactured on the client\'s factory floor. It\'s deep, careful work that a company can only scale by hiring more of the same senior engineers.',
      },
      {
        heading: 'What the agent does',
        body: 'It walks through the same evaluation loop in minutes instead of weeks. Reads the design brief, checks it against engineering constraints, runs the feasibility math, points to which machines can produce it, pulls the relevant knowledge from the client\'s enterprise systems, and hands the engineer a written recommendation they can approve, reject, or push back on. Human still signs off. The agent just does the reading and the arithmetic first.',
      },
      {
        heading: 'What I owned',
        body: 'The front-end, end to end. The prompt architecture that keeps the agent reasoning consistently across long conversations. The integration into the client\'s enterprise APIs and structured data. Secure auth, token exchange, response caching, cloud deployment. Then production — sitting with the client through UAT, watching real usage after release, fixing what the agent got wrong in the wild. Also contributed to the multi-agent architecture the platform is evolving toward next.',
      },
      {
        heading: 'What it taught me',
        body: 'Enterprise AI is a discipline, not a technology. The model matters. Everything around the model — integration, auth, caching, deployment, the humans reviewing the output — matters more. This project is where that stopped being a slogan and started being how I approach the job.',
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
    stack: ['Conversational AI', 'Workflow Design', 'Retrieval Systems', 'Enterprise Data', 'MVP Delivery'],
    summary: 'MVP copilot guiding investment teams through property evaluation using orchestrated multi-step workflows over a ~100k-record property dataset.',
    sections: [
      {
        heading: 'What it does',
        body: 'Sits alongside commercial real estate professionals as they evaluate deals. Pulls up the property record, answers questions about it in plain language, ranks locations against the criteria the analyst actually cares about, and walks them through investment evaluation as a conversation instead of a spreadsheet crawl. Backed by a dataset of around 100,000 properties.',
      },
      {
        heading: 'The interesting part',
        body: 'This is not a chatbot. It has to be predictable enough that an analyst will trust it with a deal, and flexible enough that they can talk to it like a colleague. That tension — reliable orchestration underneath, conversational surface on top — is the whole engineering problem, and it\'s more interesting than any one model choice inside it.',
      },
      {
        heading: 'What I owned',
        body: 'Designed the conversational workflows over the property dataset, shaped the agent\'s behaviour through iterative discovery with the client\'s stakeholders, and drove the reliability work across MVP iterations — response validation, edge-case handling, the un-glamorous debugging that turns a demo into something a team will actually use.',
      },
      {
        heading: 'What it taught me',
        body: 'Enterprise AI assistants live or die on the workflow around the model, not the model itself. Discovery, iteration, testing, and honest conversations with the client about what "good" looks like matter more than any prompt-engineering trick.',
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
    summary: 'A multi-agent system built from scratch instead of assembled from a framework. Type a prompt, get a runnable software project written to disk by a team of coordinating AI agents.',
    sections: [
      {
        heading: 'Why build this',
        body: 'After a year of shipping enterprise AI at Rackspace, I wanted to understand how multi-agent systems actually work beneath the frameworks everyone reaches for — LangChain, LangGraph, CrewAI, AutoGen. So I built the same design space from scratch. No framework dependency. Same problems, my own answers. The exercise was the point.',
      },
      {
        heading: 'What it does',
        body: 'Composes specialist AI agents into workflows defined in plain YAML — sequential pipelines, parallel debates, hierarchical planning, handoffs, group chats. Every agent, prompt, tool, and memory system is a config file, not a code change. Runs from a command line, a REST API, or a Streamlit UI. Talks to any LLM (OpenAI, Anthropic, Azure, Bedrock, Vertex, Gemini, Ollama, and more) through one abstraction layer.',
      },
      {
        heading: 'The autonomous director',
        body: 'The showcase feature: type "build me a crossword app" and the system asks a few clarifying questions, plans phases across roughly 25 product / engineering / QA / DevOps roles, and writes a runnable project to disk — docs, code, tests, deployment config. It is not a template. The agents reason through the plan and adapt to what you actually asked for. Human-in-the-loop checkpoints are built in so you can review before big decisions.',
      },
      {
        heading: 'What it says about how I think',
        body: 'The value is not the code — plenty of frameworks solve these problems more quickly. It is what building it demonstrated: first-principles thinking, patience with hard architecture problems, a preference for configurable over hardcoded, and the willingness to invest substantial time in something because the questions were interesting. Sustained personal work on top of a full-time role.',
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
    summary: 'A data-intelligence engine for Vietnamese small and medium businesses. Point it at their spreadsheets, it builds a model of their business, and they can ask questions in their own language.',
    sections: [
      {
        heading: 'The idea',
        body: 'Palantir Foundry ships to Fortune 500 companies with forward-deployed engineering teams and eight-figure contracts. Vietnamese small businesses run on Excel and word-of-mouth, with nobody to build their data layer. This is an attempt to bring some of that same discipline — typed data, queryable knowledge, sensible AI on top — to businesses that don\'t have data teams.',
      },
      {
        heading: 'How it works',
        body: 'Point it at your workbooks or database. It reads through them, figures out what each column probably represents (customers, products, orders, payments), infers the relationships (this order belongs to that customer), and builds a typed model of the business. From there you can ask questions in Vietnamese or English — "who\'s my most valuable customer?" — and get an answer grounded in your real data, with citations back to the rows that supported it.',
      },
      {
        heading: 'Vietnamese-first, not translated',
        body: 'Every layer knows Vietnamese context: VND formatting ("2.3 triệu" not "2.3M"), dd/mm/yyyy dates, Tết treated as a real seasonal event (not an anomaly to explain away), diacritic-insensitive search. Business terminology from three verticals — retail, services, distribution — ships as configuration, not code, so operators can adjust the vocabulary themselves. This is not a generic template dressed up with translations.',
      },
      {
        heading: 'Where it\'s going',
        body: 'Today the engine describes what happened. The roadmap adds three things: understanding of business processes (how a sale actually flows through a company), statistical patterns (rhythms, forecasts, anomalies), and prescriptive reasoning (not just "revenue is down" but "here\'s what to try, and here\'s why"). Grounded in real research — Palantir\'s Foundry ontology, the LLM-Modulo pattern from ICML 2024, process mining literature — not guesswork.',
      },
      {
        heading: 'What it says about how I think',
        body: 'A response to a real problem I care about — access to serious data infrastructure for businesses in a market that big vendors won\'t serve. The engineering choices reflect that focus: framework-free where the abstractions would compromise clarity, test-heavy because trust is the product, and Vietnamese-native rather than English-first with translation bolted on.',
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
    summary: 'A research and paper-trading platform for the Vietnamese stock market. Analyst agents debate each stock, ML models predict, and a portfolio manager makes the call — all in one integrated pipeline.',
    sections: [
      {
        heading: 'The idea',
        body: 'Global markets have entire industries of AI-powered research tools. Vietnamese equities — HOSE, HNX, UPCOM — have very little of the same. VNX Engine brings a full research and paper-trading pipeline to the local market: Vietnamese-language sentiment analysis, Vietnamese-specific data sources, backtested against the Vietnamese trading calendar.',
      },
      {
        heading: 'How it works',
        body: 'Ask about a stock and four analyst agents review it separately — one on price patterns, one on news sentiment, one on fundamentals, one on social discussion. A bull agent and a bear agent then argue, each defending their thesis. A risk debate follows — aggressive, conservative, and neutral perspectives. A portfolio manager gives the final call: buy, overweight, hold, underweight, or sell, with the reasoning trail attached.',
      },
      {
        heading: 'Under the hood',
        body: 'Behind the debate are twelve different machine-learning model families working in parallel — deep-learning price forecasters, gradient-boosted classifiers, a graph neural network over the market\'s correlation structure, Vietnamese-language sentiment models, and a reinforcement-learning portfolio allocator. Explanations come from SHAP factor breakdowns for the tree models and attention-weight interpretation for the neural ones. Every recommendation carries a why.',
      },
      {
        heading: 'Coverage + delivery',
        body: 'Covers all 400+ tickers on HOSE plus HNX and UPCOM, with ingestion for order books, fundamentals, news, social forums, insider filings, and Vietnamese macro data. Runs through a React dashboard, a chat interface, and a REST backend. Trained on GCP; paper-trades against real market data across a multi-year backtest window. Not deployed to end users — the point is the pipeline and what it makes possible.',
      },
      {
        heading: 'What it says about how I think',
        body: 'Combines the two sides of my interest: classical machine-learning discipline (feature engineering, backtests, calibration, explainability) with modern LLM orchestration (multi-agent debate, ReAct-style tool use). Also a bet on a market I actually understand and care about — Vietnam is under-served by exactly this kind of tooling.',
      },
    ],
  },
  {
    id: 'aha',
    title: 'AI Health Assistant (AHA)',
    subtitle: 'Voice-first medical assistant · RMIT capstone × FPT industry partnership',
    badge: 'Bachelor Capstone',
    year: '2025',
    role: 'PM + developer + DevOps',
    stack: ['Voice AI', 'Medical Knowledge Retrieval', 'Real-time Systems', 'Cloud Deployment', 'Team Leadership'],
    summary: 'A voice-first, medically-scoped AI assistant built with a five-person team for our RMIT capstone in industry partnership with FPT — Vietnam\'s largest IT firm.',
    sections: [
      {
        heading: 'Why this one',
        body: 'Our capstone was run as an industry partnership with FPT, the largest IT firm in Vietnam. The brief: a medically-scoped AI assistant, safe enough to sit next to a clinician, capable enough to be useful to a patient. It was my first taste of building an AI product against a real industry partner rather than a lecturer\'s rubric, and it\'s what pivoted me fully into AI.',
      },
      {
        heading: 'What we built',
        body: 'A voice-first assistant that ingests almost anything a user throws at it — questions, documents, images, medical audio — routes each one through a classifier so off-topic requests are handled safely, retrieves specialty-specific context from a medical knowledge store, and responds in text or spoken voice. The whole thing runs on a two-service cloud architecture so the model-heavy work is isolated from the user-facing traffic.',
      },
      {
        heading: 'The live voice loop',
        body: 'The moment that sold the project in demos: you speak, the assistant listens, and it speaks back — in real time, over a live audio connection. For clinical recordings with multiple speakers, it also separates who said what before it reads the transcript, so a doctor–patient conversation stays legible. This part is where the "medical assistant" idea stopped being a chat window and started feeling like a tool a nurse might actually use.',
      },
      {
        heading: 'My role',
        body: 'Team of five; I wore four hats — product manager, developer, DevOps, and the person talking to FPT. Kept the scope honest against capstone timeline pressure, ran the cadence with our industry partner, owned the deployment path, and still wrote code. The clearest lesson: enterprise AI is as much about coordination as it is about models — and I liked doing both.',
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
