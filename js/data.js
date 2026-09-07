const portfolioData = {
    engineerProfile: {
        name: "AKANKSHA RAUT",
        role: "Cloud / Software Engineer",
        tagline: "Curious enough to ask why, Stubborn enough to build it",
        avatar: "AR",
        education: [
            {
                university: "Dalhousie University",
                degree: "Master of Applied Computer Science",
                score: ""
            },
            {
                university: "SVPCET",
                degree: "BE Computer Engineering",
                score: "9.17 / 10"
            }
        ],
        experience: [
            {
                company: "TCS",
                duration: "3.5 years",
                description: "Enterprise systems · Intune · AWS · Azure · GCP\nAutomation · Migration"
            }
        ],
        // Awards & Recognition — rendered as AWS-style resource records.
        // proof: path to a certificate/proof image, or null when nothing is attached.
        achievements: [
            {
                id: "client-appreciation-award",
                name: "Client Appreciation Award",
                type: "Organization Honour",
                organization: "LSEG / Tata Consultancy Services",
                occurrences: 1,
                status: "Recognized",
                period: "",
                detail: "Recognized directly by the client for service delivery",
                icon: "handshake",
                proof: "Certificates/Clientappreciation.jpeg"
            },
            {
                id: "hall-of-fame",
                name: "Hall of Fame",
                type: "Organization Honour",
                organization: "Tata Consultancy Services",
                occurrences: 1,
                status: "Recognized",
                period: "",
                detail: "Enterprise automation initiatives using Nexthink",
                icon: "military_tech",
                proof: "Certificates/hallofFame.jpeg"
            },
            {
                id: "star-of-the-quarter",
                name: "Star of the Quarter",
                type: "Performance Award",
                organization: "Tata Consultancy Services",
                occurrences: 2,
                status: "Recognized",
                period: "",
                detail: "Performance & Operational Excellence",
                icon: "star",
                proof: "Certificates/SOQ1.png"
            },
            {
                id: "star-of-the-month",
                name: "Star of the Month",
                type: "Performance Award",
                organization: "Tata Consultancy Services",
                occurrences: 5,
                status: "Recognized",
                period: "",
                detail: "Performance & Operational Excellence",
                icon: "star",
                proof: "Certificates/SOM.png"
            },
            {
                id: "innovation-superstar",
                name: "Innovation Superstar",
                type: "Performance Award",
                organization: "Tata Consultancy Services",
                occurrences: 2,
                status: "Recognized",
                period: "",
                detail: "Innovation in enterprise engineering",
                icon: "lightbulb",
                proof: "Certificates/IS.png"
            },
            {
                id: "on-the-spot",
                name: "On the Spot",
                type: "Performance Award",
                organization: "Tata Consultancy Services",
                occurrences: 4,
                status: "Recognized",
                period: "",
                detail: "Immediate recognition for impact delivered",
                icon: "bolt",
                proof: "Certificates/OTS.png"
            },
            {
                id: "national-engineering-olympiad",
                name: "National Engineering Olympiad",
                type: "Competition Rank",
                organization: "",
                occurrences: 1,
                status: "Recognized",
                period: "2020",
                detail: "All India Rank 42",
                icon: "emoji_events",
                proof: "Certificates/NEO.png"
            }
        ],
        focus: [
            { icon: "cloud", label: "Cloud Architecture", detail: "AWS · Azure · GCP" },
            { icon: "terminal", label: "Software Development", detail: "Full-stack engineering" },
            { icon: "neurology", label: "Deep Learning", detail: "Applied ML systems" },
            { icon: "schema", label: "System Design", detail: "Scalable distributed systems" }
        ],
        beyondTheLab: [
            {
                title: "1. Ocean of Data Challenge - Fantasy SailGP",
                image: "Beyond the Lab/Hackathon1.png",
                description: "“I stepped outside my comfort zone for the Ocean of Data Challenge, where our team built Fantasy SailGP to turn real race telemetry into an interactive fantasy experience. We combined race analytics, environmental data, machine learning, and full-stack development to let fans build their own fantasy fleets and compete using real race performance. It was a fun reminder that sometimes the most interesting projects start far outside your usual domain.”"
            },
            {
                title: "2. Hack With Elements - EcoBridge",
                image: "Beyond the Lab/Hackathon2.png",
                description: "“What started as a question about population movement turned into a bigger systems-thinking challenge: what happens when one city's crisis becomes another city's problem? Our team built EcoBridge, a simulation platform connecting population movement with environmental stress across air, water, and land systems. My favorite part was learning to look beyond individual features and think about how one change can quietly trigger another.”"
            },
            {
                title: "3. Dalhousie Tech Career Fair - Volunteer",
                image: "Beyond the Lab/volunteer.png",
                description: "“My first volunteering experience at Dalhousie's Tech Career Fair - from helping organize the event to sneaking in a few networking conversations of my own 😬. The day was a mix of learning, connecting, and helping create an environment where students and recruiters could meet. A small reminder that sometimes being part of the event is just as valuable as attending it.”"
            }
        ],
        connect: [
            { name: "GitHub", url: "https://github.com/akanksharaut2662-rgb", icon: "code" },
            { name: "LinkedIn", url: "https://www.linkedin.com/in/akanksha-raut-3219aa185", icon: "work" },
            { name: "Medium", url: "https://medium.com/@akanksha.raut.2662", icon: "article" },
            { name: "Email", url: "mailto:akanksha.raut.2662@gmail.com", icon: "mail" }
        ]
    },
    projects: [
        {
            id: "dalbot",
            name: "DalBot",
            cardStack: ["FastAPI", "Ollama", "Next.js"],
            teamProject: true,
            monogram: "DB",
            accent: "#ff9900",
            tagline: "AI Assistant for the Dalhousie Website",
            status: "Decommissioned",
            lastDeployed: null,
            icon: "smart_toy",
            resourceId: "prj-dalbot-001",
            platform: "Azure · Docker image",
            statusNote: "Deployed on Azure as a Docker image. The environment was shut down once the Azure credits for the project ran out, so the hosted instance is no longer reachable. For a full walkthrough, please refer to the recorded demo linked below.",
            architecture: "architectureDig/dalbot.png",
            summary: "DalBot is an AI-powered information assistant that makes the Dalhousie University website easier to navigate through natural-language questions. Instead of searching through dozens of pages, users can ask questions in plain English and receive a concise answer with direct links back to the official university sources.\n\nThe system combines conversational AI, semantic retrieval, automated web/PDF ingestion, and continuously refreshed knowledge to turn a large, distributed information source into a single conversational interface.",
            features: [
                "Natural-Language Information Retrieval",
                "Multi-Turn Conversations",
                "Continuously Refreshed Knowledge Base",
                "Restricted-Page Guidance",
                "Browser Extension",
                "Administrative Controls",
                "Student Support Utilities"
            ],
            techStack: [
                { category: "Frontend", technologies: ["Next.js", "React", "MUI"] },
                { category: "Backend", technologies: ["Python", "FastAPI"] },
                { category: "AI / NLP", technologies: ["Ollama", "Phi-3 / TinyLlama", "sentence-transformers"] },
                { category: "Data", technologies: ["MySQL"] },
                { category: "Data Collection", technologies: ["BeautifulSoup", "Requests", "pdfplumber"] },
                { category: "Infrastructure", technologies: ["Docker", "Docker Compose"] }
            ],
            links: {
                github: "https://github.com/akanksharaut2662-rgb/Dalbot",
                medium: "https://medium.com/@akanksha.raut.2662/i-thought-building-an-ai-chatbot-was-about-choosing-a-better-model-i-was-wrong-82eff10c1a93"
            },
            demo: { type: "video", src: "Demo/dalbot.mp4" },
            behindTheBuild: [
                {
                    title: "Debug retrieval before you blame the model",
                    icon: "manage_search",
                    description: "If you're building a RAG application, don't rush to blame the LLM. Start by looking at what you're actually retrieving - especially your Top-K chunks. Better retrieval can often improve an answer more than swapping models or endlessly tweaking prompts. I learned that one the hard way."
                }
            ]
        },
        {
            id: "internal-developer-platform",
            name: "Internal Developer Platform",
            cardStack: ["AWS Lambda", "Terraform", "React 19"],
            monogram: "IDP",
            accent: "#5aa9f8",
            tagline: "Policy-Driven Service Generation",
            status: "Decommissioned",
            lastDeployed: null,
            icon: "deployed_code",
            resourceId: "prj-idp-002",
            platform: "AWS · S3 + Serverless",
            statusNote: "Deployed on AWS with an S3-hosted frontend and a serverless backend. The environment was shut down once the AWS credits ran out, so the hosted instance is no longer reachable. For a full walkthrough, please refer to the recorded demo linked below.",
            architecture: "architectureDig/internal-developer-platform.png",
            summary: "The Internal Developer Platform turns engineering standards into an automated software-generation workflow. Administrators define organizational policies such as approved technologies, authentication, logging, monitoring, and naming conventions through a centralized dashboard.\n\nDevelopers then describe the microservice they need in plain English. An LLM generates the requested service and its supporting artifacts, while deterministic governance checks validate the output against organizational standards before it can be downloaded.",
            features: [
                "Policy-as-Code Configuration",
                "AI-Powered Service Generation",
                "Automated Governance",
                "Generation Plan Preview",
                "Asynchronous Processing",
                "Real-Time Generation Tracking",
                "Secure Artifact Delivery",
                "Role-Based Access",
                "Fully Serverless Architecture",
                "Infrastructure as Code & CI/CD"
            ],
            techStack: [
                { category: "Frontend", technologies: ["React 19", "Vite 8", "TypeScript", "React Router v7", "Axios", "Framer Motion", "Lucide React", "Recharts"] },
                { category: "Testing", technologies: ["Vitest", "React Testing Library"] },
                { category: "Backend", technologies: ["Python 3.12", "Boto3", "Groq API (LLaMA 3.3 70B)"] },
                { category: "AWS Services", technologies: ["Lambda", "API Gateway", "DynamoDB", "S3", "SQS", "CloudFront", "CloudWatch", "X-Ray"] },
                { category: "Infrastructure", technologies: ["Terraform", "GitHub Actions"] }
            ],
            links: {
                github: "https://github.com/akanksharaut2662-rgb/InternalDev",
                medium: "https://medium.com/@akanksha.raut.2662/the-problem-nobody-talks-about-in-software-engineering-96d0e7296ca8"
            },
            demo: { type: "video", src: "Demo/internal-developer-platform.mp4" },
            behindTheBuild: [
                {
                    title: "Passing every rule isn't the same as being right",
                    icon: "rule",
                    description: "The platform validates every generated artifact against the configured policies, but there's a harder question sitting behind that: what happens when the code passes every rule and is still a bad engineering decision? Deterministic checks catch policy violations - they can't catch poor judgement. That's where governance eventually has to meet deeper code analysis, and why a human still needs to stay in the loop."
                }
            ]
        },
        {
            id: "smartcare-saws",
            name: "SmartCare (SAWS)",
            cardStack: ["AWS", "GCP", "Terraform"],
            demoByTeammate: true,
            teamProject: true,
            monogram: "SC",
            accent: "#3ecf8e",
            tagline: "Multi-Cloud Healthcare Platform",
            status: "Decommissioned",
            lastDeployed: null,
            icon: "medical_services",
            resourceId: "prj-saws-003",
            platform: "AWS + GCP",
            statusNote: "Deployed across AWS and Google Cloud. Both environments were shut down once the cloud credits ran out, so the hosted instance is no longer reachable. For a full walkthrough, please refer to the recorded demo linked below.",
            architecture: "architectureDig/smartcare-saws.png",
            summary: "SmartCare Appointment and Wellness System (SAWS) is a cloud-native healthcare platform designed to manage medical appointments, patient interactions, and wellness feedback across a multi-cloud architecture.\n\nThe system supports different user roles, secure authentication, appointment workflows, AI-assisted patient communication, automated notifications, and sentiment analysis of feedback. AWS and Google Cloud services are combined intentionally, with event-driven synchronization keeping data coordinated across both environments.",
            features: [
                "Role-Based Healthcare Workflows",
                "Multi-Stage Authentication",
                "End-to-End Appointment Management",
                "AI Virtual Assistant",
                "Automated Notifications",
                "Multi-Cloud Architecture",
                "AI-Powered Sentiment Analysis",
                "Cross-Cloud Data Synchronization",
                "Cloud-Based Analytics",
                "Infrastructure as Code"
            ],
            techStack: [
                { category: "Frontend", technologies: ["React", "React Router", "Axios"] },
                { category: "Backend Logic", technologies: ["Python 3.11 (AWS Lambda)", "Node.js 18 (GCP Cloud Functions)"] },
                { category: "Databases", technologies: ["Amazon DynamoDB", "Google Cloud Firestore"] },
                { category: "Cloud Providers", technologies: ["AWS", "GCP"] },
                { category: "Authentication", technologies: ["AWS Cognito", "Lambda MFA triggers"] },
                { category: "Messaging & Events", technologies: ["Google Cloud Pub/Sub", "AWS SQS", "AWS SNS"] },
                { category: "AI & NLP", technologies: ["Google Dialogflow", "Google Natural Language API"] },
                { category: "Analytics", technologies: ["Google BigQuery", "Looker Studio"] },
                { category: "Infrastructure", technologies: ["Terraform"] },
                { category: "CI/CD", technologies: ["GitLab CI/CD", "Google Cloud Build", "Google Cloud Run", "Docker"] }
            ],
            // links: { github, medium } still to come — the Source panel stays hidden until then
            demo: { type: "video", src: "Demo/smartcare-saws.mp4" },
            behindTheBuild: [
                {
                    title: "Two clouds isn't automatically better than one",
                    icon: "cloud",
                    description: "Using two clouds isn't automatically better than using one. The interesting challenge was deciding where each service actually made sense, and then figuring out how to make both environments behave like a single system."
                },
                {
                    title: "The hard part is making them talk",
                    icon: "vpn_key",
                    description: "Multi-cloud sounds impressive right up until the two clouds have to talk to each other. Getting authentication and authorization to work consistently across both - while staying inside each provider's organizational restrictions took considerably longer than building either side on its own."
                }
            ]
        },
        {
            id: "data-capsule",
            name: "Data Capsule",
            cardStack: ["AWS Lambda", "DynamoDB", "Terraform"],
            monogram: "DC",
            accent: "#f2617a",
            tagline: "Self-Destructing File Sharing",
            status: "Decommissioned",
            lastDeployed: null,
            icon: "lock_clock",
            resourceId: "prj-capsule-004",
            platform: "AWS · S3 + Serverless",
            statusNote: "Deployed on AWS with an S3-hosted frontend and a serverless backend. The environment was shut down once the AWS credits ran out, so the hosted instance is no longer reachable. For a full walkthrough, please refer to the recorded demo linked below.",
            architecture: "architectureDig/data-capsule.png",
            summary: "Data Capsule is a secure, self-destructing file-sharing platform designed around one simple principle: a file should remain accessible only for as long as the owner intends.\n\nInstead of exposing files through permanent download links, every interaction is routed through backend-controlled access. Files are stored privately, encrypted at rest, and automatically removed when their lifecycle expires. The entire system is built as an event-driven, serverless AWS architecture and provisioned through Terraform.",
            features: [
                "Self-Destructing Files",
                "Controlled File Access",
                "Event-Driven Lifecycle Management",
                "Private, Encrypted Storage",
                "Fully Serverless Architecture",
                "Infrastructure as Code",
                "Low-Cost by Design"
            ],
            techStack: [
                { category: "Frontend", technologies: ["HTML", "CSS", "JavaScript"] },
                { category: "Backend / Compute", technologies: ["AWS Lambda (Python)"] },
                { category: "API", technologies: ["Amazon API Gateway"] },
                { category: "Storage", technologies: ["Amazon S3 (AES-256)"] },
                { category: "Database", technologies: ["Amazon DynamoDB (TTL)"] },
                { category: "Eventing", technologies: ["Amazon EventBridge"] },
                { category: "Notifications", technologies: ["Amazon SNS"] },
                { category: "Infrastructure", technologies: ["Terraform (HCL)"] }
            ],
            links: {
                github: "https://github.com/akanksharaut2662-rgb/Data-Capsule",
                medium: "https://medium.com/@akanksha.raut.2662/data-capsule-can-we-share-information-without-giving-away-possession-76491d55c82e"
            },
            demo: { type: "video", src: "Demo/data-capsule.mp4" },
            behindTheBuild: [
                {
                    title: "Controls protect the file, not the information",
                    icon: "screenshot_monitor",
                    description: "You can control how a file is stored, accessed, and destroyed, but you can't control what someone does with information once they've seen it. A screenshot is the reminder that technical controls can protect the file, but not necessarily the information itself."
                },
                {
                    title: "Future thought",
                    icon: "lightbulb",
                    description: "A stronger version could explore watermarking, screen-level controls, or DRM-style approaches - but even those come with trade-offs rather than a promise of 100% prevention."
                }
            ]
        },
        {
            id: "prerequisite-extractor",
            name: "Prerequisite Extractor",
            cardStack: ["SciBERT", "NetworkX", "HuggingFace"],
            monogram: "PE",
            accent: "#b183f0",
            tagline: "Prerequisite Inference from Paper Abstracts",
            status: "Completed",
            lastDeployed: null,
            icon: "hub",
            resourceId: "prj-prereq-005",
            platform: "Google Colab",
            statusNote: "A research project rather than a deployed service - all experiments were run in Google Colab, so there is no hosted environment or runtime architecture to simulate.",
            architecture: "architectureDig/prerequisite-extractor.png",
            summary: "Research papers often assume readers already understand the concepts they build upon, leaving important prerequisites unstated. This project investigates whether those hidden prerequisites can be inferred from just a paper's abstract.\n\nThe system combines a fine-tuned SciBERT model to identify scientific concepts with a knowledge graph containing ML/NLP concepts and prerequisite relationships. Detected concepts are linked to the graph and traversed backward to test whether graph relationships can recover background knowledge that the abstract does not explicitly mention.\n\nThe interesting result was not a perfect model, it was discovering that the more sophisticated approach performed worse, and then systematically investigating why.",
            features: [
                "Fine-Tuned Scientific Concept Extraction",
                "Prerequisite Knowledge Graph",
                "Multiple Evaluation Strategies",
                "Systematic Failure Analysis",
                "Hypothesis-Driven Experimentation",
                "Honest Negative Result",
                "Actionable Research Finding"
            ],
            techStack: [
                { category: "Language Model", technologies: ["SciBERT (fine-tuned)", "Sentence-BERT (all-MiniLM-L6-v2)"] },
                { category: "Framework", technologies: ["HuggingFace Transformers"] },
                { category: "Graph Processing", technologies: ["NetworkX"] },
                { category: "Language", technologies: ["Python"] },
                { category: "Environment", technologies: ["Google Colab"] },
                { category: "Datasets", technologies: ["STEM-ECR", "LectureBank"] }
            ],
            showChaos: false,
            links: {
                github: "https://github.com/akanksharaut2662-rgb/extraction-system",
                medium: "https://medium.com/@akanksha.raut.2662/the-day-my-deep-learning-model-politely-told-me-i-was-wrong-508a379cea4f"
            },
            demo: {
                type: "document",
                src: "Demo/prerequisite-extractor-report.pdf",
                title: "Prerequisite Extractor — Project Report",
                meta: "PDF · 250 KB"
            },
            behindTheBuild: [
                {
                    title: "Same concept, different words",
                    icon: "compare_arrows",
                    description: "A paper can mention an idea without ever using the exact word you're looking for. That sounds obvious to a human reader, but teaching a machine that “worded differently” can still mean “same concept” turns out to be a surprisingly tricky problem."
                }
            ]
        },
        {
            id: "pathmentor",
            name: "PathMentor",
            cardStack: ["AWS Lambda", "Amazon Bedrock", "Terraform"],
            monogram: "PM",
            accent: "#e8c14a",
            tagline: "AI Career Roadmaps from Real Experience",
            status: "Decommissioned",
            lastDeployed: null,
            icon: "route",
            resourceId: "prj-pathmentor-006",
            platform: "AWS · S3 + Serverless",
            statusNote: "Deployed on AWS with an S3-hosted frontend and a serverless backend. The environment was shut down once the AWS credits ran out, so the hosted instance is no longer reachable. For a full walkthrough, please refer to the project report linked below.",
            architecture: "architectureDig/pathmentor.png",
            summary: "PathMentor is a career guidance platform built around a simple question: what can someone in my situation learn from people who have already been there?\n\nUsers select their current profile and career goal, explore real experiences from people in similar situations, and receive an AI-generated roadmap tailored to their specific context. The platform combines community-driven data, aggregated trend analysis, and generative AI into a single serverless application.",
            features: [
                "Personalized AI Roadmaps",
                "Community Experience Database",
                "Profile-Based Discovery",
                "Trend Insights",
                "Fully Serverless Architecture",
                "Secure Cloud Delivery",
                "Infrastructure as Code",
                "Automated Deployment",
                "Scalable Data Seeding"
            ],
            techStack: [
                { category: "Frontend", technologies: ["React 18", "Vite 5"] },
                { category: "UI / Animation", technologies: ["Framer Motion", "Lucide React"] },
                { category: "Routing", technologies: ["React Router v6"] },
                { category: "Backend", technologies: ["Python 3.11 (AWS Lambda ×4)"] },
                { category: "AI / ML", technologies: ["Amazon Bedrock (Claude 3 Sonnet)"] },
                { category: "Database", technologies: ["Amazon DynamoDB"] },
                { category: "API", technologies: ["Amazon API Gateway"] },
                { category: "CDN / Hosting", technologies: ["Amazon CloudFront", "Amazon S3"] },
                { category: "Compute (Seeding)", technologies: ["Amazon EC2", "Auto Scaling"] },
                { category: "Monitoring", technologies: ["Amazon CloudWatch"] },
                { category: "Infrastructure", technologies: ["Terraform (HCL)"] },
                { category: "Deployment", technologies: ["Bash (deploy.sh)"] }
            ],
            links: {
                github: "https://github.com/akanksharaut2662-rgb/PathMentor"
            },
            demo: {
                type: "document",
                src: "Demo/pathmentor-report.pdf",
                title: "PathMentor — Cloud Project Report",
                meta: "PDF · 620 KB"
            },
            behindTheBuild: [
                {
                    title: "The most useful signal is regret",
                    icon: "insights",
                    description: "The interesting part of the data isn't just the advice people give, it's the things they regret not doing. Those patterns can be surfaced too, which means the same dataset can answer both “what worked?” and “what would you do differently?”"
                }
            ]
        }
    ],
    telemetry: {
        computeUsage: 45,
        storageUsage: 82,
        networkUsage: 20
    }
};
