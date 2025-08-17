import { toast } from 'sonner';
import * as Sentry from '@sentry/react';
import { getGitHubToken as getSecureGitHubToken, validateGitHubToken as validateSecureGitHubToken, migrateFromLocalStorage } from './github-token-storage';

const { logger } = Sentry;

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  clone_url: string;
  html_url: string;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  fork: boolean;
  language: string | null;
  topics: string[];
  updated_at: string;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  email: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: 'open' | 'closed' | 'merged';
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
  };
}

export interface FileChange {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
}

export interface CreatePullRequestOptions {
  owner: string;
  repo: string;
  title: string;
  body: string;
  headBranch: string;
  baseBranch?: string;
  originalOwner?: string;
}

export interface UpdateFilesBody {
  message: string;
  content: string;
  branch: string;
  sha?: string;
}

class GitHubService {
  private baseUrl = 'https://api.github.com';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.token) {
      throw new Error('GitHub token not set. Please configure your GitHub access token.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  async getCurrentUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>('/user');
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.request<GitHubRepo>(`/repos/${owner}/${repo}`);
  }

  async parseRepoUrl(url: string): Promise<{ owner: string; repo: string } | null> {
    try {
      // Security: Only allow GitHub.com domains
      const allowedDomains = ['github.com', 'www.github.com'];
      
      // Validate URL format and domain
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const parsedUrl = new URL(url);
        if (!allowedDomains.includes(parsedUrl.hostname.toLowerCase())) {
          logger.warn('Rejected non-GitHub domain', { domain: parsedUrl.hostname });
          throw new Error('Only GitHub.com repositories are supported');
        }
      }
      
      // Handle various GitHub URL formats with domain validation
      const patterns = [
        /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/,
        /(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)\.git$/,
        /git@github\.com:([^/]+)\/([^/]+)\.git$/,
      ];

      const cleanUrl = url.trim();
      
      for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match) {
          const [, owner, repo] = match;
          
          // Additional validation for owner and repo names
          const cleanOwner = owner.trim();
          const cleanRepo = repo.replace(/\.git$/, '').trim();
          
          // Validate GitHub username/org and repo name patterns separately
          const ownerPattern = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
          const repoPattern = /^[A-Za-z0-9._-]{1,100}$/;
          
          const isOwnerValid = ownerPattern.test(cleanOwner);
          const isRepoValid = repoPattern.test(cleanRepo);
          
          if (!isOwnerValid || !isRepoValid) {
            const invalidFields = [];
            if (!isOwnerValid) invalidFields.push('owner');
            if (!isRepoValid) invalidFields.push('repo');
            
            logger.warn(`Invalid GitHub ${invalidFields.join(' and ')} format`, { 
              owner: cleanOwner, 
              repo: cleanRepo,
              invalidFields
            });
            throw new Error('Invalid GitHub repository format');
          }
          
          return { 
            owner: cleanOwner, 
            repo: cleanRepo 
          };
        }
      }

      return null;
    } catch (error) {
      logger.error('Error parsing GitHub URL:', error);
      return null;
    }
  }

  async forkRepo(owner: string, repo: string): Promise<GitHubRepo> {
    try {
      const forkedRepo = await this.request<GitHubRepo>(`/repos/${owner}/${repo}/forks`, {
        method: 'POST',
      });

      // Wait a moment for fork to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return forkedRepo;
    } catch (error) {
      logger.error('Error forking repository:', error);
      throw new Error(`Failed to fork repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createBranch(
    owner: string, 
    repo: string, 
    branchName: string, 
    fromBranch: string = 'main'
  ): Promise<void> {
    try {
      // Get the SHA of the base branch
      const baseRef = await this.request<{ object: { sha: string } }>(
        `/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`
      );

      // Create new branch
      await this.request(`/repos/${owner}/${repo}/git/refs`, {
        method: 'POST',
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseRef.object.sha,
        }),
      });
    } catch (error) {
      logger.error('Error creating branch:', error);
      throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateFiles(
    owner: string,
    repo: string,
    branch: string,
    files: FileChange[],
    commitMessage: string
  ): Promise<void> {
    try {
      for (const file of files) {
        if (file.action === 'delete') {
          // Get file SHA first for deletion
          const fileData = await this.request<{ sha: string }>(
            `/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`
          );

          await this.request(`/repos/${owner}/${repo}/contents/${file.path}`, {
            method: 'DELETE',
            body: JSON.stringify({
              message: `Delete ${file.path} - ${commitMessage}`,
              sha: fileData.sha,
              branch: branch,
            }),
          });
        } else {
          // Create or update file
          const body: UpdateFilesBody = {
            message: `${file.action === 'create' ? 'Create' : 'Update'} ${file.path} - ${commitMessage}`,
            content: btoa(unescape(encodeURIComponent(file.content))), // Base64 encode
            branch: branch,
          };

          if (file.action === 'update') {
            // Get current file SHA for update
            try {
              const fileData = await this.request<{ sha: string }>(
                `/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`
              );
              body.sha = fileData.sha;
            } catch (error) {
              // File might not exist, create it instead
              logger.info(`File ${file.path} not found, creating new file`, { filePath: file.path, action: 'create' });
            }
          }

          await this.request(`/repos/${owner}/${repo}/contents/${file.path}`, {
            method: 'PUT',
            body: JSON.stringify(body),
          });
        }
      }
    } catch (error) {
      logger.error('Error updating files:', error);
      throw new Error(`Failed to update files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPullRequest(options: CreatePullRequestOptions): Promise<GitHubPullRequest> {
    try {
      const { owner, repo, title, body, headBranch, baseBranch = 'main', originalOwner } = options;
      const head = originalOwner ? `${owner}:${headBranch}` : headBranch;
      const base = baseBranch;

      const pr = await this.request<GitHubPullRequest>(
        `/repos/${originalOwner || owner}/${repo}/pulls`,
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            body,
            head,
            base,
          }),
        }
      );

      return pr;
    } catch (error) {
      logger.error('Error creating pull request:', error);
      throw new Error(`Failed to create pull request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    branch: string = 'main'
  ): Promise<string> {
    try {
      const response = await this.request<{ content: string; encoding: string }>(
        `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
      );

      if (response.encoding === 'base64') {
        return atob(response.content.replace(/\s/g, ''));
      }
      return response.content;
    } catch (error) {
      logger.error('Error getting file content:', error);
      throw new Error(`Failed to get file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRepoStructure(
    owner: string,
    repo: string,
    branch: string = 'main',
    path: string = ''
  ): Promise<Array<{ name: string; type: 'file' | 'dir'; path: string }>> {
    try {
      const response = await this.request<Array<{
        name: string;
        type: 'file' | 'dir';
        path: string;
      }>>(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);

      return response;
    } catch (error) {
      logger.error('Error getting repository structure:', error);
      throw new Error(`Failed to get repository structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  generateBranchName(description: string): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const sanitized = description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
    
    return `zapdev-${sanitized}-${timestamp}`;
  }

  validateGitHubToken(token: string): boolean {
    return validateSecureGitHubToken(token);
  }
}

export const githubService = new GitHubService();

// Helper function to get GitHub token from secure storage or environment
export async function getGitHubToken(): Promise<string | null> {
  try {
    // First attempt migration from legacy localStorage
    await migrateFromLocalStorage();
    
    // Try to get from secure storage first (user-provided token)
    const secureToken = await getSecureGitHubToken();
    if (secureToken && githubService.validateGitHubToken(secureToken)) {
      return secureToken;
    }

    // Try environment variables as fallback
    const envToken = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
    if (envToken && githubService.validateGitHubToken(envToken)) {
      return envToken;
    }

    return null;
  } catch (error) {
    logger.error('Error retrieving GitHub token:', error);
    return null;
  }
}

export async function initializeGitHub(): Promise<boolean> {
  try {
    const token = await getGitHubToken();
    if (!token) {
      return false;
    }

    githubService.setToken(token);
    
    // Test the token by getting current user
    await githubService.getCurrentUser();
    return true;
  } catch (error) {
    logger.error('GitHub initialization failed:', error);
    return false;
  }
}

export { GitHubService };