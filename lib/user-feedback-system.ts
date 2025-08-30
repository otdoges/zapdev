import { trackFeatureUsage } from './posthog';

export interface UserFeedback {
  id: string;
  userId: string;
  type: 'bug_report' | 'feature_request' | 'improvement' | 'praise' | 'complaint' | 'question';
  category: 'ui_ux' | 'performance' | 'ai_accuracy' | 'functionality' | 'documentation' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  severity?: 'minor' | 'moderate' | 'major' | 'blocker'; // For bug reports
  status: 'submitted' | 'reviewed' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0-1, confidence in sentiment analysis
  
  // Context information
  context: {
    userAgent?: string;
    page?: string;
    feature?: string;
    sessionId?: string;
    subscriptionType?: 'free' | 'pro' | 'enterprise';
    userTier?: string;
    reproductionSteps?: string[];
    expectedBehavior?: string;
    actualBehavior?: string;
    attachments?: Array<{
      type: 'image' | 'video' | 'log' | 'file';
      url: string;
      filename: string;
      size: number;
    }>;
  };

  // AI Analysis
  aiAnalysis?: {
    suggestedCategory: string;
    suggestedPriority: string;
    relatedIssues: string[];
    potentialSolutions: string[];
    estimatedEffort: 'low' | 'medium' | 'high';
    businessImpact: 'low' | 'medium' | 'high';
    technicalComplexity: 'low' | 'medium' | 'high';
    analyzedAt: Date;
  };

  // Response and resolution
  response?: {
    message: string;
    respondedBy: string;
    respondedAt: Date;
    estimatedResolution?: Date;
  };

  resolution?: {
    solution: string;
    implementedBy: string;
    implementedAt: Date;
    releaseVersion?: string;
    satisfactionRating?: number; // 1-5
    followUpRequired: boolean;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  votes: {
    upvotes: number;
    downvotes: number;
    voters: string[]; // User IDs who voted
  };
  tags: string[];
  internalNotes?: Array<{
    note: string;
    author: string;
    timestamp: Date;
    visibility: 'internal' | 'public';
  }>;
}

export interface FeedbackTemplate {
  id: string;
  type: UserFeedback['type'];
  name: string;
  description: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'file' | 'checkbox';
    required: boolean;
    options?: string[];
    placeholder?: string;
    validation?: string;
  }>;
  subscriptionLevel: 'free' | 'pro' | 'enterprise' | 'all';
  enabled: boolean;
}

export interface FeedbackAnalytics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: {
    totalFeedback: number;
    byType: Record<UserFeedback['type'], number>;
    byCategory: Record<UserFeedback['category'], number>;
    bySentiment: Record<UserFeedback['sentiment'], number>;
    byStatus: Record<UserFeedback['status'], number>;
    averageResolutionTime: number; // hours
    satisfactionScore: number; // 1-5
    responseRate: number; // percentage
  };
  trends: {
    feedbackVolumeTrend: number; // percentage change
    sentimentTrend: number; // percentage change in positive sentiment
    resolutionTimeTrend: number; // percentage change in resolution time
  };
  topIssues: Array<{
    category: string;
    count: number;
    averagePriority: string;
    trend: 'increasing' | 'stable' | 'decreasing';
  }>;
  userSegments: Record<string, {
    feedbackCount: number;
    averageSentiment: number;
    topCategories: string[];
  }>;
}

export interface AutomatedResponse {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: UserFeedback['type'];
    category?: UserFeedback['category'];
    keywords?: string[];
    sentiment?: UserFeedback['sentiment'];
    priority?: UserFeedback['priority'];
  };
  response: {
    template: string;
    variables: Record<string, string>;
    delay: number; // minutes
    personalizeForUser: boolean;
  };
  conditions: {
    subscriptionLevel?: UserFeedback['context']['subscriptionType'];
    businessHours?: boolean;
    maxUsagePerUser?: number; // per month
    escalateAfter?: number; // hours without human response
  };
  analytics: {
    timesUsed: number;
    averageUserSatisfaction: number;
    escalationRate: number;
  };
}

export class UserFeedbackSystem {
  private static instance: UserFeedbackSystem;
  private feedback: Map<string, UserFeedback> = new Map();
  private templates: Map<string, FeedbackTemplate> = new Map();
  private automatedResponses: Map<string, AutomatedResponse> = new Map();
  
  private processingInterval?: NodeJS.Timeout;
  private analyticsInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeTemplates();
    this.initializeAutomatedResponses();
    this.startProcessing();
  }

  public static getInstance(): UserFeedbackSystem {
    if (!UserFeedbackSystem.instance) {
      UserFeedbackSystem.instance = new UserFeedbackSystem();
    }
    return UserFeedbackSystem.instance;
  }

  /**
   * Initialize default feedback templates
   */
  private initializeTemplates() {
    const defaultTemplates: FeedbackTemplate[] = [
      {
        id: 'bug_report',
        type: 'bug_report',
        name: 'Bug Report',
        description: 'Report a bug or issue with the platform',
        fields: [
          { name: 'title', label: 'Bug Title', type: 'text', required: true, placeholder: 'Brief description of the bug' },
          { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Detailed description of the issue' },
          { name: 'reproductionSteps', label: 'Steps to Reproduce', type: 'textarea', required: true, placeholder: '1. Go to...\n2. Click on...\n3. See error' },
          { name: 'expectedBehavior', label: 'Expected Behavior', type: 'textarea', required: true, placeholder: 'What you expected to happen' },
          { name: 'actualBehavior', label: 'Actual Behavior', type: 'textarea', required: true, placeholder: 'What actually happened' },
          { name: 'severity', label: 'Severity', type: 'select', required: true, options: ['minor', 'moderate', 'major', 'blocker'] },
          { name: 'attachments', label: 'Screenshots/Videos', type: 'file', required: false }
        ],
        subscriptionLevel: 'all',
        enabled: true
      },
      {
        id: 'feature_request',
        type: 'feature_request',
        name: 'Feature Request',
        description: 'Request a new feature or enhancement',
        fields: [
          { name: 'title', label: 'Feature Title', type: 'text', required: true, placeholder: 'Name of the requested feature' },
          { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Detailed description of the feature' },
          { name: 'useCase', label: 'Use Case', type: 'textarea', required: true, placeholder: 'How would you use this feature?' },
          { name: 'businessValue', label: 'Business Value', type: 'textarea', required: false, placeholder: 'How would this benefit your business?' },
          { name: 'alternatives', label: 'Current Alternatives', type: 'textarea', required: false, placeholder: 'How do you currently handle this?' }
        ],
        subscriptionLevel: 'all',
        enabled: true
      },
      {
        id: 'performance_feedback',
        type: 'improvement',
        name: 'Performance Feedback',
        description: 'Report performance issues or suggestions',
        fields: [
          { name: 'title', label: 'Performance Issue', type: 'text', required: true, placeholder: 'Brief description of the performance issue' },
          { name: 'description', label: 'Details', type: 'textarea', required: true, placeholder: 'What seems slow or inefficient?' },
          { name: 'frequency', label: 'How Often', type: 'select', required: true, options: ['Always', 'Often', 'Sometimes', 'Rarely'] },
          { name: 'impact', label: 'Impact on Work', type: 'select', required: true, options: ['Blocking', 'Significant', 'Minor', 'None'] }
        ],
        subscriptionLevel: 'pro',
        enabled: true
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Initialize automated responses
   */
  private initializeAutomatedResponses() {
    const defaultResponses: AutomatedResponse[] = [
      {
        id: 'bug_acknowledgment',
        name: 'Bug Report Acknowledgment',
        enabled: true,
        trigger: {
          type: 'bug_report'
        },
        response: {
          template: 'Thank you for reporting this bug, {{userName}}. We have received your report about "{{title}}" and our team will investigate it. We aim to provide an update within {{businessHours}} business hours.',
          variables: {
            businessHours: '24'
          },
          delay: 5,
          personalizeForUser: true
        },
        conditions: {
          escalateAfter: 24
        },
        analytics: {
          timesUsed: 0,
          averageUserSatisfaction: 0,
          escalationRate: 0
        }
      },
      {
        id: 'feature_request_acknowledgment',
        name: 'Feature Request Acknowledgment',
        enabled: true,
        trigger: {
          type: 'feature_request'
        },
        response: {
          template: 'Thank you for your feature request, {{userName}}! We appreciate your suggestion for "{{title}}". Our product team will review it and consider it for future releases. You will be notified of any updates.',
          variables: {},
          delay: 10,
          personalizeForUser: true
        },
        conditions: {
          subscriptionLevel: 'pro'
        },
        analytics: {
          timesUsed: 0,
          averageUserSatisfaction: 0,
          escalationRate: 0
        }
      },
      {
        id: 'praise_response',
        name: 'Praise Response',
        enabled: true,
        trigger: {
          type: 'praise',
          sentiment: 'positive'
        },
        response: {
          template: 'Thank you so much for your positive feedback, {{userName}}! We are thrilled to hear that you are enjoying {{feature}}. Your encouragement motivates our team to keep improving.',
          variables: {},
          delay: 2,
          personalizeForUser: true
        },
        conditions: {
          maxUsagePerUser: 3
        },
        analytics: {
          timesUsed: 0,
          averageUserSatisfaction: 0,
          escalationRate: 0
        }
      }
    ];

    defaultResponses.forEach(response => {
      this.automatedResponses.set(response.id, response);
    });
  }

  /**
   * Start processing feedback
   */
  private startProcessing() {
    // Process new feedback every 2 minutes
    this.processingInterval = setInterval(() => {
      this.processNewFeedback();
      this.sendAutomatedResponses();
      this.escalateOverdueFeedback();
    }, 120000);

    // Generate analytics every hour
    this.analyticsInterval = setInterval(() => {
      this.updateAnalytics();
    }, 3600000);
  }

  /**
   * Submit new feedback
   */
  public async submitFeedback(
    userId: string,
    feedbackData: Omit<UserFeedback, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'votes' | 'sentiment' | 'confidence'>
  ): Promise<string> {
    const feedback: UserFeedback = {
      ...feedbackData,
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      votes: {
        upvotes: 0,
        downvotes: 0,
        voters: []
      },
      sentiment: 'neutral', // Will be analyzed
      confidence: 0
    };

    // Analyze sentiment
    await this.analyzeSentiment(feedback);

    // Perform AI analysis
    await this.performAIAnalysis(feedback);

    // Store feedback
    this.feedback.set(feedback.id, feedback);

    // Track submission
    trackFeatureUsage(userId, 'feedback-submitted', true, {
      type: feedback.type,
      category: feedback.category,
      sentiment: feedback.sentiment,
      priority: feedback.priority
    });

    return feedback.id;
  }

  /**
   * Analyze sentiment of feedback
   */
  private async analyzeSentiment(feedback: UserFeedback): Promise<void> {
    // Simple sentiment analysis based on keywords and type
    const text = `${feedback.title} ${feedback.description}`.toLowerCase();
    
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic', 'wonderful'];
    const negativeWords = ['terrible', 'awful', 'hate', 'broken', 'useless', 'horrible', 'worst', 'frustrating', 'annoying'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeScore++;
    });

    // Type-based sentiment
    if (feedback.type === 'praise') {
      positiveScore += 2;
    } else if (feedback.type === 'complaint' || feedback.type === 'bug_report') {
      negativeScore += 1;
    }

    // Priority-based sentiment
    if (feedback.priority === 'critical' || feedback.priority === 'high') {
      negativeScore += 1;
    }

    // Determine sentiment
    const totalScore = positiveScore - negativeScore;
    if (totalScore > 0) {
      feedback.sentiment = 'positive';
      feedback.confidence = Math.min(0.9, 0.6 + (totalScore * 0.1));
    } else if (totalScore < 0) {
      feedback.sentiment = 'negative';
      feedback.confidence = Math.min(0.9, 0.6 + (Math.abs(totalScore) * 0.1));
    } else {
      feedback.sentiment = 'neutral';
      feedback.confidence = 0.5;
    }
  }

  /**
   * Perform AI analysis on feedback
   */
  private async performAIAnalysis(feedback: UserFeedback): Promise<void> {
    // Simulate AI analysis
    const analysis = {
      suggestedCategory: this.suggestCategory(feedback),
      suggestedPriority: this.suggestPriority(feedback),
      relatedIssues: await this.findRelatedIssues(feedback),
      potentialSolutions: this.generatePotentialSolutions(feedback),
      estimatedEffort: this.estimateImplementationEffort(feedback),
      businessImpact: this.assessBusinessImpact(feedback),
      technicalComplexity: this.assessTechnicalComplexity(feedback),
      analyzedAt: new Date()
    };

    feedback.aiAnalysis = analysis;
  }

  /**
   * Suggest category for feedback
   */
  private suggestCategory(feedback: UserFeedback): string {
    const text = feedback.description.toLowerCase();
    
    if (text.includes('slow') || text.includes('performance') || text.includes('speed')) {
      return 'performance';
    } else if (text.includes('ui') || text.includes('interface') || text.includes('design')) {
      return 'ui_ux';
    } else if (text.includes('ai') || text.includes('model') || text.includes('accuracy')) {
      return 'ai_accuracy';
    } else if (text.includes('feature') || text.includes('function')) {
      return 'functionality';
    } else if (text.includes('documentation') || text.includes('help') || text.includes('guide')) {
      return 'documentation';
    }
    
    return 'general';
  }

  /**
   * Suggest priority for feedback
   */
  private suggestPriority(feedback: UserFeedback): string {
    if (feedback.type === 'bug_report') {
      const severity = feedback.severity;
      if (severity === 'blocker') return 'critical';
      if (severity === 'major') return 'high';
      if (severity === 'moderate') return 'medium';
      return 'low';
    }
    
    if (feedback.type === 'complaint') return 'high';
    if (feedback.type === 'feature_request') return 'medium';
    
    return 'low';
  }

  /**
   * Find related issues
   */
  private async findRelatedIssues(feedback: UserFeedback): Promise<string[]> {
    const relatedIssues: string[] = [];
    
    // Find feedback with similar keywords
    const keywords = this.extractKeywords(feedback.description);
    
    for (const [id, existingFeedback] of this.feedback.entries()) {
      if (id === feedback.id) continue;
      
      const existingKeywords = this.extractKeywords(existingFeedback.description);
      const commonKeywords = keywords.filter(k => existingKeywords.includes(k));
      
      if (commonKeywords.length >= 2) { // At least 2 common keywords
        relatedIssues.push(id);
      }
    }
    
    return relatedIssues.slice(0, 5); // Return top 5 related issues
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !stopWords.includes(word))
      .filter(word => /^[a-z]+$/.test(word));
  }

  /**
   * Generate potential solutions
   */
  private generatePotentialSolutions(feedback: UserFeedback): string[] {
    const solutions: string[] = [];
    
    if (feedback.type === 'bug_report') {
      solutions.push('Investigate root cause and implement fix');
      solutions.push('Add error handling and user feedback');
      solutions.push('Implement additional testing for this scenario');
    } else if (feedback.type === 'feature_request') {
      solutions.push('Design and implement the requested feature');
      solutions.push('Create a simpler version of the feature');
      solutions.push('Provide a workaround or alternative approach');
    } else if (feedback.category === 'performance') {
      solutions.push('Optimize database queries');
      solutions.push('Implement caching');
      solutions.push('Improve frontend performance');
    }
    
    return solutions;
  }

  /**
   * Estimate implementation effort
   */
  private estimateImplementationEffort(feedback: UserFeedback): 'low' | 'medium' | 'high' {
    if (feedback.type === 'bug_report') {
      return feedback.severity === 'minor' ? 'low' : 'medium';
    } else if (feedback.type === 'feature_request') {
      const text = feedback.description.toLowerCase();
      if (text.includes('simple') || text.includes('basic')) return 'low';
      if (text.includes('complex') || text.includes('advanced')) return 'high';
      return 'medium';
    }
    
    return 'medium';
  }

  /**
   * Assess business impact
   */
  private assessBusinessImpact(feedback: UserFeedback): 'low' | 'medium' | 'high' {
    if (feedback.context.subscriptionType === 'enterprise') return 'high';
    if (feedback.context.subscriptionType === 'pro') return 'medium';
    
    if (feedback.type === 'bug_report' && feedback.severity === 'blocker') return 'high';
    if (feedback.priority === 'critical') return 'high';
    
    return 'low';
  }

  /**
   * Assess technical complexity
   */
  private assessTechnicalComplexity(feedback: UserFeedback): 'low' | 'medium' | 'high' {
    const text = feedback.description.toLowerCase();
    
    if (text.includes('ai') || text.includes('model') || text.includes('algorithm')) return 'high';
    if (text.includes('database') || text.includes('performance') || text.includes('scaling')) return 'medium';
    if (text.includes('ui') || text.includes('text') || text.includes('color')) return 'low';
    
    return 'medium';
  }

  /**
   * Process new feedback
   */
  private async processNewFeedback() {
    const newFeedback = Array.from(this.feedback.values())
      .filter(f => f.status === 'submitted' && !f.response);

    for (const feedback of newFeedback) {
      // Update status to reviewed
      feedback.status = 'reviewed';
      feedback.updatedAt = new Date();
      
      // Check for automated responses
      await this.checkAutomatedResponses(feedback);
      
      this.feedback.set(feedback.id, feedback);
    }
  }

  /**
   * Check and send automated responses
   */
  private async checkAutomatedResponses(feedback: UserFeedback) {
    for (const response of this.automatedResponses.values()) {
      if (!response.enabled) continue;
      
      const shouldRespond = await this.shouldSendAutomatedResponse(response, feedback);
      
      if (shouldRespond) {
        await this.sendAutomatedResponse(response, feedback);
        break; // Only send one automated response per feedback
      }
    }
  }

  /**
   * Check if automated response should be sent
   */
  private async shouldSendAutomatedResponse(
    response: AutomatedResponse,
    feedback: UserFeedback
  ): Promise<boolean> {
    // Check trigger conditions
    if (response.trigger.type !== feedback.type) return false;
    if (response.trigger.category && response.trigger.category !== feedback.category) return false;
    if (response.trigger.sentiment && response.trigger.sentiment !== feedback.sentiment) return false;
    if (response.trigger.priority && response.trigger.priority !== feedback.priority) return false;
    
    // Check keywords
    if (response.trigger.keywords) {
      const text = `${feedback.title} ${feedback.description}`.toLowerCase();
      const hasKeyword = response.trigger.keywords.some(keyword => text.includes(keyword.toLowerCase()));
      if (!hasKeyword) return false;
    }
    
    // Check conditions
    if (response.conditions.subscriptionLevel) {
      if (feedback.context.subscriptionType !== response.conditions.subscriptionLevel) return false;
    }
    
    if (response.conditions.businessHours) {
      const hour = new Date().getHours();
      if (hour < 9 || hour > 17) return false; // Outside business hours
    }
    
    if (response.conditions.maxUsagePerUser) {
      const userFeedbackCount = Array.from(this.feedback.values())
        .filter(f => f.userId === feedback.userId && f.response?.message.includes('automated')).length;
      if (userFeedbackCount >= response.conditions.maxUsagePerUser) return false;
    }
    
    return true;
  }

  /**
   * Send automated response
   */
  private async sendAutomatedResponse(response: AutomatedResponse, feedback: UserFeedback) {
    // Wait for delay
    if (response.response.delay > 0) {
      setTimeout(async () => {
        await this.deliverAutomatedResponse(response, feedback);
      }, response.response.delay * 60 * 1000);
    } else {
      await this.deliverAutomatedResponse(response, feedback);
    }
  }

  /**
   * Deliver automated response
   */
  private async deliverAutomatedResponse(response: AutomatedResponse, feedback: UserFeedback) {
    let message = response.response.template;
    
    // Replace variables
    if (response.response.personalizeForUser) {
      message = message.replace('{{userName}}', `User ${feedback.userId.slice(0, 8)}`);
      message = message.replace('{{title}}', feedback.title);
      message = message.replace('{{feature}}', feedback.context.feature || 'our platform');
    }
    
    for (const [key, value] of Object.entries(response.response.variables)) {
      message = message.replace(`{{${key}}}`, value);
    }
    
    // Add response to feedback
    feedback.response = {
      message,
      respondedBy: 'automated_system',
      respondedAt: new Date()
    };
    
    feedback.updatedAt = new Date();
    this.feedback.set(feedback.id, feedback);
    
    // Update analytics
    response.analytics.timesUsed++;
    this.automatedResponses.set(response.id, response);
    
    // Track automated response
    trackFeatureUsage(feedback.userId, 'automated-response-sent', true, {
      responseId: response.id,
      feedbackType: feedback.type,
      responseTime: response.response.delay
    });
  }

  /**
   * Send automated responses
   */
  private async sendAutomatedResponses() {
    // This is handled in checkAutomatedResponses method
  }

  /**
   * Escalate overdue feedback
   */
  private async escalateOverdueFeedback() {
    const now = Date.now();
    const overdueThreshold = 24 * 60 * 60 * 1000; // 24 hours
    
    const overdueFeedback = Array.from(this.feedback.values())
      .filter(f => 
        f.status === 'reviewed' && 
        !f.response && 
        (now - f.createdAt.getTime()) > overdueThreshold
      );

    for (const feedback of overdueFeedback) {
      console.log(`Escalating overdue feedback: ${feedback.id} - ${feedback.title}`);
      
      // Add internal note
      if (!feedback.internalNotes) feedback.internalNotes = [];
      feedback.internalNotes.push({
        note: 'Automatically escalated due to no response within 24 hours',
        author: 'system',
        timestamp: new Date(),
        visibility: 'internal'
      });
      
      // Update priority if not already high
      if (feedback.priority === 'low' || feedback.priority === 'medium') {
        feedback.priority = 'high';
      }
      
      feedback.updatedAt = new Date();
      this.feedback.set(feedback.id, feedback);
    }
  }

  /**
   * Update analytics
   */
  private async updateAnalytics() {
    // Analytics are calculated on demand in getAnalytics method
    console.log('Analytics updated');
  }

  /**
   * Get feedback by ID
   */
  public getFeedback(feedbackId: string): UserFeedback | null {
    return this.feedback.get(feedbackId) || null;
  }

  /**
   * Get feedback list with filters
   */
  public getFeedbackList(filters?: {
    userId?: string;
    type?: UserFeedback['type'];
    category?: UserFeedback['category'];
    status?: UserFeedback['status'];
    priority?: UserFeedback['priority'];
    sentiment?: UserFeedback['sentiment'];
    limit?: number;
    offset?: number;
  }): UserFeedback[] {
    let feedbackList = Array.from(this.feedback.values());

    if (filters) {
      if (filters.userId) feedbackList = feedbackList.filter(f => f.userId === filters.userId);
      if (filters.type) feedbackList = feedbackList.filter(f => f.type === filters.type);
      if (filters.category) feedbackList = feedbackList.filter(f => f.category === filters.category);
      if (filters.status) feedbackList = feedbackList.filter(f => f.status === filters.status);
      if (filters.priority) feedbackList = feedbackList.filter(f => f.priority === filters.priority);
      if (filters.sentiment) feedbackList = feedbackList.filter(f => f.sentiment === filters.sentiment);
    }

    // Sort by creation date (newest first)
    feedbackList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    if (filters?.offset) feedbackList = feedbackList.slice(filters.offset);
    if (filters?.limit) feedbackList = feedbackList.slice(0, filters.limit);

    return feedbackList;
  }

  /**
   * Get feedback templates
   */
  public getTemplates(subscriptionLevel?: string): FeedbackTemplate[] {
    const templates = Array.from(this.templates.values())
      .filter(t => t.enabled);

    if (subscriptionLevel) {
      return templates.filter(t => 
        t.subscriptionLevel === 'all' || t.subscriptionLevel === subscriptionLevel
      );
    }

    return templates;
  }

  /**
   * Get feedback analytics
   */
  public getAnalytics(period: FeedbackAnalytics['period'] = 'month'): FeedbackAnalytics {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    const feedbackInPeriod = Array.from(this.feedback.values())
      .filter(f => f.createdAt >= startDate);

    // Calculate metrics
    const metrics = {
      totalFeedback: feedbackInPeriod.length,
      byType: this.groupByField(feedbackInPeriod, 'type'),
      byCategory: this.groupByField(feedbackInPeriod, 'category'),
      bySentiment: this.groupByField(feedbackInPeriod, 'sentiment'),
      byStatus: this.groupByField(feedbackInPeriod, 'status'),
      averageResolutionTime: this.calculateAverageResolutionTime(feedbackInPeriod),
      satisfactionScore: this.calculateSatisfactionScore(feedbackInPeriod),
      responseRate: this.calculateResponseRate(feedbackInPeriod)
    };

    // Calculate trends (comparing with previous period)
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousPeriodFeedback = Array.from(this.feedback.values())
      .filter(f => f.createdAt >= previousPeriodStart && f.createdAt < startDate);

    const trends = {
      feedbackVolumeTrend: this.calculateTrend(previousPeriodFeedback.length, feedbackInPeriod.length),
      sentimentTrend: this.calculateSentimentTrend(previousPeriodFeedback, feedbackInPeriod),
      resolutionTimeTrend: this.calculateResolutionTimeTrend(previousPeriodFeedback, feedbackInPeriod)
    };

    // Top issues
    const topIssues = this.getTopIssues(feedbackInPeriod);

    // User segments
    const userSegments = this.analyzeUserSegments(feedbackInPeriod);

    return {
      period,
      startDate,
      endDate: now,
      metrics,
      trends,
      topIssues,
      userSegments
    };
  }

  /**
   * Group feedback by field
   */
  private groupByField(feedback: UserFeedback[], field: keyof UserFeedback): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    feedback.forEach(f => {
      const value = String(f[field]);
      grouped[value] = (grouped[value] || 0) + 1;
    });
    
    return grouped;
  }

  /**
   * Calculate average resolution time
   */
  private calculateAverageResolutionTime(feedback: UserFeedback[]): number {
    const resolvedFeedback = feedback.filter(f => f.resolution);
    
    if (resolvedFeedback.length === 0) return 0;
    
    const totalTime = resolvedFeedback.reduce((sum, f) => {
      if (f.resolution) {
        return sum + (f.resolution.implementedAt.getTime() - f.createdAt.getTime());
      }
      return sum;
    }, 0);
    
    return totalTime / resolvedFeedback.length / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Calculate satisfaction score
   */
  private calculateSatisfactionScore(feedback: UserFeedback[]): number {
    const feedbackWithRatings = feedback.filter(f => f.resolution?.satisfactionRating);
    
    if (feedbackWithRatings.length === 0) return 0;
    
    const totalRating = feedbackWithRatings.reduce((sum, f) => 
      sum + (f.resolution?.satisfactionRating || 0), 0
    );
    
    return totalRating / feedbackWithRatings.length;
  }

  /**
   * Calculate response rate
   */
  private calculateResponseRate(feedback: UserFeedback[]): number {
    if (feedback.length === 0) return 0;
    
    const respondedFeedback = feedback.filter(f => f.response);
    return (respondedFeedback.length / feedback.length) * 100;
  }

  /**
   * Calculate trend percentage
   */
  private calculateTrend(previousValue: number, currentValue: number): number {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Calculate sentiment trend
   */
  private calculateSentimentTrend(previousFeedback: UserFeedback[], currentFeedback: UserFeedback[]): number {
    const previousPositive = previousFeedback.filter(f => f.sentiment === 'positive').length;
    const currentPositive = currentFeedback.filter(f => f.sentiment === 'positive').length;
    
    const previousRate = previousFeedback.length > 0 ? previousPositive / previousFeedback.length : 0;
    const currentRate = currentFeedback.length > 0 ? currentPositive / currentFeedback.length : 0;
    
    return this.calculateTrend(previousRate, currentRate);
  }

  /**
   * Calculate resolution time trend
   */
  private calculateResolutionTimeTrend(previousFeedback: UserFeedback[], currentFeedback: UserFeedback[]): number {
    const previousTime = this.calculateAverageResolutionTime(previousFeedback);
    const currentTime = this.calculateAverageResolutionTime(currentFeedback);
    
    return this.calculateTrend(previousTime, currentTime);
  }

  /**
   * Get top issues
   */
  private getTopIssues(feedback: UserFeedback[]): FeedbackAnalytics['topIssues'] {
    const issueGroups = this.groupByField(feedback, 'category');
    
    return Object.entries(issueGroups)
      .map(([category, count]) => {
        const categoryFeedback = feedback.filter(f => f.category === category);
        const priorities = categoryFeedback.map(f => f.priority);
        const avgPriorityScore = priorities.reduce((sum, p) => {
          const score = { low: 1, medium: 2, high: 3, critical: 4 }[p] || 2;
          return sum + score;
        }, 0) / priorities.length;
        
        const avgPriority = avgPriorityScore >= 3.5 ? 'critical' :
                           avgPriorityScore >= 2.5 ? 'high' :
                           avgPriorityScore >= 1.5 ? 'medium' : 'low';
        
        return {
          category,
          count,
          averagePriority: avgPriority,
          trend: 'stable' as const // Simplified for now
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Analyze user segments
   */
  private analyzeUserSegments(feedback: UserFeedback[]): FeedbackAnalytics['userSegments'] {
    const segments: Record<string, {
      feedbackCount: number;
      averageSentiment: number;
      topCategories: string[];
    }> = {};

    // Group by subscription type
    const subscriptionGroups = this.groupFeedbackBySubscription(feedback);
    
    for (const [subscription, groupFeedback] of Object.entries(subscriptionGroups)) {
      const sentimentScores = groupFeedback.map(f => {
        return f.sentiment === 'positive' ? 1 : f.sentiment === 'negative' ? -1 : 0;
      });
      
      const averageSentiment = sentimentScores.length > 0 
        ? sentimentScores.reduce((sum: number, score) => sum + score, 0) / sentimentScores.length
        : 0;

      const categories = this.groupByField(groupFeedback, 'category');
      const topCategories = Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      segments[subscription] = {
        feedbackCount: groupFeedback.length,
        averageSentiment,
        topCategories
      };
    }

    return segments;
  }

  /**
   * Group feedback by subscription type
   */
  private groupFeedbackBySubscription(feedback: UserFeedback[]): Record<string, UserFeedback[]> {
    const groups: Record<string, UserFeedback[]> = {};
    
    feedback.forEach(f => {
      const subscription = f.context.subscriptionType || 'free';
      if (!groups[subscription]) groups[subscription] = [];
      groups[subscription].push(f);
    });
    
    return groups;
  }

  /**
   * Vote on feedback
   */
  public voteFeedback(feedbackId: string, userId: string, vote: 'up' | 'down'): boolean {
    const feedback = this.feedback.get(feedbackId);
    if (!feedback) return false;

    // Check if user already voted
    if (feedback.votes.voters.includes(userId)) return false;

    // Add vote
    if (vote === 'up') {
      feedback.votes.upvotes++;
    } else {
      feedback.votes.downvotes++;
    }
    
    feedback.votes.voters.push(userId);
    feedback.updatedAt = new Date();
    
    this.feedback.set(feedbackId, feedback);

    // Track vote
    trackFeatureUsage(userId, 'feedback-voted', true, {
      feedbackId,
      vote,
      feedbackType: feedback.type
    });

    return true;
  }

  /**
   * Add response to feedback
   */
  public addResponse(
    feedbackId: string, 
    message: string, 
    respondedBy: string,
    estimatedResolution?: Date
  ): boolean {
    const feedback = this.feedback.get(feedbackId);
    if (!feedback) return false;

    feedback.response = {
      message,
      respondedBy,
      respondedAt: new Date(),
      estimatedResolution
    };

    feedback.status = 'in_progress';
    feedback.updatedAt = new Date();
    
    this.feedback.set(feedbackId, feedback);

    return true;
  }

  /**
   * Resolve feedback
   */
  public resolveFeedback(
    feedbackId: string,
    solution: string,
    implementedBy: string,
    releaseVersion?: string,
    satisfactionRating?: number
  ): boolean {
    const feedback = this.feedback.get(feedbackId);
    if (!feedback) return false;

    feedback.resolution = {
      solution,
      implementedBy,
      implementedAt: new Date(),
      releaseVersion,
      satisfactionRating,
      followUpRequired: satisfactionRating ? satisfactionRating < 4 : false
    };

    feedback.status = 'resolved';
    feedback.updatedAt = new Date();
    
    this.feedback.set(feedbackId, feedback);

    // Track resolution
    trackFeatureUsage(feedback.userId, 'feedback-resolved', true, {
      feedbackId,
      feedbackType: feedback.type,
      resolutionTime: feedback.resolution.implementedAt.getTime() - feedback.createdAt.getTime(),
      satisfactionRating
    });

    return true;
  }

  /**
   * Get system statistics
   */
  public getSystemStats(): {
    totalFeedback: number;
    pendingFeedback: number;
    averageResponseTime: number;
    satisfactionScore: number;
    automatedResponseRate: number;
    topIssueCategories: string[];
  } {
    const allFeedback = Array.from(this.feedback.values());
    const pendingFeedback = allFeedback.filter(f => f.status === 'submitted' || f.status === 'reviewed').length;
    
    const respondedFeedback = allFeedback.filter(f => f.response);
    const averageResponseTime = respondedFeedback.length > 0
      ? respondedFeedback.reduce((sum, f) => {
          if (f.response) {
            return sum + (f.response.respondedAt.getTime() - f.createdAt.getTime());
          }
          return sum;
        }, 0) / respondedFeedback.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    const satisfactionScore = this.calculateSatisfactionScore(allFeedback);
    
    const automatedResponses = respondedFeedback.filter(f => f.response?.respondedBy === 'automated_system').length;
    const automatedResponseRate = respondedFeedback.length > 0 
      ? (automatedResponses / respondedFeedback.length) * 100 
      : 0;

    const categoryGroups = this.groupByField(allFeedback, 'category');
    const topIssueCategories = Object.entries(categoryGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    return {
      totalFeedback: allFeedback.length,
      pendingFeedback,
      averageResponseTime,
      satisfactionScore,
      automatedResponseRate,
      topIssueCategories
    };
  }

  /**
   * Shutdown the system
   */
  public shutdown() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    
    if (this.analyticsInterval) {
      clearInterval(this.analyticsInterval);
      this.analyticsInterval = undefined;
    }
  }
}
