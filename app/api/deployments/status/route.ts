import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId, vercelDeploymentId } = await request.json();

    if (!siteId && !vercelDeploymentId) {
      return NextResponse.json({ 
        error: 'Either siteId or vercelDeploymentId is required' 
      }, { status: 400 });
    }

    let deployment: any = null;

    // Get deployment from our database first
    if (siteId) {
      // TODO: Get from Convex
      // deployment = await api.deployments.getDeployment.call({ siteId, userId });
    }

    // Get status from Vercel if we have the deployment ID
    let vercelStatus = null;
    if (vercelDeploymentId || deployment?.vercelDeploymentId) {
      try {
        vercelStatus = await getVercelDeploymentStatus(
          vercelDeploymentId || deployment.vercelDeploymentId
        );
      } catch (error) {
        console.warn('[deployment] Failed to get Vercel status:', error);
      }
    }

    // Update local status if Vercel status has changed
    if (vercelStatus && deployment && vercelStatus.status !== deployment.status) {
      const newStatus = mapVercelStatusToLocal(vercelStatus.status);
      
      // TODO: Update in Convex
      // await api.deployments.updateDeploymentStatus.call({
      //   siteId,
      //   status: newStatus,
      //   buildLogs: vercelStatus.buildLogs,
      //   errorMessage: vercelStatus.error,
      // });
      
      deployment.status = newStatus;
      deployment.buildLogs = vercelStatus.buildLogs;
      deployment.errorMessage = vercelStatus.error;
    }

    return NextResponse.json({
      deployment,
      vercelStatus,
      lastChecked: Date.now(),
    });

  } catch (error) {
    console.error('[deployment] Failed to check status:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

async function getVercelDeploymentStatus(deploymentId: string) {
  const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
  
  if (!VERCEL_API_TOKEN) {
    throw new Error('Vercel API token not configured');
  }

  const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
    headers: {
      'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel API error: ${error}`);
  }

  const deployment = await response.json();
  
  // Get build logs if deployment failed
  let buildLogs = null;
  if (deployment.state === 'ERROR') {
    try {
      const logsResponse = await fetch(`https://api.vercel.com/v2/deployments/${deploymentId}/events`, {
        headers: {
          'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        },
      });
      
      if (logsResponse.ok) {
        buildLogs = await logsResponse.json();
      }
    } catch (error) {
      console.warn('[vercel] Failed to get build logs:', error);
    }
  }
  
  return {
    status: deployment.state, // BUILDING, READY, ERROR, CANCELED
    url: deployment.url,
    createdAt: deployment.createdAt,
    readyAt: deployment.readyAt,
    buildLogs,
    error: deployment.error?.message,
  };
}

function mapVercelStatusToLocal(vercelStatus: string): 'building' | 'ready' | 'error' | 'queued' {
  switch (vercelStatus) {
    case 'BUILDING':
    case 'INITIALIZING':
      return 'building';
    case 'READY':
      return 'ready';
    case 'ERROR':
      return 'error';
    case 'QUEUED':
      return 'queued';
    default:
      return 'building';
  }
}