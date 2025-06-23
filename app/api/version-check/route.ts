import { NextRequest, NextResponse } from 'next/server';
import packageJson from '../../../package.json';

export async function GET(request: NextRequest) {
  try {
    const currentVersion = packageJson.version;
    
    // Fetch latest version from GitHub API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const [releaseResponse, masterResponse] = await Promise.allSettled([
        // Try to get the latest release first
        fetch('https://api.github.com/repos/otdoges/zapdev/releases/latest', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ZapDev-Version-Check'
          },
          signal: controller.signal
        }),
        // Also get the latest commit from master branch
        fetch('https://api.github.com/repos/otdoges/zapdev/commits/master', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'ZapDev-Version-Check'
          },
          signal: controller.signal
        })
      ]);

      clearTimeout(timeoutId);

      let isUpdateAvailable = false;
      let latestVersion = '';
      let updateSource = '';
      let updateInfo = '';

      // Check releases first
      if (releaseResponse.status === 'fulfilled' && releaseResponse.value.ok) {
        const releaseData = await releaseResponse.value.json();
        const releaseVersion = releaseData.tag_name?.replace(/^v/, '').trim();
        
        if (releaseVersion && releaseVersion !== currentVersion) {
          // Simple version comparison - works for semantic versioning
          const currentParts = currentVersion.split('.').map(Number);
          const releaseParts = releaseVersion.split('.').map(Number);
          
          for (let i = 0; i < Math.max(currentParts.length, releaseParts.length); i++) {
            const current = currentParts[i] || 0;
            const release = releaseParts[i] || 0;
            
            if (release > current) {
              isUpdateAvailable = true;
              latestVersion = releaseVersion;
              updateSource = 'release';
              updateInfo = releaseData.name || `Release v${releaseVersion}`;
              break;
            } else if (current > release) {
              break;
            }
          }
        }
      }

      // If no newer release, check master branch for newer commits
      if (!isUpdateAvailable && masterResponse.status === 'fulfilled' && masterResponse.value.ok) {
        const masterData = await masterResponse.value.json();
        
        // Additional check: see if package.json in master has a different version
        try {
          const packageController = new AbortController();
          const packageTimeoutId = setTimeout(() => packageController.abort(), 3000);
          
          const packageResponse = await fetch('https://api.github.com/repos/otdoges/zapdev/contents/package.json?ref=master', {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'ZapDev-Version-Check'
            },
            signal: packageController.signal
          });
          
          clearTimeout(packageTimeoutId);
          
          if (packageResponse.ok) {
            const packageData = await packageResponse.json();
            const packageContent = atob(packageData.content);
            const masterPackage = JSON.parse(packageContent);
            
            if (masterPackage.version !== currentVersion) {
              isUpdateAvailable = true;
              latestVersion = masterPackage.version;
              updateSource = 'master';
              updateInfo = `Latest development version (${masterData.sha.substring(0, 7)})`;
            }
          }
        } catch (error) {
          // If we can't check package.json, still notify about master commits if they're recent
          const masterCommitDate = new Date(masterData.commit.committer.date);
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          if (masterCommitDate > oneDayAgo) {
            isUpdateAvailable = true;
            latestVersion = 'newer commit';
            updateSource = 'master';
            updateInfo = `New commits available (${masterData.sha.substring(0, 7)})`;
          }
        }
      }

      return NextResponse.json({
        currentVersion,
        isUpdateAvailable,
        latestVersion,
        updateSource,
        updateInfo,
        timestamp: new Date().toISOString()
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }

  } catch (error) {
    console.error('Version check error:', error);
    
    return NextResponse.json({
      currentVersion: packageJson.version,
      isUpdateAvailable: false,
      error: 'Failed to check for updates',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 