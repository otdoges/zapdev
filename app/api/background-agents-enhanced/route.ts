import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getAIProcessorWithSearch, 
  processWithSearch, 
  createSearchEnabledTask,
  type BackgroundAgentTask,
  type SearchEnhancedRequest
} from '@/lib/ai-processor-with-search';

// Mock database - in production this would be a real database
let backgroundTasks: BackgroundAgentTask[] = [];
let systemActive = false;
let systemStats = {
  totalTasks: 0,
  completedTasks: 0,
  activeTasks: 0,
  searchQueries: 0,
  lastActivity: new Date()
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            active: systemActive,
            tasks: backgroundTasks,
            stats: systemStats
          }
        });

      case 'health':
        const processor = getAIProcessorWithSearch();
        const health = await processor.healthCheck();
        return NextResponse.json({
          success: true,
          data: health
        });

      case 'stats':
        const processorStats = getAIProcessorWithSearch().getStats();
        return NextResponse.json({
          success: true,
          data: {
            system: systemStats,
            processor: processorStats
          }
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            active: systemActive,
            taskCount: backgroundTasks.length,
            activeTaskCount: backgroundTasks.filter(t => t.status === 'processing').length
          }
        });
    }
  } catch (error) {
    console.error('Background agents GET error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'activate':
        systemActive = true;
        systemStats.lastActivity = new Date();
        
        return NextResponse.json({
          success: true,
          data: { active: true, message: 'Background agent system activated' }
        });

      case 'deactivate':
        systemActive = false;
        // Cancel all pending tasks
        backgroundTasks = backgroundTasks.filter(task => task.status === 'completed');
        systemStats.lastActivity = new Date();
        
        return NextResponse.json({
          success: true,
          data: { active: false, message: 'Background agent system deactivated' }
        });

      case 'add-task':
        if (!systemActive) {
          return NextResponse.json({
            success: false,
            error: 'Background agent system is not active'
          }, { status: 400 });
        }

        const { prompt, type, searchEnabled } = data;
        if (!prompt) {
          return NextResponse.json({
            success: false,
            error: 'Prompt is required'
          }, { status: 400 });
        }

        const newTask = await createSearchEnabledTask(prompt, type || 'research');
        newTask.searchEnabled = searchEnabled !== false; // Default to true
        
        backgroundTasks.push(newTask);
        systemStats.totalTasks++;
        systemStats.activeTasks++;
        systemStats.lastActivity = new Date();

        // Start processing the task in the background
        processTaskInBackground(newTask);

        return NextResponse.json({
          success: true,
          data: {
            task: newTask,
            message: 'Task added to background queue'
          }
        });

      case 'process-with-search':
        if (!systemActive) {
          return NextResponse.json({
            success: false,
            error: 'Background agent system is not active'
          }, { status: 400 });
        }

        const searchRequest: SearchEnhancedRequest = {
          prompt: data.prompt,
          model: data.model,
          includeSearch: data.includeSearch !== false,
          searchQueries: data.searchQueries,
          searchContext: data.searchContext,
          maxSearchResults: data.maxSearchResults || 5,
          backgroundMode: true
        };

        const result = await processWithSearch(searchRequest.prompt, searchRequest);
        
        systemStats.searchQueries += result.searchQueries?.length || 0;
        systemStats.lastActivity = new Date();

        return NextResponse.json({
          success: true,
          data: result
        });

      case 'cancel-task':
        const taskId = data.taskId;
        const taskIndex = backgroundTasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          return NextResponse.json({
            success: false,
            error: 'Task not found'
          }, { status: 404 });
        }

        const task = backgroundTasks[taskIndex];
        if (task.status === 'processing') {
          task.status = 'error';
          task.error = 'Cancelled by user';
          task.completedAt = new Date();
          systemStats.activeTasks--;
        }

        return NextResponse.json({
          success: true,
          data: { message: 'Task cancelled' }
        });

      case 'clear-completed':
        const beforeCount = backgroundTasks.length;
        backgroundTasks = backgroundTasks.filter(task => task.status !== 'completed');
        const removedCount = beforeCount - backgroundTasks.length;
        
        return NextResponse.json({
          success: true,
          data: { 
            message: `Removed ${removedCount} completed tasks`,
            remainingTasks: backgroundTasks.length
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Background agents POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Process a task in the background
 */
async function processTaskInBackground(task: BackgroundAgentTask) {
  try {
    task.status = 'processing';
    
    // Simulate some processing time for demo
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const processor = getAIProcessorWithSearch();
    const searchRequest: SearchEnhancedRequest = {
      prompt: task.prompt,
      includeSearch: task.searchEnabled,
      backgroundMode: true,
      maxSearchResults: 5
    };

    const result = await processor.processRequest(searchRequest);
    
    task.result = result;
    task.status = 'completed';
    task.completedAt = new Date();
    
    systemStats.completedTasks++;
    systemStats.activeTasks = Math.max(0, systemStats.activeTasks - 1);
    systemStats.searchQueries += result.searchQueries?.length || 0;
    systemStats.lastActivity = new Date();

  } catch (error) {
    task.status = 'error';
    task.error = error instanceof Error ? error.message : 'Unknown error';
    task.completedAt = new Date();
    
    systemStats.activeTasks = Math.max(0, systemStats.activeTasks - 1);
    systemStats.lastActivity = new Date();
    
    console.error(`Background task ${task.id} failed:`, error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset the entire system
    backgroundTasks = [];
    systemActive = false;
    systemStats = {
      totalTasks: 0,
      completedTasks: 0,
      activeTasks: 0,
      searchQueries: 0,
      lastActivity: new Date()
    };

    return NextResponse.json({
      success: true,
      data: { message: 'Background agent system reset' }
    });
  } catch (error) {
    console.error('Background agents DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}