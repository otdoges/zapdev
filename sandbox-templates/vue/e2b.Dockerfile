# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install dependencies and customize sandbox
WORKDIR /home/user

# Create Vue app with Vite
RUN npm create vite@latest vue-app -- --template vue-ts

# Move into the app directory
WORKDIR /home/user/vue-app

# Install dependencies
RUN npm install

# Install Vuetify and Tailwind CSS
RUN npm install vuetify @mdi/font
RUN npm install -D tailwindcss postcss autoprefixer vite-plugin-vuetify
RUN npx tailwindcss init -p

# Configure Tailwind
RUN echo 'module.exports = {\n  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n}' > tailwind.config.js

# Add Tailwind directives to style.css
RUN echo '@tailwind base;\n@tailwind components;\n@tailwind utilities;' > src/style.css

# Move the Vue app to the home directory
RUN mv /home/user/vue-app/* /home/user/ && rm -rf /home/user/vue-app

# Set working directory
WORKDIR /home/user

# Start dev server on port 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
