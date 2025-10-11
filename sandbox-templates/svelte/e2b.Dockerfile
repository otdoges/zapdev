# You can use most Debian-based base images
FROM e2bdev/code-interpreter:latest

RUN apt-get update && apt-get install -y curl git gnupg && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get update \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace/svelte-app

# Create package.json manually with compatible versions
RUN echo '{\n\
  "name": "svelte-app",\n\
  "version": "0.0.1",\n\
  "private": true,\n\
  "scripts": {\n\
    "dev": "vite dev",\n\
    "build": "vite build",\n\
    "preview": "vite preview"\n\
  },\n\
  "devDependencies": {\n\
    "@sveltejs/adapter-auto": "^3.0.0",\n\
    "@sveltejs/kit": "^2.0.0",\n\
    "@sveltejs/vite-plugin-svelte": "^3.0.0",\n\
    "svelte": "^4.2.0",\n\
    "vite": "^5.0.0"\n\
  },\n\
  "type": "module"\n\
}' > package.json

# Create svelte.config.js
RUN echo "import adapter from '@sveltejs/adapter-auto';\n\
\n\
export default {\n\
  kit: {\n\
    adapter: adapter()\n\
  }\n\
};" > svelte.config.js

# Create vite.config.js
RUN echo "import { sveltekit } from '@sveltejs/kit/vite';\n\
import { defineConfig } from 'vite';\n\
\n\
export default defineConfig({\n\
  plugins: [sveltekit()]\n\
});" > vite.config.js

# Create directory structure
RUN mkdir -p src/routes src/lib static

# Create app.html
RUN echo '<!doctype html>\n\
<html lang="en">\n\
  <head>\n\
    <meta charset="utf-8" />\n\
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />\n\
    <meta name="viewport" content="width=device-width, initial-scale=1" />\n\
    %sveltekit.head%\n\
  </head>\n\
  <body data-sveltekit-preload-data="hover">\n\
    <div style="display: contents">%sveltekit.body%</div>\n\
  </body>\n\
</html>' > src/app.html

# Create app.css with Tailwind
RUN echo '@tailwind base;\n@tailwind components;\n@tailwind utilities;' > src/app.css

# Create +layout.svelte
RUN echo '<script>\n  import "../app.css";\n</script>\n\n<slot />' > src/routes/+layout.svelte

# Create +page.svelte
RUN echo '<h1 class="text-3xl font-bold">Welcome to SvelteKit</h1>' > src/routes/+page.svelte

# Install dependencies
RUN npm install

# Install DaisyUI and Tailwind CSS
RUN npm install -D tailwindcss postcss autoprefixer daisyui

# Create PostCSS config
RUN echo 'export default {\n\
  plugins: {\n\
    tailwindcss: {},\n\
    autoprefixer: {},\n\
  },\n\
};' > postcss.config.js

# Create Tailwind config with DaisyUI
RUN echo 'import daisyui from "daisyui";\n\
\n\
export default {\n\
  content: ["./src/**/*.{html,js,svelte,ts}"],\n\
  theme: { extend: {} },\n\
  plugins: [daisyui],\n\
};' > tailwind.config.js

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]