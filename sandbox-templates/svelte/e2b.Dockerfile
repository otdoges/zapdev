# You can use most Debian-based base images
FROM node:21-slim

# Install curl and git (required by create-svelte)
RUN apt-get update && apt-get install -y curl git && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install dependencies and customize sandbox
WORKDIR /home/user

# Create SvelteKit app (fully non-interactive)
RUN npx --yes create-svelte@latest svelte-app -- --template skeleton --types typescript --no-prettier --no-eslint --no-playwright --no-vitest --no-install --package-manager npm

# Move into the app directory
WORKDIR /home/user/svelte-app

# Ensure project scaffold succeeded
RUN test -f package.json

# Install dependencies
RUN npm install

# Install DaisyUI and Tailwind CSS
RUN npm install -D tailwindcss postcss autoprefixer daisyui
RUN npx tailwindcss init -p

# Configure Tailwind with DaisyUI
RUN echo 'module.exports = {\n  content: ["./src/**/*.{html,js,svelte,ts}"],\n  theme: { extend: {} },\n  plugins: [require("daisyui")],\n}' > tailwind.config.js

# Add Tailwind directives to app.css
RUN echo '@tailwind base;\n@tailwind components;\n@tailwind utilities;' > src/app.css

# Import app.css in layout
RUN echo '<script>\n  import "../app.css";\n</script>\n\n<slot />' > src/routes/+layout.svelte

# Start dev server on port 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
