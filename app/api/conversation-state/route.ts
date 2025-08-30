import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import type { ConversationState } from '@/types/conversation';

declare global {
  var conversationState: ConversationState | null;
}

// GET: Retrieve current conversation state
export async function GET(): Promise<NextResponse> {
  try {
    // Check authentication but allow unauthenticated access for initial state
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        success: true,
        state: null,
        message: 'No active conversation (unauthenticated)'
      });
    }
    
    try {
      if (!global.conversationState) {
        return NextResponse.json({
          success: true,
          state: null,
          message: 'No active conversation'
        });
      }
      
      return NextResponse.json({
        success: true,
        state: global.conversationState
      });
    } catch (error) {
      console.error('[conversation-state] Error getting state:', error);
      return NextResponse.json({
        success: false,
        error: (error as Error).message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[conversation-state] Error in authentication:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication failed'
    }, { status: 401 });
  }
}

// POST: Reset or update conversation state
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication but allow unauthenticated access for basic operations
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required for conversation state updates' },
        { status: 401 }
      );
    }
    
    const { action, data } = await request.json();
    
    switch (action) {
      case 'reset':
        global.conversationState = {
          conversationId: `conv-${Date.now()}`,
          startedAt: Date.now(),
          lastUpdated: Date.now(),
          context: {
            messages: [],
            edits: [],
            projectEvolution: { majorChanges: [] },
            userPreferences: {}
          }
        };
        
        console.log('[conversation-state] Reset conversation state');
        
        return NextResponse.json({
          success: true,
          message: 'Conversation state reset',
          state: global.conversationState
        });
        
      case 'clear-old':
        // Clear old conversation data but keep recent context
        if (!global.conversationState) {
          return NextResponse.json({
            success: false,
            error: 'No active conversation to clear'
          }, { status: 400 });
        }
        
        // Keep only recent data
        global.conversationState.context.messages = global.conversationState.context.messages.slice(-5);
        global.conversationState.context.edits = global.conversationState.context.edits.slice(-3);
        global.conversationState.context.projectEvolution.majorChanges = 
          global.conversationState.context.projectEvolution.majorChanges.slice(-2);
        
        console.log('[conversation-state] Cleared old conversation data');
        
        return NextResponse.json({
          success: true,
          message: 'Old conversation data cleared',
          state: global.conversationState
        });
        
      case 'update':
        if (!global.conversationState) {
          return NextResponse.json({
            success: false,
            error: 'No active conversation to update'
          }, { status: 400 });
        }
        
        // Update specific fields if provided
        if (data) {
          if (data.currentTopic) {
            global.conversationState.context.currentTopic = data.currentTopic;
          }
          if (data.userPreferences) {
            global.conversationState.context.userPreferences = {
              ...global.conversationState.context.userPreferences,
              ...data.userPreferences
            };
          }
          
          global.conversationState.lastUpdated = Date.now();
        }
        
        return NextResponse.json({
          success: true,
          message: 'Conversation state updated',
          state: global.conversationState
        });
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "reset" or "update"'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[conversation-state] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// DELETE: Clear conversation state
export async function DELETE(): Promise<NextResponse> {
  try {
    // CRITICAL SECURITY FIX: Require authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    global.conversationState = null;
    
    console.log('[conversation-state] Cleared conversation state');
    
    return NextResponse.json({
      success: true,
      message: 'Conversation state cleared'
    });
  } catch (error) {
    console.error('[conversation-state] Error clearing state:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}