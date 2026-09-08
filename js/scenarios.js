/* =========================================================================
   Break My Architecture — diagram models and failure scenarios
   =========================================================================

   Each project defines a SIMPLIFIED request path, not a replica of the full
   diagram in architectureDig/. The detailed version lives on the project page;
   this one exists so a broken link is visible at a glance.

   Layout: nodes carry explicit x/y/w/h on a loose grid. Edges are routed
   orthogonally at render time from node geometry, so moving a node re-routes
   its edges automatically.

   Scenario state is applied by id:
     down     — nodes rendered as failed (red, pulsing)
     degraded — nodes rendered as strained (amber)
     breaks   — edges rendered as severed (red, dashed, ✕ marker)
     slow     — edges rendered as congested (amber, animated dashes)
     reroute  — an extra edge drawn only in this scenario, rendered green and
                flowing to read as a live path. It is currently used only where
                a fallback genuinely EXISTS in the code (DalBot's top-chunk
                degradation). If it is ever used for a merely proposed path,
                prefix the label "proposed:" so the diagram cannot overclaim.

   -------------------------------------------------------------------------
   Every `handling` block below was verified against the source of the project
   it describes — file and line checked, not inferred from the diagram. Where
   the code does something better than the architecture implies (DalBot's
   top-chunk fallback, PathMentor's context degradation, the IDP's idempotent
   status writes), that is stated as fact. Where a control is genuinely absent,
   it is named as a scoped decision with the production path beside it.
   ------------------------------------------------------------------------- */

const breakArchData = {

  /* ===================== DalBot ===================== */
  dalbot: {
    name: 'DalBot',
    platform: 'Azure · Docker',
    blurb: 'A RAG assistant over the Dalhousie site: retrieve relevant chunks, then generate a grounded answer with source links.',
    viewBox: '0 0 800 290',
    nodes: [
      { id: 'user',  label: 'Student',      sub: 'Browser',        icon: 'person',        x: 24,  y: 40,  w: 126, h: 60 },
      { id: 'ui',    label: 'Next.js 15',   sub: 'Chat UI',        icon: 'web',           x: 174, y: 40,  w: 126, h: 60 },
      { id: 'api',   label: 'FastAPI',      sub: '/chat',          icon: 'api',           x: 324, y: 40,  w: 126, h: 60 },
      { id: 'agent', label: 'Chat Agent',   sub: 'chat_engine.py', icon: 'smart_toy',     x: 474, y: 40,  w: 126, h: 60 },
      { id: 'llm',   label: 'Ollama',       sub: 'phi3',           icon: 'neurology',     x: 624, y: 40,  w: 126, h: 60 },
      { id: 'rag',   label: 'RAG Search',   sub: 'Embeddings',     icon: 'manage_search', x: 474, y: 186, w: 126, h: 60 },
      { id: 'db',    label: 'MySQL 8',      sub: 'content_chunks', icon: 'database',      x: 624, y: 186, w: 126, h: 60 }
    ],
    edges: [
      { id: 'e1', from: 'user',  to: 'ui',    label: 'HTTPS' },
      { id: 'e2', from: 'ui',    to: 'api',   label: 'REST' },
      { id: 'e3', from: 'api',   to: 'agent', label: 'invoke' },
      { id: 'e4', from: 'agent', to: 'rag',   label: 'retrieve' },
      { id: 'e5', from: 'rag',   to: 'db',    label: 'top-k' },
      { id: 'e6', from: 'rag',   to: 'llm',   label: 'context' }
    ],
    scenarios: [
      {
        id: 'llm-timeout',
        name: 'LLM Endpoint Timeout',
        severity: 'critical',
        target: 'Ollama (phi3)',
        desc: 'The local model server stops responding mid-generation.',
        down: ['llm'], degraded: ['agent'], breaks: ['e6'],
        reroute: { from: 'rag', to: 'ui', label: 'live fallback: sources + top chunk', via: 'below' },
        impact: 'Generation is the only thing that stops. Retrieval has already run and the sources are already built by the time the model is called, so the question is not whether the user gets an answer — it is how good an answer survives losing the model.',
        handling: {
          verified: true,
          text: 'This degrades rather than fails, by design. Generation is wrapped in a fallback handler: retrieval and source-building complete first, and if the model call raises, the handler returns a cleaned ~550-character excerpt from the top-ranked chunk instead. The request still returns 200 with the full source list, so the user gets a grounded, citable answer with working links rather than an error page. The choice is written up in the project\'s architectural decision record. The call itself carries an explicit 300s timeout, mirrored at the Next.js proxy layer.'
        },
        production: 'The degradation path is the valuable part and it already works — the remaining work is tuning, not building. Three refinements: bring the 300s timeout down to 20-30s, since a fallback nobody waits for is a fallback that never runs; stagger the proxy timeout above the backend so the backend has headroom to serialise its own fallback; and set an explicit degraded flag on the response so the UI can label the excerpt honestly — "could not generate a summary, here is the source text" — instead of presenting it as a normal answer. Streaming would make the first token arrive fast enough that the timeout rarely matters at all.'
      },
      {
        id: 'retrieval-miss',
        name: 'Retrieval Miss / Stale Index',
        severity: 'warning',
        target: 'content_chunks',
        desc: 'The weekly crawl fails, leaving the chunk index empty or stale.',
        down: [], degraded: ['rag', 'db'], breaks: ['e5'],
        impact: 'Splits into two very different cases. A total miss is handled cleanly. A partial miss — an index holding something topically adjacent but not actually relevant — is the harder one, because the answer arrives with real source links attached, and the links lend it credibility it has not earned.',
        handling: {
          verified: true,
          text: 'The total-miss case is explicit: the engine checks for an empty result set and returns a no-results response — "I could not find relevant information in the Dalhousie database, try rephrasing" — with an empty source list, never calling the model. So a stale index does not produce a confident fabrication. Weak matches are the honest gap: the keyword path drops anything scoring zero, but the vector path sorts by cosine similarity and returns top-k unconditionally, so a low-similarity chunk can still reach generation. The prompt constrains the model to the supplied context and instructs it to say when the answer is not there, which mitigates but does not verify.'
        },
        production: 'Extend the floor that already exists on the keyword path to the vector path, calibrated on a labelled set rather than guessed, and route anything below it into the no-results branch that is already written and tested — the destination exists, only the threshold is missing. Beyond that: a real vector index (pgvector or FAISS) in place of the in-process similarity pass, and index freshness surfaced to the user, since a silently stale index is harder to catch than an obviously broken one.'
      },
      {
        id: 'traffic-spike',
        name: 'Sudden Traffic Spike',
        severity: 'warning',
        target: 'Ollama (phi3)',
        desc: 'Registration week — concurrent chats far exceed one model instance.',
        down: [], degraded: ['llm', 'agent'], breaks: [], slow: ['e6', 'e3'],
        impact: 'Self-hosting the model is what makes this project private and free to run; the same decision caps it at one container. Under burst, Ollama serialises past its parallel limit, so queue depth grows and every request drifts toward the timeout ceiling together.',
        handling: {
          verified: true,
          text: 'No rate limiting, response cache, or circuit breaker — a deliberate scope decision for a single-instance academic deployment, and verified absent across the whole request path rather than assumed. One incidental bound does exist: the chat route is a synchronous handler, so the framework runs it in a worker threadpool capped at 40 threads by default. That puts a ceiling on in-flight requests, though it is a side effect of the handler signature rather than a chosen limit.'
        },
        production: 'The useful detail here is that the hard part is already done. A circuit breaker has somewhere to trip to — the top-chunk fallback from the timeout scenario is built and tested — so shedding load means reusing an existing path rather than writing a new one. Around it: a bounded semaphore that returns 429 instead of queueing without limit, since a fast "busy, try again" beats a three-minute wait; a normalised-question response cache with a TTL, which is unusually high-value for a university FAQ bot where the same fifty questions dominate; and a per-IP limit at the edge.'
      }
    ]
  },

  /* ========== Internal Developer Platform ========== */
  'internal-developer-platform': {
    name: 'Internal Developer Platform',
    platform: 'AWS · Serverless',
    blurb: 'Scaffolding requests arrive synchronously, then hand off to an async queue so slow LLM generation never blocks the caller.',
    viewBox: '0 0 800 330',
    nodes: [
      { id: 'user',   label: 'Developer',    sub: 'Browser',        icon: 'person',       x: 24,  y: 30,  w: 126, h: 60 },
      { id: 'fe',     label: 'S3 Frontend',  sub: 'Static site',    icon: 'web',          x: 174, y: 30,  w: 126, h: 60 },
      { id: 'gw',     label: 'API Gateway',  sub: 'HTTP v2',        icon: 'api',          x: 324, y: 30,  w: 126, h: 60 },
      { id: 'status', label: 'Status λ',     sub: '256MB / 30s',    icon: 'bolt',         x: 474, y: 30,  w: 126, h: 60 },
      { id: 'ddb',    label: 'DynamoDB',     sub: 'Single table',   icon: 'database',     x: 324, y: 160, w: 126, h: 60 },
      { id: 'sqs',    label: 'SQS Queue',    sub: 'event source',   icon: 'queue',        x: 474, y: 160, w: 126, h: 60 },
      { id: 'orch',   label: 'Generator λ',  sub: '512MB / 300s',   icon: 'bolt',         x: 624, y: 160, w: 126, h: 60 },
      { id: 'groq',   label: 'Groq API',     sub: 'LLaMA 3.3 70B',  icon: 'neurology',    x: 474, y: 262, w: 126, h: 56 },
      { id: 's3art',  label: 'S3 Artifacts', sub: 'Private',        icon: 'folder_zip',   x: 624, y: 262, w: 126, h: 56 }
    ],
    edges: [
      { id: 'e1', from: 'user',   to: 'fe',     label: 'HTTPS' },
      { id: 'e2', from: 'fe',     to: 'gw',     label: 'POST /requests' },
      { id: 'e3', from: 'gw',     to: 'status', label: 'invoke' },
      { id: 'e4', from: 'status', to: 'ddb',    label: 'write' },
      { id: 'e5', from: 'status', to: 'sqs',    label: 'enqueue' },
      { id: 'e6', from: 'sqs',    to: 'orch',   label: 'trigger' },
      { id: 'e7', from: 'orch',   to: 'groq',   label: 'prompt' },
      { id: 'e8', from: 'orch',   to: 's3art',  label: 'upload ZIP' }
    ],
    scenarios: [
      {
        id: 'groq-outage',
        name: 'Third-Party LLM Outage',
        severity: 'critical',
        target: 'Groq API',
        desc: 'The external model provider returns 5xx or stops responding.',
        down: ['groq'], degraded: ['orch'], breaks: ['e7'],
        impact: 'A dependency nobody controls fails, and the queue is what makes that survivable — the caller already has its response and the work is durable. What is left to get right is how the failure is recorded, and what it costs on the way.',
        handling: {
          verified: true,
          text: 'Handled at two levels. The client sets a 120s per-attempt timeout with three attempts and exponential backoff, retrying only on 429s, 5xx and connection errors — not on client errors, which would never succeed. Above that, the handler catches the resulting error, writes the request to FAILED and returns normally, so the queue message is deleted rather than redelivered: a genuine provider outage produces one recorded failure, not an endless retry loop. The known edge: three full attempts plus backoff can exceed the Lambda 300s ceiling, so a total blackout can hit the timeout mid-retry instead of exiting through that clean path.'
        },
        production: 'Budget the retry schedule against the Lambda timeout so the clean failure path always wins the race — roughly a 60s per-attempt cap for three attempts inside 300s. Add jitter so retries across concurrent invocations do not synchronise into a thundering herd. Add the dead-letter queue the handler comment already anticipates, so anything that does time out lands somewhere inspectable rather than ageing out of the queue. And surface "delayed, not lost" in the UI, because that guarantee is the whole point of the async design and the developer waiting cannot currently see it.'
      },
      {
        id: 'queue-backlog',
        name: 'Queue Backlog',
        severity: 'warning',
        target: 'SQS · Generator λ',
        desc: 'Submissions arrive faster than generation drains them.',
        down: [], degraded: ['sqs', 'orch'], breaks: [], slow: ['e6', 'e7'],
        impact: 'Nothing breaks — the API only enqueues, so it stays fast and every service-level dashboard stays green while the user-visible wait climbs. The individual job is visible; the backlog behind it is not.',
        handling: {
          verified: true,
          text: 'SQS absorbs the burst and the generator scales at Lambda defaults, so throughput rises with load rather than the queue simply growing. The user is not left blind either: the status view polls every three seconds and shows a live elapsed timer and status badge, and a waiting job correctly reads as queued for processing. The gap is resolution rather than visibility — there is no queue position, no ETA, and no alarm on queue depth or message age, so a job held behind a backlog looks identical to one that is simply generating slowly.'
        },
        production: 'Alarm on oldest-message-age rather than error rate: backlog is the metric that actually tracks user pain here, and it is the one an error-only dashboard structurally cannot show. Add queue position to the status response so the existing poll loop can render "3rd in queue" instead of an open-ended timer. Set reserved concurrency on the generator — worth doing for a second-order reason as well: unbounded scale-out forwards the whole burst straight into the provider and converts a queue backlog into rate-limit failures, so capping concurrency protects the upstream dependency, not just the account.'
      },
      {
        id: 'ddb-throttle',
        name: 'DynamoDB Throttling',
        severity: 'warning',
        target: 'DynamoDB single table',
        desc: 'Status writes are rejected under partition heat or account burst limits.',
        down: [], degraded: ['ddb'], breaks: ['e4'],
        impact: 'The interesting risk is not a lost write but a divergence: the generator can finish its work and upload a valid artifact while the record announcing it fails to land. The artifact is real; the system just cannot see it.',
        handling: {
          verified: true,
          text: 'Better protected than the diagram suggests. The table is on-demand, so there is no provisioned ceiling to exhaust — throttling arises only from partition heat or account burst limits. Writes are idempotent by construction: every status record is keyed deterministically on the request id and written as a plain set of absolute values, with no counters or list appends, so replaying a message rewrites the same values rather than corrupting them. The SDK retries with adaptive backoff, and if the final write still fails the error is re-raised rather than swallowed, so the queue redelivers and the pipeline reruns instead of silently reporting success.'
        },
        production: 'Because retries are safe, the remaining exposure is narrow and specific: with no dead-letter queue and a one-hour retention, sustained write failure eventually ages the message out, leaving the record stuck mid-flight while a complete artifact sits in the bucket that nothing will ever surface — and each redelivery re-runs a billable generation on the way there. Two changes close it. Reconcile from the artifact bucket on read: if the ZIP exists, the job finished, whatever the status table says. And add the dead-letter queue so the failure is inspectable rather than expiring quietly.'
      }
    ]
  },

  /* ===================== PathMentor ===================== */
  pathmentor: {
    name: 'PathMentor',
    platform: 'AWS · Bedrock',
    blurb: 'CloudFront fronts a static UI; plan generation runs through API Gateway into Lambda, backed by DynamoDB and Bedrock.',
    viewBox: '0 0 640 300',
    nodes: [
      { id: 'user',    label: 'User',         sub: 'Browser',      icon: 'person',   x: 20,  y: 34,  w: 126, h: 60 },
      { id: 'cf',      label: 'CloudFront',   sub: 'CDN',          icon: 'public',   x: 166, y: 34,  w: 126, h: 60 },
      { id: 'gw',      label: 'API Gateway',  sub: 'REST',         icon: 'api',      x: 312, y: 34,  w: 126, h: 60 },
      { id: 'plan',    label: 'generate-plan',sub: 'Lambda',       icon: 'bolt',     x: 458, y: 34,  w: 126, h: 60 },
      { id: 's3',      label: 'S3 Frontend',  sub: 'Static site',  icon: 'web',      x: 166, y: 176, w: 126, h: 60 },
      { id: 'ddb',     label: 'DynamoDB',     sub: 'experiences',  icon: 'database', x: 312, y: 176, w: 126, h: 60 },
      { id: 'bedrock', label: 'Bedrock',      sub: 'Claude 3',     icon: 'neurology',x: 458, y: 176, w: 126, h: 60 }
    ],
    edges: [
      { id: 'e1', from: 'user', to: 'cf',      label: 'HTTPS' },
      { id: 'e2', from: 'cf',   to: 'gw',      label: 'REST' },
      { id: 'e3', from: 'gw',   to: 'plan',    label: 'invoke' },
      { id: 'e4', from: 'cf',   to: 's3',      label: 'origin' },
      { id: 'e5', from: 'plan', to: 'bedrock', label: 'InvokeModel' },
      { id: 'e6', from: 'plan', to: 'ddb',     label: 'scan / put' }
    ],
    scenarios: [
      {
        id: 'bedrock-throttle',
        name: 'Bedrock Throttling',
        severity: 'critical',
        target: 'Bedrock (Claude 3)',
        desc: 'InvokeModel returns ThrottlingException under account quota.',
        down: ['bedrock'], degraded: ['plan'], breaks: ['e5'],
        impact: 'A quota ceiling rather than an outage, which makes it the failure that arrives precisely when the product is succeeding — many users at once — and hits all of them together instead of degrading gradually. It is also the most recoverable failure here: the same request usually succeeds moments later.',
        handling: {
          verified: true,
          text: 'The model call relies on the SDK default of two additional attempts, with no throttle-aware wrapper above it. A throttling exception is caught by the general handler and returned as a 500, so it is not distinguished by status code from a genuine outage or a bad model identifier — and nothing signals to the user that waiting would help. The raw provider message does travel through in the response detail, so the signal is present in the payload; it is simply not acted on. Generated plans are not cached, so a page reload re-invokes the model at full cost.'
        },
        production: 'The highest-value fix is also the cheapest: switch the SDK to adaptive retry mode with a raised attempt count, which absorbs most throttling before it ever reaches the caller and is a configuration change rather than new code. Then map the exception to a 429 with Retry-After instead of a 500, so the UI can say "busy, retrying shortly" — the information is already in the payload and only needs classifying. Finally, cache plans keyed on the input profile: similar inputs produce similar plans, and the cheapest model call is the one not made — which lowers the quota pressure causing the throttling in the first place.'
      },
      {
        id: 'ddb-unavailable',
        name: 'Experience Store Unavailable',
        severity: 'warning',
        target: 'DynamoDB',
        desc: 'The experiences table is unreachable or throttled.',
        down: ['ddb'], degraded: ['plan'], breaks: ['e6'],
        impact: 'The user still gets a working plan — the request does not fail. What is lost is the community grounding that makes the plan specific, so the output degrades from a tailored path to a well-informed generic one.',
        handling: {
          verified: true,
          text: 'This degrades rather than failing. The experience lookup is wrapped so that a read failure logs the problem, returns an empty set and lets execution continue to the model, where the prompt substitutes an explicit fallback instruction in place of the missing context. The response also reports how many experiences were used, so the degradation is recorded in the payload rather than hidden — a request served without grounding is distinguishable from a normal one by anything that reads that field.'
        },
        production: 'The mechanism is right; the reporting is where the work is. The count that marks a degraded response is already in the payload but nothing consumes it, so the UI cannot yet tell the user their plan was built without community data — surfacing it turns a silent difference into an honest one. The same field is the natural alarm signal: a sustained run of zero-context responses means the store is unreachable, and because the request still succeeds, an error-rate alarm will never catch it. Caching recent reads would keep a brief blip from surfacing at all.'
      },
      {
        id: 'cdn-origin-fail',
        name: 'Origin Failure Behind CDN',
        severity: 'info',
        target: 'S3 origin',
        desc: 'The S3 origin stops serving while CloudFront still holds cache.',
        down: ['s3'], degraded: ['cf'], breaks: ['e4'],
        impact: 'The most instructive case here, because at first nothing happens at all: the CDN keeps serving and the site looks healthy. That buffer is real availability — roughly an hour of it — but it also means the clock on detection starts well before anyone notices.',
        handling: {
          verified: true,
          text: 'CloudFront serves cached objects for a one-hour default TTL, so a brief origin problem is invisible to users — the cache doing exactly the job it is there for. Custom error responses are configured, for 403 and 404, both rewriting to the app entry point so client-side routing works on deep links. That is single-page-app routing rather than resilience: there is no equivalent rule for origin 5xx, so once TTLs expire a genuine origin failure surfaces as a default CloudFront error page, and no alarm watches CDN error rate.'
        },
        production: 'Add custom error responses for the 5xx range so an origin failure degrades to an intentional maintenance page instead of a default error page — the mechanism is already configured and proven for 403 and 404, so this extends a pattern rather than introducing one. Narrow the 403 rule to document requests only: applied to asset requests it returns HTML with a 200 where the browser expects JavaScript, which fails less honestly than a plain error would. Then alarm on CloudFront 5xx rate — noting those metrics are only published in us-east-1 regardless of stack region — and wire the alarms to a notification topic, since the cache buying an hour of cover is exactly what makes silent detection dangerous.'
      }
    ]
  }
};
