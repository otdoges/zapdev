import { NextRequest, NextResponse } from 'next/server';
import { UserFeedbackSystem } from '@/lib/user-feedback-system';
import { auth } from '@clerk/nextjs/server';

const feedbackSystem = UserFeedbackSystem.getInstance();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // CRITICAL SECURITY FIX: Require authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'feedback':
        const feedbackId = searchParams.get('feedbackId');
        if (feedbackId) {
          const feedback = feedbackSystem.getFeedback(feedbackId);
          return NextResponse.json({ success: true, feedback });
        } else {
          // Get feedback list with filters - SECURITY: Only allow user's own feedback
          const filters = {
            userId: userId, // Force to authenticated user's ID only
            type: searchParams.get('type') as any,
            category: searchParams.get('category') as any,
            status: searchParams.get('status') as any,
            priority: searchParams.get('priority') as any,
            sentiment: searchParams.get('sentiment') as any,
            limit: parseInt(searchParams.get('limit') || '50'),
            offset: parseInt(searchParams.get('offset') || '0')
          };
          
          const feedbackList = feedbackSystem.getFeedbackList(filters);
          return NextResponse.json({ success: true, feedback: feedbackList });
        }

      case 'templates':
        const subscriptionLevel = searchParams.get('subscriptionLevel') || undefined;
        const templates = feedbackSystem.getTemplates(subscriptionLevel);
        return NextResponse.json({ success: true, templates });

      case 'analytics':
        const period = searchParams.get('period') as any || 'month';
        const analytics = feedbackSystem.getAnalytics(period);
        return NextResponse.json({ success: true, analytics });

      case 'stats':
        const stats = feedbackSystem.getSystemStats();
        return NextResponse.json({ success: true, stats });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Feedback system API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Feedback operation failed' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // CRITICAL SECURITY FIX: Require authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'submit':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }
        
        if (!data.type || !data.title || !data.description) {
          return NextResponse.json(
            { success: false, error: 'Type, title, and description are required' },
            { status: 400 }
          );
        }
        
        const feedbackId = await feedbackSystem.submitFeedback(userId, {
          type: data.type,
          category: data.category || 'general',
          title: data.title,
          description: data.description,
          priority: data.priority || 'medium',
          severity: data.severity,
          status: 'submitted',
          context: {
            userAgent: data.userAgent,
            page: data.page,
            feature: data.feature,
            sessionId: data.sessionId,
            subscriptionType: data.subscriptionType || 'free',
            reproductionSteps: data.reproductionSteps,
            expectedBehavior: data.expectedBehavior,
            actualBehavior: data.actualBehavior,
            attachments: data.attachments || []
          },
          tags: data.tags || []
        });
        
        return NextResponse.json({ success: true, feedbackId });

      case 'vote':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }
        
        if (!data.feedbackId || !data.vote) {
          return NextResponse.json(
            { success: false, error: 'Feedback ID and vote are required' },
            { status: 400 }
          );
        }
        
        const voted = feedbackSystem.voteFeedback(data.feedbackId, userId, data.vote);
        return NextResponse.json({ success: true, voted });

      case 'respond':
        if (!data.feedbackId || !data.message || !data.respondedBy) {
          return NextResponse.json(
            { success: false, error: 'Feedback ID, message, and responder are required' },
            { status: 400 }
          );
        }
        
        const responded = feedbackSystem.addResponse(
          data.feedbackId,
          data.message,
          data.respondedBy,
          data.estimatedResolution ? new Date(data.estimatedResolution) : undefined
        );
        
        return NextResponse.json({ success: true, responded });

      case 'resolve':
        if (!data.feedbackId || !data.solution || !data.implementedBy) {
          return NextResponse.json(
            { success: false, error: 'Feedback ID, solution, and implementer are required' },
            { status: 400 }
          );
        }
        
        const resolved = feedbackSystem.resolveFeedback(
          data.feedbackId,
          data.solution,
          data.implementedBy,
          data.releaseVersion,
          data.satisfactionRating
        );
        
        return NextResponse.json({ success: true, resolved });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Feedback system API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Feedback operation failed' 
      },
      { status: 500 }
    );
  }
}
