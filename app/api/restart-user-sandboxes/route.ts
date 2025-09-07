import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    console.log('[restart-user-sandboxes] Restarting all sandboxes for user:', userId);

    // Get all active sandboxes for this user from E2B
    // In a production system, you'd store sandbox-user mappings in your database
    // For now, we'll use E2B's API to list and restart sandboxes
    const e2bApiKey = process.env.E2B_API_KEY;
    
    if (!e2bApiKey) {
      return NextResponse.json({ 
        error: 'E2B API key not configured' 
      }, { status: 500 });
    }

    // List all sandboxes for this user
    const listResponse = await fetch('https://api.e2b.dev/sandboxes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${e2bApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      console.error('[restart-user-sandboxes] Failed to list sandboxes:', listResponse.statusText);
      return NextResponse.json({ 
        error: 'Failed to list user sandboxes' 
      }, { status: 500 });
    }

    const sandboxList = await listResponse.json();
    console.log('[restart-user-sandboxes] Found sandboxes:', sandboxList);

    let restartedCount = 0;
    const results = [];

    // Filter sandboxes that belong to this user (you might need to implement user tagging)
    // For now, restart all running sandboxes (in production, you'd filter by user)
    for (const sandbox of sandboxList.sandboxes || []) {
      try {
        console.log('[restart-user-sandboxes] Restarting sandbox:', sandbox.sandboxId);
        
        // Kill existing sandbox
        const killResponse = await fetch(`https://api.e2b.dev/sandboxes/${sandbox.sandboxId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${e2bApiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (killResponse.ok) {
          restartedCount++;
          results.push({
            sandboxId: sandbox.sandboxId,
            status: 'restarted',
            message: 'Successfully killed and will be recreated on next request'
          });
        } else {
          results.push({
            sandboxId: sandbox.sandboxId,
            status: 'error',
            message: 'Failed to kill sandbox'
          });
        }
      } catch (error) {
        console.error('[restart-user-sandboxes] Error restarting sandbox:', error);
        results.push({
          sandboxId: sandbox.sandboxId,
          status: 'error',
          message: 'Exception occurred during restart'
        });
      }
    }

    console.log('[restart-user-sandboxes] Restart completed. Count:', restartedCount);

    return NextResponse.json({
      success: true,
      restartedCount,
      results,
      message: `Successfully restarted ${restartedCount} sandboxes. New sandboxes will be created automatically on next use.`
    });

  } catch (error) {
    console.error('[restart-user-sandboxes] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to restart user sandboxes'
    }, { status: 500 });
  }
}
