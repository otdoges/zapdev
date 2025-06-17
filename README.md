# ZapDev Studio

An AI-powered web development assistant with a modern, intuitive interface.

## ✨ Latest Updates

### Modern Chat Interface (v2.0)

We've completely redesigned the chat interface to match modern AI tools like v0.dev and loveable.dev:

#### 🎨 New Features:
- **Split-panel layout**: Preview/code panel on the left, chat on the right
- **Clean AI responses**: Tool calls are now filtered out for a cleaner chat experience
- **Interactive preview**: Live HTML preview with instant code switching
- **Modern design**: Glass morphism effects, improved scrollbars, and smooth animations
- **Maximizable preview**: Full-screen preview mode for better development experience

#### 🛠 Technical Improvements:
- Removed InteractiveDisplay from chat messages
- Added code extraction from AI responses
- Implemented filtered message display
- Enhanced Monaco Editor integration
- Improved responsive design
- Added modern CSS animations and effects

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your API keys

3. **Run the development server:**
   ```bash
   bun run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## 🏗 Architecture

### Chat Interface (`/chat/[id]`)

The chat interface consists of two main panels:

1. **Left Panel (Preview/Code)**:
   - Live HTML preview with Tailwind CSS
   - Monaco Editor for code editing
   - Toggle between Preview and Code views
   - Maximizable for full-screen development

2. **Right Panel (Chat)**:
   - Clean AI chat interface
   - Filtered responses (no tool calls)
   - Command palette for quick actions
   - File attachment support

### Key Components

- `AnimatedAIChat`: Main chat component with AI integration
- `CodePreview`: Monaco Editor with syntax highlighting
- `InteractiveDisplay`: Legacy component (removed from chat)

### AI Integration

The app uses OpenRouter for AI responses with:
- Code extraction from AI messages
- Tool call filtering for clean UX
- Real-time code generation
- Preview updates on code changes

## 🎯 Features

- **AI-Powered Development**: Generate HTML, CSS, and JavaScript
- **Live Preview**: See your code in action instantly
- **Modern UI**: Clean, responsive design with smooth animations
- **Command Palette**: Quick access to common actions
- **File Management**: Upload and manage project files
- **User Authentication**: Secure login with Clerk

## 📱 Responsive Design

The interface is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile devices (stacked layout)

## 🛡 Security

- Environment variables for API keys
- Secure authentication with Clerk
- Sandboxed iframe for code preview
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**ZapDev Studio** - Transforming ideas into reality with AI assistance.
