# GitHub CLI Integration Guide

## Overview

This system provides seamless GitHub repository integration using the GitHub CLI (`gh`). Users can provide GitHub repository URLs and the AI agents will automatically clone, work on, and create pull requests.

## Prerequisites

### 1. Install GitHub CLI

**macOS:**
```bash
brew install gh
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**Windows:**
```bash
winget install --id GitHub.cli
```

### 2. Authenticate with GitHub

```bash
gh auth login
```

Follow the prompts to authenticate with your GitHub account.

### 3. Verify Installation

```bash
gh --version
gh auth status
```

## Usage

### Basic Workflow

1. **Provide GitHub URL**: Paste any GitHub repository URL
2. **Describe Feature**: Tell the AI what you want to implement
3. **Start Workflow**: AI agents will:
   - Clone the repository
   - Analyze the codebase
   - Create a development plan
   - Implement the feature
   - Commit changes
   - Create a pull request

### Supported URL Formats

The system accepts various GitHub URL formats:

```
https://github.com/owner/repo
https://github.com/owner/repo.git
https://github.com/owner/repo/tree/branch-name
https://github.com/owner/repo/blob/main/file.js
```

### API Endpoints

#### Clone Repository
```javascript
POST /api/git/workflow
{
  "action": "clone-repository",
  "url": "https://github.com/owner/repo"
}
```

#### Create Branch
```javascript
POST /api/git/workflow
{
  "action": "create-branch",
  "repositoryId": "repo_123",
  "featureName": "user-authentication"
}
```

#### Auto Commit
```javascript
POST /api/git/workflow
{
  "action": "auto-commit",
  "repositoryId": "repo_123",
  "description": "Implement user authentication system",
  "filesChanged": ["src/auth/login.tsx", "src/auth/signup.tsx"]
}
```

#### Create Pull Request
```javascript
POST /api/git/workflow
{
  "action": "create-pr",
  "repositoryId": "repo_123",
  "title": "Add user authentication system",
  "description": "Comprehensive authentication with login, signup, and password reset"
}
```

#### Complete Workflow
```javascript
POST /api/git/workflow
{
  "action": "complete-workflow",
  "url": "https://github.com/owner/repo",
  "featureName": "user-authentication",
  "description": "Implement complete user authentication system"
}
```

### Multi-Agent Coordination

The system automatically creates multi-agent collaborations for:

- **Complex features** (estimated time > 45 minutes)
- **High priority tasks** (critical/high priority)
- **Full-stack features** (mentions "full stack", "end-to-end", "complete system")

#### Coordination Types

1. **Parallel**: Independent tasks run simultaneously
2. **Sequential**: Tasks with dependencies run in order
3. **Hierarchical**: Architect coordinates, developers implement, reviewers validate
4. **Peer-to-peer**: Equal collaboration between agents

### Background Job Scheduling

Configure background jobs in user settings:

```typescript
{
  "enabled": true,
  "maxConcurrentJobs": 3,
  "schedule": "0 */1 * * *", // Every hour
  "autoRetry": true
}
```

#### Cron Schedule Examples

- `0 */1 * * *` - Every hour
- `0 0 * * *` - Daily at midnight
- `0 0 * * 1` - Weekly on Monday
- `*/30 * * * *` - Every 30 minutes

### Subscription Features

#### Free Tier
- 2 repositories maximum
- Manual workflows only
- Basic commit automation

#### Pro Tier
- Unlimited repositories
- Background job scheduling
- Auto pull request creation
- Multi-agent coordination

#### Enterprise Tier
- Advanced collaboration modes
- Custom workflow templates
- Team coordination features
- Auto-merge capabilities

## Security Features

### Safe Operations
- All operations run in isolated workspaces
- No direct access to user's local git repositories
- Commits include AI attribution
- PR descriptions clearly mark AI-generated content

### Authentication
- Uses GitHub CLI authentication
- Respects repository permissions
- Requires user authorization for all operations

### Audit Trail
- All operations are logged
- Commit messages include AI attribution
- PR descriptions include generation details

## Error Handling

### Common Issues

1. **GitHub CLI not installed**
   - Error: `Command 'gh' not found`
   - Solution: Install GitHub CLI and authenticate

2. **Authentication required**
   - Error: `Not authenticated with GitHub`
   - Solution: Run `gh auth login`

3. **Repository access denied**
   - Error: `Repository not found or access denied`
   - Solution: Ensure you have read access to the repository

4. **Invalid URL format**
   - Error: `Invalid GitHub URL format`
   - Solution: Use proper GitHub repository URL

### Retry Mechanisms

- Failed operations are automatically retried up to 3 times
- Exponential backoff between retries
- User notification for persistent failures

## Best Practices

### Repository Management
- Keep workspaces clean by removing old repositories
- Monitor repository count for subscription limits
- Use descriptive feature names for better branch organization

### Collaboration Settings
- Enable multi-agent coordination for complex features
- Use hierarchical coordination for system-wide changes
- Set appropriate agent limits based on task complexity

### Commit Practices
- Use clear, descriptive commit messages
- Include file change summaries in commits
- Enable auto-commit for efficient workflows

### Pull Request Guidelines
- Auto-generated PRs include comprehensive descriptions
- Testing guidelines are automatically added
- Review requirements are clearly stated

## Monitoring and Analytics

### Workflow Metrics
- Repository clone success rate
- Average feature implementation time
- Multi-agent collaboration efficiency
- Commit and PR success rates

### Performance Tracking
- Agent utilization rates
- Task completion times
- Error frequency and types
- User satisfaction metrics

## Integration Examples

### Simple Feature Addition
```bash
# User provides URL and description
URL: https://github.com/mycompany/web-app
Feature: "Add dark mode toggle to header"

# System automatically:
# 1. Clones repository
# 2. Creates branch: ai-feature/dark-mode-toggle
# 3. Implements feature with single developer agent
# 4. Commits changes
# 5. Creates PR with description and testing notes
```

### Complex System Feature
```bash
# User provides URL and description  
URL: https://github.com/mycompany/ecommerce
Feature: "Complete checkout system with payment processing"

# System automatically:
# 1. Clones repository
# 2. Creates multi-agent collaboration (architect + developer + reviewer)
# 3. Architect creates system design
# 4. Developer implements in parallel components
# 5. Reviewer validates security and performance
# 6. Commits coordinated changes
# 7. Creates comprehensive PR with testing checklist
```

This integration makes it incredibly easy for users to enhance any GitHub repository with AI assistance while maintaining proper Git workflow practices.