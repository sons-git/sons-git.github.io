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

// ---------- Projects (rich, biography-full sourced) ----------
export const projects = [
  {
    id: 'design-agent',
    title: 'Enterprise AI Design Agent',
    subtitle: 'AI engineering assistant for product design',
    badge: 'Production · Rackspace',
    year: '2025',
    role: 'AI Engineer',
    stack: ['Agent Architecture', 'Prompt Mgmt', 'Enterprise APIs', 'Cloud', 'Auth', 'Caching'],
    summary: 'Compressed multi-week manufacturing feasibility evaluations to minutes while keeping engineer-in-the-loop review.',
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
        body: 'Developed the UI. Integrated enterprise APIs. Configured AI agent tools. Prompt engineering and prompt management. Debugged agent behaviour. Resolved UAT issues. Implemented response caching. Built secure authentication and token exchange. Deployed application components to the cloud. Supported production. Contributed to the architectural design of the planned multi-agent evolution.',
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
    stack: ['Conversational AI', 'Workflow Logic', 'Reliability', 'Debugging', 'Structured Search'],
    summary: 'Intelligent copilot that retrieves enterprise data, searches structured databases, and guides investment evaluation through conversational workflows.',
    sections: [
      {
        heading: 'What it does',
        body: 'Assists commercial real estate professionals throughout the property evaluation process. Retrieves property information from enterprise data sources, searches structured organisational databases, answers questions about property characteristics, calculates distances between properties and nearby amenities, assists with property evaluation, and provides contextual information to support investment decisions.',
      },
      {
        heading: 'The engineering challenge',
        body: 'Unlike consumer chatbots, this required reliable orchestration across multiple enterprise knowledge sources. Not just generating responses — but understanding user intent, retrieving relevant information, coordinating multiple workflows, producing consistent outputs, and guiding users through complex conversational interactions. Balancing conversational flexibility with predictable system behaviour.',
      },
      {
        heading: 'My contributions',
        body: 'Implemented conversational workflows. Configured agent behaviour. Developed workflow logic for business-specific interactions. Debugged conversational behaviour. Improved workflow reliability. Tested user interactions. Validated AI responses. Supported iterative MVP delivery.',
      },
      {
        heading: 'What it taught me',
        body: 'Successful enterprise AI assistants require considerably more than strong language models. Effective systems depend equally on workflow design, orchestration, integration, testing, and continuous refinement.',
      },
    ],
  },
  {
    id: 'multi-agent',
    title: 'Configurable Multi-Agent Orchestration Platform',
    subtitle: 'Built from first principles',
    badge: 'Independent Research',
    year: '2024 — Present',
    role: 'Sole author',
    stack: ['Multi-Agent', 'MCP', 'YAML Config', 'Orchestration Strategies', 'Extensibility'],
    summary: 'YAML-configurable agents, prompts, tools, workflows and memory. Native Model Context Protocol integration. Sequential, concurrent, iterative, and swarm strategies.',
    sections: [
      {
        heading: 'Why build this?',
        body: 'After exposure to enterprise AI and the rise of agentic frameworks, I wanted to understand how collaborative AI systems actually function beneath existing abstractions. Rather than immediately adopting popular orchestration frameworks, I chose to build my own. The objective was educational — orchestration principles from first principles.',
      },
      {
        heading: 'Design philosophy',
        body: 'Flexibility over convenience. Rather than embedding orchestration logic directly into code, behaviour is configured through external YAML files. This reflects a broader preference for configurable, maintainable software architectures.',
      },
      {
        heading: 'What it supports',
        body: 'Multiple orchestration strategies (sequential, concurrent, iterative, swarm-based). Configurable agents, prompts, tools, workflows, memory. Model Context Protocol (MCP) integration. An extensible architecture for future experimentation.',
      },
      {
        heading: 'Why it matters',
        body: 'Unlike personal projects that reproduce online tutorials, this originated from genuine intellectual curiosity. Its value is not in the technologies used but in what it demonstrates — first-principles thinking, systems thinking, architectural curiosity, experimentation, a preference for configurable systems, and continuous learning.',
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
    summary: 'Automated news retrieval, image generation, caption generation, LinkedIn publishing, and a monitoring UI — shipped under hackathon constraints.',
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
  {
    id: 'ai-nurse',
    title: 'AI Nurse Assistant',
    subtitle: 'Capstone project · RMIT Vietnam',
    badge: 'Bachelor Capstone',
    year: '2025',
    role: 'Full-stack + AI',
    stack: ['Conversational AI', 'Full-Stack', 'Prompt Design', 'System Integration', 'Agile'],
    summary: 'Personalized conversational AI for healthcare information access. Full-stack build with emphasis on reliability, UX, and end-to-end software engineering around an AI capability.',
    sections: [
      {
        heading: 'Why this project',
        body: 'The healthcare domain presents unique challenges for AI: users expect responses that are not only useful but reliable, understandable, and appropriately contextualized. Rather than treating this as an AI demonstration, I approached it as building a complete software system around an AI capability.',
      },
      {
        heading: 'Objectives',
        body: 'Design a personalized nursing assistant. Investigate conversational AI for healthcare support. Apply software engineering principles throughout development. Build a functional end-to-end application. Collaborate effectively within a multidisciplinary team.',
      },
      {
        heading: 'What I did',
        body: 'Contributed to both technical implementation and broader system design — system architecture discussions, implementation planning, iterative development, testing, and refinement. Balanced technical feasibility with usability within capstone constraints.',
      },
      {
        heading: 'What it taught me',
        body: 'AI applications must be evaluated as complete systems rather than isolated models. User experience is often as important as model capability. Reliable engineering requires repeated testing. Team communication significantly influences project success.',
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
