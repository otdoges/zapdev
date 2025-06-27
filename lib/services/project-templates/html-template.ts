import { BaseProjectTemplate, ProjectSetupOptions, ProjectTemplateConfig } from './base-template';
import { FileSystemTree } from '../webcontainer/file-manager';

export class HTMLProjectTemplate extends BaseProjectTemplate {
  constructor() {
    super({
      name: 'HTML Static Site',
      type: 'html',
      description: 'Simple HTML/CSS/JavaScript static website',
      version: '1.0.0',
    });
  }

  detectProjectType(codeContent: string): boolean {
    return codeContent.includes('<!DOCTYPE html>') || codeContent.includes('<html');
  }

  getDefaultDependencies(): string[] {
    return ['serve'];
  }

  getDefaultDevDependencies(): string[] {
    return [];
  }

  getDefaultScripts(): Record<string, string> {
    return {
      dev: 'npx serve . -p 3000',
      start: 'npx serve . -p 3000',
      build: 'echo "No build step required for static HTML"',
    };
  }

  async generateFiles(options: ProjectSetupOptions): Promise<FileSystemTree> {
    const { codeContent = '', instructions = '' } = options;
    
    const analysis = this.analyzeInstructions(instructions);
    
    const htmlContent = codeContent || this.generateDefaultHTML(analysis);
    const cssContent = this.generateCSS(analysis);
    const jsContent = this.generateJavaScript(analysis);

    return {
      'index.html': {
        file: { contents: htmlContent },
      },
      'styles.css': {
        file: { contents: cssContent },
      },
      'script.js': {
        file: { contents: jsContent },
      },
      'package.json': {
        file: { contents: this.createPackageJson() },
      },
      'README.md': {
        file: { contents: this.generateReadme() },
      },
    };
  }

  private generateDefaultHTML(analysis: ReturnType<typeof this.analyzeInstructions>): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Project</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1><i class="fas fa-code"></i> HTML Project</h1>
            <nav>
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="main">
        <section id="home" class="hero">
            <div class="container">
                <h2>Welcome to Your HTML Project</h2>
                <p>This is a simple HTML template with modern styling and JavaScript functionality.</p>
                <button class="btn btn-primary" onclick="showMessage()">
                    <i class="fas fa-rocket"></i> Get Started
                </button>
            </div>
        </section>

        ${analysis.hasForm ? this.generateFormSection() : ''}
        ${analysis.hasList ? this.generateListSection() : ''}
        
        <section id="features" class="features">
            <div class="container">
                <h2>Features</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <i class="fas fa-mobile-alt"></i>
                        <h3>Responsive Design</h3>
                        <p>Works perfectly on all devices</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-bolt"></i>
                        <h3>Fast Loading</h3>
                        <p>Optimized for speed and performance</p>
                    </div>
                    <div class="feature-card">
                        <i class="fas fa-paint-brush"></i>
                        <h3>Modern Styling</h3>
                        <p>Clean and contemporary design</p>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 HTML Project. Built with HTML, CSS, and JavaScript.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
  }

  private generateFormSection(): string {
    return `
        <section id="contact" class="contact">
            <div class="container">
                <h2>Contact Form</h2>
                <form class="contact-form" onsubmit="handleFormSubmit(event)">
                    <div class="form-group">
                        <label for="name">Name</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="message">Message</label>
                        <textarea id="message" name="message" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Send Message
                    </button>
                </form>
            </div>
        </section>`;
  }

  private generateListSection(): string {
    return `
        <section id="about" class="about">
            <div class="container">
                <h2>About This Project</h2>
                <ul class="feature-list">
                    <li><i class="fas fa-check"></i> Modern HTML5 structure</li>
                    <li><i class="fas fa-check"></i> Responsive CSS Grid and Flexbox</li>
                    <li><i class="fas fa-check"></i> Interactive JavaScript functionality</li>
                    <li><i class="fas fa-check"></i> Font Awesome icons</li>
                    <li><i class="fas fa-check"></i> Mobile-first design approach</li>
                </ul>
            </div>
        </section>`;
  }

  private generateCSS(analysis: ReturnType<typeof this.analyzeInstructions>): string {
    return `/* Reset and base styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Header */
.header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 1rem 0;
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h1 {
    color: #667eea;
    font-size: 1.8rem;
}

.header nav ul {
    list-style: none;
    display: flex;
    gap: 2rem;
}

.header nav a {
    color: #333;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
}

.header nav a:hover {
    color: #667eea;
}

/* Main content */
.main {
    margin-top: 80px;
}

.hero {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 6rem 0;
    text-align: center;
    color: white;
}

.hero h2 {
    font-size: 3rem;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

/* Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    border: none;
    border-radius: 50px;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn-primary {
    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
    color: white;
    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

/* Features section */
.features {
    padding: 4rem 0;
    background: rgba(255, 255, 255, 0.95);
}

.features h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
    color: #333;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: white;
    padding: 2rem;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
}

.feature-card i {
    font-size: 3rem;
    color: #667eea;
    margin-bottom: 1rem;
}

.feature-card h3 {
    margin-bottom: 1rem;
    color: #333;
}

${analysis.hasForm ? this.getFormStyles() : ''}
${analysis.hasList ? this.getListStyles() : ''}

/* Footer */
.footer {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    text-align: center;
    padding: 2rem 0;
}

/* Responsive */
@media (max-width: 768px) {
    .header .container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .hero h2 {
        font-size: 2rem;
    }
    
    .feature-grid {
        grid-template-columns: 1fr;
    }
}`;
  }

  private getFormStyles(): string {
    return `
/* Contact form */
.contact {
    padding: 4rem 0;
    background: rgba(255, 255, 255, 0.9);
}

.contact h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
    color: #333;
}

.contact-form {
    max-width: 600px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #333;
}

.form-group input,
.form-group textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #667eea;
}`;
  }

  private getListStyles(): string {
    return `
/* About section */
.about {
    padding: 4rem 0;
    background: rgba(255, 255, 255, 0.85);
}

.about h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
    color: #333;
}

.feature-list {
    max-width: 600px;
    margin: 0 auto;
    list-style: none;
}

.feature-list li {
    padding: 1rem;
    margin-bottom: 0.5rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
}

.feature-list i {
    color: #4caf50;
}`;
  }

  private generateJavaScript(analysis: ReturnType<typeof this.analyzeInstructions>): string {
    return `// HTML Project JavaScript

// Show welcome message
function showMessage() {
    alert('Welcome to your HTML project! 🚀\\n\\nThis template includes:\\n• Responsive design\\n• Modern CSS\\n• Interactive JavaScript\\n• Font Awesome icons');
}

${analysis.hasForm ? this.getFormJavaScript() : ''}

// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.header nav a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add animation to feature cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});

// Add some interactive effects
document.addEventListener('DOMContentLoaded', function() {
    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
        }
    });
});`;
  }

  private getFormJavaScript(): string {
    return `
// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Simulate form processing
    const button = event.target.querySelector('button[type="submit"]');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    button.disabled = true;
    
    setTimeout(() => {
        alert(\`Thank you \${name}! Your message has been received.\\n\\nWe'll get back to you at \${email} soon.\`);
        event.target.reset();
        button.innerHTML = originalText;
        button.disabled = false;
    }, 2000);
}`;
  }

  private generateReadme(): string {
    return `# HTML Static Site

A modern HTML/CSS/JavaScript static website template.

## Features

- 📱 Responsive design
- 🎨 Modern CSS with gradients and animations
- ⚡ Interactive JavaScript functionality
- 🎯 Font Awesome icons
- 📧 Contact form with validation
- 🔗 Smooth scrolling navigation

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open your browser and visit \`http://localhost:3000\`

## Customization

- Edit \`index.html\` to modify the structure
- Update \`styles.css\` to change the appearance
- Modify \`script.js\` to add more functionality

## Deployment

This is a static site that can be deployed to any web server or hosting platform like:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

## License

MIT License
`;
  }
}