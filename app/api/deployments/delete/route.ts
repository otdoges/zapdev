import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId, vercelDeploymentId } = await request.json();

    if (!siteId) {
      return NextResponse.json({ 
        error: 'Site ID is required' 
      }, { status: 400 });
    }

    // TODO: Get deployment from Convex to verify ownership
    // const deployment = await api.deployments.getDeployment.call({ siteId, userId });
    
    // if (!deployment) {
    //   return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
    // }

    // Delete from Vercel if we have the deployment ID
    if (vercelDeploymentId) {
      try {
        await deleteFromVercel(vercelDeploymentId);
      } catch (error) {
        console.warn('[deployment] Failed to delete from Vercel:', error);
        // Continue with local deletion even if Vercel deletion fails
      }
    }

    // TODO: Delete from Convex database
    // await api.deployments.deleteDeployment.call({ siteId, userId });

    return NextResponse.json({ 
      success: true,
      message: 'Deployment deleted successfully'
    });

  } catch (error) {
    console.error('[deployment] Failed to delete deployment:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

async function deleteFromVercel(deploymentId: string) {
  const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
  
  if (!VERCEL_API_TOKEN) {
    throw new Error('Vercel API token not configured');
  }

  const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel deletion failed: ${error}`);
  }

  return true;
}