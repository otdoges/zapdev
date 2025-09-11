import { NextResponse } from 'next/server';
import { getBestAvailableModel, getAvailableModels } from '@/lib/model-detector';

export async function GET() {
  try {
    const availableModels = getAvailableModels();
    
    if (availableModels.length === 0) {
      return NextResponse.json({
        error: 'No API keys configured',
        model: null,
        availableModels: [],
        hasModels: false
      }, { status: 400 });
    }
    
    const bestModel = getBestAvailableModel();
    
    return NextResponse.json({
      model: bestModel,
      availableModels,
      hasModels: true
    });
  } catch (error) {
    console.error('Error detecting models:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      model: null,
      availableModels: [],
      hasModels: false
    }, { status: 500 });
  }
}