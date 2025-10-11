# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install dependencies and customize sandbox
WORKDIR /home/user

# Install Angular CLI globally
RUN npm install -g @angular/cli@19

# Create Angular app
RUN ng new angular-app --routing --style=scss --skip-git --package-manager=npm --defaults

# Move into the app directory
WORKDIR /home/user/angular-app

# Install Angular Material and Tailwind CSS
RUN ng add @angular/material --skip-confirmation --defaults
RUN npm install -D tailwindcss postcss autoprefixer

# Configure Tailwind
RUN cat <<'EOF' > tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: { extend: {} },
  plugins: [],
};
EOF
RUN cat <<'EOF' > postcss.config.cjs
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
EOF

# Add Tailwind directives to styles
RUN cat <<'EOF' > src/styles.scss
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Move the Angular app to the home directory
RUN mv /home/user/angular-app/* /home/user/ && rm -rf /home/user/angular-app

# Set working directory
WORKDIR /home/user

# Start dev server on port 4200
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200"]
