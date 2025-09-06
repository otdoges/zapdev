// Diagram utilities for generating Mermaid diagrams

export interface DiagramTemplate {
  name: string;
  description: string;
  category: 'architecture' | 'database' | 'flow' | 'sequence' | 'component' | 'network';
  template: string;
  variables?: string[];
}

export const diagramTemplates: DiagramTemplate[] = [
  {
    name: 'Web Application Architecture',
    description: 'Complete web application architecture with frontend, backend, and database',
    category: 'architecture',
    template: `graph TB
    User[👤 User] --> Browser[🌐 Web Browser]
    Browser --> CDN[📡 CDN/Load Balancer]
    CDN --> Frontend[⚛️ Frontend App]
    Frontend --> API[🔗 API Gateway]
    API --> Auth[🔐 Authentication]
    API --> App[⚙️ Application Server]
    App --> Cache[⚡ Redis Cache]
    App --> DB[(🗄️ Database)]
    App --> Queue[📮 Message Queue]
    Queue --> Workers[👷 Background Workers]
    Workers --> Storage[☁️ File Storage]
    
    style User fill:#3b82f6,color:#fff
    style Frontend fill:#10b981,color:#fff
    style API fill:#f59e0b,color:#fff
    style DB fill:#ef4444,color:#fff`,
    variables: ['frontend_tech', 'backend_tech', 'database_type']
  },
  
  {
    name: 'Microservices Architecture',
    description: 'Microservices architecture with service discovery and API gateway',
    category: 'architecture',
    template: `graph TD
    Client[Client] --> Gateway[API Gateway]
    Gateway --> Discovery[Service Discovery]
    
    Gateway --> UserService[User Service]
    Gateway --> OrderService[Order Service]
    Gateway --> PaymentService[Payment Service]
    Gateway --> NotificationService[Notification Service]
    
    UserService --> UserDB[(User DB)]
    OrderService --> OrderDB[(Order DB)]
    PaymentService --> PaymentDB[(Payment DB)]
    
    UserService --> MessageBroker[Message Broker]
    OrderService --> MessageBroker
    PaymentService --> MessageBroker
    NotificationService --> MessageBroker
    
    style Gateway fill:#3b82f6,color:#fff
    style MessageBroker fill:#10b981,color:#fff`,
    variables: ['services', 'message_broker', 'databases']
  },

  {
    name: 'User Authentication Flow',
    description: 'Complete user authentication and authorization flow',
    category: 'sequence',
    template: `sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant Auth as Auth Service
    participant DB as Database
    
    U->>F: Enter credentials
    F->>A: POST /auth/login
    A->>Auth: Validate credentials
    Auth->>DB: Query user
    DB-->>Auth: User data
    Auth->>Auth: Generate JWT
    Auth-->>A: JWT + User info
    A-->>F: Authentication response
    F->>F: Store JWT
    F-->>U: Redirect to dashboard
    
    Note over U,DB: Subsequent requests
    U->>F: Access protected resource
    F->>A: GET /api/data (with JWT)
    A->>Auth: Verify JWT
    Auth-->>A: Valid token
    A-->>F: Protected data
    F-->>U: Display data`,
    variables: ['auth_method', 'token_type']
  },

  {
    name: 'Database Schema Relations',
    description: 'Entity relationship diagram for application database',
    category: 'database',
    template: `erDiagram
    USERS {
        uuid id PK
        string email UK "Unique email address"
        string name
        string password_hash
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    
    PROFILES {
        uuid id PK
        uuid user_id FK
        string first_name
        string last_name
        string avatar_url
        text bio
        timestamp updated_at
    }
    
    POSTS {
        uuid id PK
        uuid user_id FK
        string title
        text content
        string status "draft|published|archived"
        timestamp created_at
        timestamp updated_at
        timestamp published_at
    }
    
    COMMENTS {
        uuid id PK
        uuid post_id FK
        uuid user_id FK
        text content
        timestamp created_at
        timestamp updated_at
    }
    
    TAGS {
        uuid id PK
        string name UK
        string slug UK
        timestamp created_at
    }
    
    POST_TAGS {
        uuid post_id FK
        uuid tag_id FK
    }
    
    USERS ||--|| PROFILES : has
    USERS ||--o{ POSTS : creates
    USERS ||--o{ COMMENTS : writes
    POSTS ||--o{ COMMENTS : has
    POSTS }o--o{ TAGS : tagged_with`,
    variables: ['entities', 'relationships']
  },

  {
    name: 'API Request Flow',
    description: 'Detailed API request processing flow with validation and error handling',
    category: 'flow',
    template: `graph TD
    Start([API Request]) --> Validate{Validate Request?}
    Validate -->|Invalid| Error1[Return 400 Bad Request]
    Validate -->|Valid| Auth{Authenticated?}
    Auth -->|No| Error2[Return 401 Unauthorized]
    Auth -->|Yes| Authorize{Authorized?}
    Authorize -->|No| Error3[Return 403 Forbidden]
    Authorize -->|Yes| RateLimit{Rate Limit OK?}
    RateLimit -->|Exceeded| Error4[Return 429 Too Many Requests]
    RateLimit -->|OK| Process[Process Request]
    Process --> DBQuery{Database Query?}
    DBQuery -->|Yes| DB[(Query Database)]
    DBQuery -->|No| Logic[Business Logic]
    DB --> Logic
    Logic --> Success{Success?}
    Success -->|No| Error5[Return 500 Internal Error]
    Success -->|Yes| Response[Return 200 Success]
    
    Error1 --> Log[Log Error]
    Error2 --> Log
    Error3 --> Log
    Error4 --> Log
    Error5 --> Log
    Log --> End([End])
    Response --> End
    
    style Start fill:#e1f5fe
    style Process fill:#e8f5e8
    style DB fill:#fff3e0
    style Response fill:#f3e5f5`,
    variables: ['endpoint', 'operations']
  },

  {
    name: 'React Component Tree',
    description: 'React application component hierarchy and data flow',
    category: 'component',
    template: `graph TD
    App[🏠 App] --> Router[🧭 Router]
    App --> GlobalState[🌐 Global State]
    
    Router --> HomePage[📄 HomePage]
    Router --> ProfilePage[👤 ProfilePage]
    Router --> PostsPage[📝 PostsPage]
    
    HomePage --> Header[🎯 Header]
    HomePage --> Hero[🌟 Hero Section]
    HomePage --> Features[✨ Features]
    
    ProfilePage --> Header
    ProfilePage --> UserInfo[ℹ️ UserInfo]
    ProfilePage --> UserPosts[📚 UserPosts]
    
    PostsPage --> Header
    PostsPage --> PostList[📋 PostList]
    PostsPage --> Sidebar[📌 Sidebar]
    
    Header --> NavBar[🧭 NavBar]
    Header --> UserMenu[👤 UserMenu]
    
    PostList --> PostCard[📄 PostCard]
    PostCard --> PostActions[⚡ PostActions]
    
    GlobalState --> UserStore[👤 User Store]
    GlobalState --> PostsStore[📝 Posts Store]
    GlobalState --> UIStore[🎨 UI Store]
    
    style App fill:#3b82f6,color:#fff
    style GlobalState fill:#10b981,color:#fff
    style PostsStore fill:#f59e0b,color:#fff`,
    variables: ['components', 'state_management']
  },

  {
    name: 'CI/CD Pipeline',
    description: 'Continuous integration and deployment pipeline',
    category: 'flow',
    template: `graph LR
    Developer[👨‍💻 Developer] --> Git[📦 Git Push]
    Git --> Trigger{🚀 CI Trigger}
    
    Trigger --> Build[🔨 Build]
    Build --> Test[🧪 Run Tests]
    Test --> Security[🔒 Security Scan]
    Security --> Quality[📊 Code Quality]
    
    Quality --> QualityCheck{Quality Gate?}
    QualityCheck -->|Fail| Notify1[📧 Notify Failure]
    QualityCheck -->|Pass| Package[📦 Package]
    
    Package --> Staging[🎭 Deploy to Staging]
    Staging --> StagingTests[🔍 Integration Tests]
    StagingTests --> Approval{👥 Manual Approval?}
    
    Approval -->|Reject| Notify2[📧 Notify Rejection]
    Approval -->|Approve| Production[🌟 Deploy to Production]
    Production --> Monitor[📊 Monitor & Alerts]
    
    Notify1 --> End([End])
    Notify2 --> End
    Monitor --> End
    
    style Developer fill:#3b82f6,color:#fff
    style Production fill:#10b981,color:#fff
    style Monitor fill:#f59e0b,color:#fff`,
    variables: ['build_tools', 'deployment_targets']
  }
];

// Generate a Mermaid diagram based on a description
export function generateDiagramFromDescription(description: string): string {
  const lowerDesc = description.toLowerCase();
  
  // Architecture keywords
  if (lowerDesc.includes('architecture') || lowerDesc.includes('system design')) {
    if (lowerDesc.includes('microservice')) {
      return diagramTemplates.find(t => t.name === 'Microservices Architecture')?.template || '';
    }
    return diagramTemplates.find(t => t.name === 'Web Application Architecture')?.template || '';
  }
  
  // Database keywords
  if (lowerDesc.includes('database') || lowerDesc.includes('schema') || lowerDesc.includes('entity')) {
    return diagramTemplates.find(t => t.name === 'Database Schema Relations')?.template || '';
  }
  
  // Flow keywords
  if (lowerDesc.includes('flow') || lowerDesc.includes('process') || lowerDesc.includes('workflow')) {
    if (lowerDesc.includes('api') || lowerDesc.includes('request')) {
      return diagramTemplates.find(t => t.name === 'API Request Flow')?.template || '';
    }
    if (lowerDesc.includes('ci/cd') || lowerDesc.includes('deployment')) {
      return diagramTemplates.find(t => t.name === 'CI/CD Pipeline')?.template || '';
    }
  }
  
  // Sequence keywords
  if (lowerDesc.includes('sequence') || lowerDesc.includes('auth') || lowerDesc.includes('login')) {
    return diagramTemplates.find(t => t.name === 'User Authentication Flow')?.template || '';
  }
  
  // Component keywords
  if (lowerDesc.includes('component') || lowerDesc.includes('react') || lowerDesc.includes('frontend')) {
    return diagramTemplates.find(t => t.name === 'React Component Tree')?.template || '';
  }
  
  // Default to a simple architecture diagram
  return `graph TB
    A[${description}] --> B[Component 1]
    A --> C[Component 2]
    B --> D[Output 1]
    C --> D
    
    style A fill:#3b82f6,color:#fff
    style D fill:#10b981,color:#fff`;
}

// AI prompt for generating Mermaid diagrams
export function createDiagramPrompt(userRequest: string): string {
  return `Create a detailed Mermaid diagram for: ${userRequest}

Available diagram types:
1. **Flowcharts** (graph TD/TB/LR) - For processes, workflows, decision trees
2. **Sequence Diagrams** - For API calls, user interactions, system communication  
3. **Entity Relationship Diagrams** - For database schemas and relationships
4. **Component Diagrams** - For system architecture and component relationships

Guidelines:
- Use clear, descriptive labels
- Include relevant icons/emojis for visual appeal (📱💻🌐🔒📊)
- Add styling with colors: fill:#3b82f6 (blue), fill:#10b981 (green), fill:#f59e0b (orange), fill:#ef4444 (red)
- Keep it comprehensive but readable
- Add notes or comments where helpful

Return ONLY the Mermaid diagram code, starting with the diagram type (e.g., 'graph TB', 'sequenceDiagram', 'erDiagram').

Example format:
\`\`\`
graph TB
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    
    style A fill:#3b82f6,color:#fff
    style C fill:#10b981,color:#fff
\`\`\``;
}

// Extract Mermaid code from AI response
export function extractMermaidCode(response: string): string {
  // Look for code blocks
  const codeBlockMatch = response.match(/```(?:mermaid)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // Look for diagram starting keywords
  const diagramTypes = ['graph', 'flowchart', 'sequenceDiagram', 'erDiagram', 'journey', 'gitgraph', 'gantt'];
  for (const type of diagramTypes) {
    if (response.includes(type)) {
      const startIndex = response.indexOf(type);
      // Try to find the end of the diagram (usually at next paragraph or code block)
      let endIndex = response.length;
      const nextSection = response.indexOf('\n\n', startIndex);
      if (nextSection > startIndex) {
        endIndex = nextSection;
      }
      return response.slice(startIndex, endIndex).trim();
    }
  }
  
  // If no clear diagram found, return the whole response trimmed
  return response.trim();
}

// Validate Mermaid syntax
export function validateMermaidSyntax(diagram: string): { valid: boolean; error?: string } {
  try {
    // Basic validation checks
    if (!diagram.trim()) {
      return { valid: false, error: 'Diagram is empty' };
    }
    
    const diagramTypes = ['graph', 'flowchart', 'sequenceDiagram', 'erDiagram', 'journey', 'gitgraph', 'gantt'];
    const hasValidStart = diagramTypes.some(type => diagram.toLowerCase().includes(type.toLowerCase()));
    
    if (!hasValidStart) {
      return { valid: false, error: 'Diagram must start with a valid diagram type (graph, sequenceDiagram, erDiagram, etc.)' };
    }
    
    // Check for balanced brackets/parentheses
    const brackets = diagram.match(/[\[\](){}]/g) || [];
    const bracketCount = { '[': 0, ']': 0, '(': 0, ')': 0, '{': 0, '}': 0 };
    
    for (const bracket of brackets) {
      bracketCount[bracket as keyof typeof bracketCount]++;
    }
    
    if (bracketCount['['] !== bracketCount[']'] || 
        bracketCount['('] !== bracketCount[')'] || 
        bracketCount['{'] !== bracketCount['}']) {
      return { valid: false, error: 'Unbalanced brackets or parentheses' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: `Validation error: ${error}` };
  }
}

// Get diagram suggestions based on context
export function getDiagramSuggestions(context: string): DiagramTemplate[] {
  const lowerContext = context.toLowerCase();
  const suggestions: DiagramTemplate[] = [];
  
  // Add relevant templates based on context
  diagramTemplates.forEach(template => {
    const relevantKeywords = {
      architecture: ['system', 'architecture', 'design', 'structure'],
      database: ['database', 'schema', 'entity', 'table', 'relation'],
      flow: ['flow', 'process', 'workflow', 'step', 'procedure'],
      sequence: ['sequence', 'interaction', 'api', 'request', 'response'],
      component: ['component', 'react', 'vue', 'frontend', 'ui'],
      network: ['network', 'infrastructure', 'deployment', 'server']
    };
    
    const categoryKeywords = relevantKeywords[template.category] || [];
    const isRelevant = categoryKeywords.some(keyword => lowerContext.includes(keyword));
    
    if (isRelevant) {
      suggestions.push(template);
    }
  });
  
  // If no specific suggestions, return popular ones
  if (suggestions.length === 0) {
    return diagramTemplates.slice(0, 3);
  }
  
  return suggestions;
}