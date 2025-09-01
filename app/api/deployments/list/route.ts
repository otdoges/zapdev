import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Replace with actual Convex query
    // For now, return mock data structure
    // In real implementation, this would query the deployedSites table
    
    const deployments = [
      // This would come from: api.deployments.getUserDeployments.call({ userId })
    ];

    return NextResponse.json({
      deployments,
      count: deployments.length,
      limit: 10, // Free tier limit
    });

  } catch (error) {
    console.error('[deployments] Failed to fetch deployments:', error);
    return NextResponse.json({
      error: 'Failed to fetch deployments'
    }, { status: 500 });
  }
}

// Also handle POST for filtering/searching
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      status, 
      search, 
      limit = 50,
      offset = 0 
    } = await request.json();

    // TODO: Implement filtering with Convex
    // const deployments = await api.deployments.getUserDeployments.call({
    //   userId,
    //   status,
    //   search,
    //   limit,
    //   offset
    // });

    const deployments: any[] = [];

    return NextResponse.json({
      deployments,
      count: deployments.length,
      total: deployments.length, // Would come from count query
      hasMore: deployments.length === limit,
    });

  } catch (error) {
    console.error('[deployments] Failed to search deployments:', error);
    return NextResponse.json({
      error: 'Failed to search deployments'
    }, { status: 500 });
  }
}