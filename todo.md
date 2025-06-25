# ZapDev To-Do List

## High Priority (Core Functionality Bugs)
- [ ] **Fix Chat:** User messages are not showing up in the chat interface.
    - [ ] Investigate `app/chat/[id]/page.tsx` for rendering issues.
    - [ ] Check `app/api/chat/messages/route.ts` for message fetching logic.
    - [ ] Verify `app/api/chat/save-message/route.ts` for message saving logic.
- [ ] **Fix AI Website Generation:** The AI team is failing to generate the web application as requested by the user.
    - [ ] Debug `ai-team-coordinator.tsx` and its interaction with the backend.
    - [ ] Analyze the `app/api/ai-team/coordinate/route.ts` endpoint for failures in the generation pipeline.
    - [ ] Check the logs for errors from the AI models (Gemini, Groq, etc.).

## Medium Priority (Improvements)
- [ ] **UI/UX Enhancements:**
    - [ ] Review and improve the user flow for creating a new project.
    - [ ] Enhance the real-time feedback during AI generation.
- [ ] **Refactoring:**
    - [ ] Break down large components like `ai-team-coordinator.tsx` and `interactive-display.tsx` into smaller, manageable pieces.
- [ ] **Error Handling:**
    - [ ] Implement more robust error handling across the application, especially for API calls and AI interactions.

## Low Priority (Long-term)
- [ ] **Testing:**
    - [ ] Add unit tests for critical components and utility functions.
    - [ ] Implement end-to-end tests for the core user flows (auth, chat, website generation).
- [ ] **Documentation:**
    - [ ] Add TSDoc comments to functions and components.
    - [ ] Create a more detailed `README.md` for developers. 