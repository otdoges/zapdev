# ZapDev Project TODO

## High Priority

- [X] **Fix AI Chat Implementation**
  - [X] Implement Vercel AI SDK to handle streaming responses
  - [X] Fix issue with tool calls being visible to users
  - [X] Ensure proper streaming of AI responses with typing indicators
  - [ ] Add proper error handling for failed AI requests

- [ ] **Improve GUI and User Experience**
  - [X] Polish the two-card layout in chat view
  - [ ] Enhance desktop preview functionality
  - [ ] Add loading states and transitions between pages
  - [ ] Improve responsiveness on mobile devices
  - [ ] Add dark/light mode toggle

## Backend Improvements

- [X] **Complete Clerk-Convex Integration**
  - Test webhook handler for user synchronization
  - Set up proper error logging for webhook failures
  - Add admin dashboard for user management

- [ ] **Chat History and Persistence**
  - Implement proper chat history storage in Convex
  - Add ability to name and organize chat sessions
  - Create a sidebar with recent conversations

## Feature Additions

- [ ] **Export/Share Functionality**
  - Allow users to export chat history
  - Add ability to share generated UI designs/code
  - Implement collaboration features for team projects

- [ ] **AI Enhancements**
  - Add specialized prompts for different design tasks
  - Implement feedback loop for design iterations
  - Support for additional design frameworks and languages

## Documentation

- [ ] **User Documentation**
  - Create comprehensive guides for new users
  - Document common use cases and examples
  - Add tooltips and helper text throughout the application

- [X] **Developer Documentation**
  - Document codebase architecture
  - Create contribution guidelines
  - Add setup instructions for local development

## Completed Items

### AI Chat Implementation
- Integrated Vercel AI SDK for streaming chat responses
- Implemented proper response streaming with typing indicators
- Fixed issues with tool call visibility
- Created an env setup guide for configuring API keys

### Two-Card Layout
- Added a two-card layout when chat starts
- Made sure the layout only shows when first message is sent
- Improved styling for better visual appeal

### Documentation
- Added ENV-SETUP.md with instructions for configuring API keys
- Updated project structure documentation

