import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  GitBranch, 
  GitPullRequest, 
  Github, 
  ExternalLink, 
  Loader2, 
  Check, 
  AlertCircle,
  Settings,
  Key,
  FileText,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { githubService, initializeGitHub, type GitHubRepo, type FileChange, type CreatePullRequestOptions } from '@/lib/github-service';
import { setGitHubToken, clearGitHubToken } from '@/lib/github-token-storage';
import * as Sentry from '@sentry/react';

const { logger } = Sentry;

export interface GitHubIntegrationProps {
  onRepoSelected?: (repo: GitHubRepo) => void;
  onPullRequestCreated?: (prUrl: string, repo: GitHubRepo) => void;
  className?: string;
}

interface GitHubOperationStatus {
  stage: 'idle' | 'parsing' | 'forking' | 'creating-branch' | 'applying-changes' | 'creating-pr' | 'completed' | 'error';
  message: string;
  progress: number;
}

export function GitHubIntegration({ 
  onRepoSelected, 
  onPullRequestCreated, 
  className = '' 
}: GitHubIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isTokenSetup, setIsTokenSetup] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [currentRepo, setCurrentRepo] = useState<GitHubRepo | null>(null);
  const [operationStatus, setOperationStatus] = useState<GitHubOperationStatus>({
    stage: 'idle',
    message: 'Ready to start',
    progress: 0
  });
  
  // Pull Request creation fields
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [changes, setChanges] = useState<FileChange[]>([]);
  const [showPRForm, setShowPRForm] = useState(false);

  // Token setup
  const [showTokenSetup, setShowTokenSetup] = useState(false);

  useEffect(() => {
    checkGitHubSetup();
  }, []);

  const checkGitHubSetup = async () => {
    const isSetup = await initializeGitHub();
    setIsTokenSetup(isSetup);
  };

  const saveGitHubToken = async () => {
    if (!githubToken.trim()) {
      toast.error('Please enter a valid GitHub token');
      return;
    }

    if (!githubService.validateGitHubToken(githubToken)) {
      toast.error('Invalid GitHub token format. Please check your token.');
      return;
    }

    try {
      await setGitHubToken(githubToken.trim());
      githubService.setToken(githubToken.trim());
      
      // Clear token from component state immediately after use
      setGithubToken('');
      
      setIsTokenSetup(true);
      setShowTokenSetup(false);
      toast.success('GitHub token saved securely!');
    } catch (error) {
      logger.error('Failed to save GitHub token:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Failed to save GitHub token. Please try again.');
    }
  };

  const parseAndLoadRepo = async () => {
    if (!githubUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    if (!isTokenSetup) {
      toast.error('Please configure your GitHub token first');
      setShowTokenSetup(true);
      return;
    }

    try {
      setOperationStatus({
        stage: 'parsing',
        message: 'Parsing GitHub URL...',
        progress: 10
      });

      const parsed = await githubService.parseRepoUrl(githubUrl);
      if (!parsed) {
        throw new Error('Invalid GitHub URL format');
      }

      setOperationStatus({
        stage: 'parsing',
        message: `Loading repository ${parsed.owner}/${parsed.repo}...`,
        progress: 30
      });

      const repo = await githubService.getRepo(parsed.owner, parsed.repo);
      setCurrentRepo(repo);
      
      setOperationStatus({
        stage: 'completed',
        message: `Repository loaded successfully!`,
        progress: 100
      });

      if (onRepoSelected) {
        onRepoSelected(repo);
      }

      toast.success(`Repository ${repo.full_name} loaded successfully!`);
    } catch (error) {
      logger.error('Error loading repository:', { error: error instanceof Error ? error.message : String(error) });
      setOperationStatus({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Failed to load repository',
        progress: 0
      });
      toast.error(error instanceof Error ? error.message : 'Failed to load repository');
    }
  };

  const createPullRequest = async () => {
    if (!currentRepo || changes.length === 0) {
      toast.error('No changes to commit');
      return;
    }

    if (!prTitle.trim()) {
      toast.error('Please enter a pull request title');
      return;
    }

    try {
      const originalOwner = currentRepo.owner.login;
      const originalRepo = currentRepo.name;

      setOperationStatus({
        stage: 'forking',
        message: 'Forking repository...',
        progress: 20
      });

      // Fork the repository
      const forkedRepo = await githubService.forkRepo(originalOwner, originalRepo);
      const userLogin = forkedRepo.owner.login;

      setOperationStatus({
        stage: 'creating-branch',
        message: 'Creating feature branch...',
        progress: 40
      });

      // Create a new branch
      const branchName = githubService.generateBranchName(prTitle);
      await githubService.createBranch(userLogin, originalRepo, branchName, currentRepo.default_branch);

      setOperationStatus({
        stage: 'applying-changes',
        message: 'Applying changes...',
        progress: 60
      });

      // Apply changes
      await githubService.updateFiles(
        userLogin,
        originalRepo,
        branchName,
        changes,
        prTitle
      );

      setOperationStatus({
        stage: 'creating-pr',
        message: 'Creating pull request...',
        progress: 80
      });

      // Create pull request using options object pattern
      const prOptions: CreatePullRequestOptions = {
        owner: originalOwner,
        repo: originalRepo,
        title: prTitle,
        body: prDescription,
        headBranch: branchName,
        baseBranch: currentRepo.default_branch,
        originalOwner: originalOwner
      };
      
      const pr = await githubService.createPullRequest(prOptions);

      setOperationStatus({
        stage: 'completed',
        message: 'Pull request created successfully!',
        progress: 100
      });

      if (onPullRequestCreated) {
        onPullRequestCreated(pr.html_url, currentRepo);
      }

      toast.success(`Pull request created: ${pr.html_url}`);
      
      // Reset form
      setShowPRForm(false);
      setPrTitle('');
      setPrDescription('');
      setChanges([]);
      
    } catch (error) {
      logger.error('Error creating pull request:', { error: error instanceof Error ? error.message : String(error) });
      setOperationStatus({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Failed to create pull request',
        progress: 0
      });
      toast.error(error instanceof Error ? error.message : 'Failed to create pull request');
    }
  };

  const addFileChange = () => {
    setChanges([...changes, { path: '', content: '', action: 'create' }]);
  };

  const updateFileChange = (index: number, field: keyof FileChange, value: string) => {
    if (index < 0 || index >= changes.length) {
      return; // Bounds check for security
    }
    
    setChanges(prevChanges => 
      prevChanges.map((change, i) => {
        if (i !== index) return change;
        
        switch (field) {
          case 'path':
            return { ...change, path: value };
          case 'content':
            return { ...change, content: value };
          case 'action':
            return { ...change, action: value as FileChange['action'] };
          default:
            return change;
        }
      })
    );
  };

  const removeFileChange = (index: number) => {
    setChanges(changes.filter((_, i) => i !== index));
  };

  const getStatusIcon = () => {
    switch (operationStatus.stage) {
      case 'parsing':
      case 'forking':
      case 'creating-branch':
      case 'applying-changes':
      case 'creating-pr':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Github className="h-4 w-4" />;
    }
  };

  return (
    <div className={className}>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="glass-elevated hover:glass-hover transition-all duration-200"
          >
            <Github className="h-4 w-4 mr-2" />
            GitHub Integration
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Integration
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* GitHub Token Setup */}
            <Card className={`glass-elevated ${!isTokenSetup ? 'border-orange-500' : 'border-green-500'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Key className="h-4 w-4" />
                  GitHub Token Setup
                  {isTokenSetup && <Badge variant="secondary" className="bg-green-500/20 text-green-300">Configured</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isTokenSetup ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      You need a GitHub Personal Access Token to fork repositories and create pull requests.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTokenSetup(!showTokenSetup)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Token
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('https://github.com/settings/tokens', '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Generate Token
                      </Button>
                    </div>
                    
                    {showTokenSetup && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 mt-4 p-4 rounded-lg glass"
                      >
                        <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                        <Input
                          id="github-token"
                          type="password"
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Required scopes: repo, workflow, write:packages
                        </p>
                        <div className="flex gap-2">
                          <Button onClick={saveGitHubToken} size="sm">
                            Save Token
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setGithubToken('');
                              setShowTokenSetup(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">GitHub token configured successfully</span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTokenSetup(true)}
                      >
                        Update
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await clearGitHubToken();
                            setIsTokenSetup(false);
                            toast.success('GitHub token removed');
                          } catch (error) {
                            logger.error('Failed to clear token:', { error: error instanceof Error ? error.message : String(error) });
                            toast.error('Failed to remove token');
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Repository Input */}
            <Card className="glass-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GitBranch className="h-4 w-4" />
                  Repository Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-url">GitHub Repository URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="github-url"
                      placeholder="https://github.com/owner/repo"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      disabled={operationStatus.stage !== 'idle' && operationStatus.stage !== 'completed' && operationStatus.stage !== 'error'}
                    />
                    <Button
                      onClick={parseAndLoadRepo}
                      disabled={!isTokenSetup || (operationStatus.stage !== 'idle' && operationStatus.stage !== 'completed' && operationStatus.stage !== 'error')}
                    >
                      {operationStatus.stage === 'parsing' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Load Repo'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Operation Status */}
                <AnimatePresence>
                  {operationStatus.stage !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className="text-sm">{operationStatus.message}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${operationStatus.progress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Repository Info */}
                <AnimatePresence>
                  {currentRepo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-lg glass space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={currentRepo.owner.avatar_url} 
                          alt={currentRepo.owner.login}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold">{currentRepo.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{currentRepo.description}</p>
                        </div>
                        <div className="ml-auto flex gap-2">
                          {currentRepo.language && (
                            <Badge variant="secondary">{currentRepo.language}</Badge>
                          )}
                          <Badge variant={currentRepo.private ? 'destructive' : 'default'}>
                            {currentRepo.private ? 'Private' : 'Public'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(currentRepo.html_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on GitHub
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowPRForm(true)}
                        >
                          <GitPullRequest className="h-4 w-4 mr-2" />
                          Create Pull Request
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Pull Request Form */}
            <AnimatePresence>
              {showPRForm && currentRepo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="glass-elevated">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <GitPullRequest className="h-4 w-4" />
                        Create Pull Request
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pr-title">Pull Request Title *</Label>
                          <Input
                            id="pr-title"
                            placeholder="Brief description of changes"
                            value={prTitle}
                            onChange={(e) => setPrTitle(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pr-description">Description</Label>
                          <Textarea
                            id="pr-description"
                            placeholder="Detailed description of changes and improvements"
                            value={prDescription}
                            onChange={(e) => setPrDescription(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* File Changes */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base">File Changes ({changes.length})</Label>
                          <Button variant="outline" size="sm" onClick={addFileChange}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add File
                          </Button>
                        </div>

                        {changes.map((change, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 rounded-lg glass space-y-2"
                          >
                            <div className="flex gap-2">
                              <Input
                                placeholder="File path (e.g., src/components/Button.tsx)"
                                value={change.path}
                                onChange={(e) => updateFileChange(index, 'path', e.target.value)}
                                className="flex-1"
                              />
                              <select
                                value={change.action}
                                onChange={(e) => updateFileChange(index, 'action', e.target.value as FileChange['action'])}
                                className="px-3 py-2 rounded-md border border-input bg-background"
                              >
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                              </select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFileChange(index)}
                                className="text-red-500"
                              >
                                ×
                              </Button>
                            </div>
                            {change.action !== 'delete' && (
                              <Textarea
                                placeholder="File content..."
                                value={change.content}
                                onChange={(e) => updateFileChange(index, 'content', e.target.value)}
                                rows={6}
                                className="font-mono text-sm"
                              />
                            )}
                          </motion.div>
                        ))}

                        {changes.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No file changes added yet.</p>
                            <p className="text-sm">Add files to create a pull request.</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowPRForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={createPullRequest}
                          disabled={!prTitle.trim() || changes.length === 0 || operationStatus.stage === 'forking' || operationStatus.stage === 'creating-branch' || operationStatus.stage === 'applying-changes' || operationStatus.stage === 'creating-pr'}
                        >
                          {(operationStatus.stage === 'forking' || operationStatus.stage === 'creating-branch' || operationStatus.stage === 'applying-changes' || operationStatus.stage === 'creating-pr') ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <GitPullRequest className="h-4 w-4 mr-2" />
                          )}
                          Create Pull Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}