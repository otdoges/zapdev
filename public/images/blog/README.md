# Blog Images Directory

This directory contains images for blog posts displayed in the BlogTeaser component on the homepage.

## Expected Image Files

- `astro-zapdev.jpg` - Image for the "Building Lightning-Fast Websites with Astro and ZapDev" article
- `color-psychology.jpg` - Image for "The Psychology of Color in Web Design" article
- `startup-launch.jpg` - Image for "From Concept to Launch in 24 Hours" article

For production, replace these placeholder image references with actual optimized images. The recommended dimensions are 800x450px with a 16:9 aspect ratio.

## Adding New Blog Images

When adding new blog posts, follow these guidelines:

1. Use descriptive filenames in kebab-case (e.g., `new-article-title.jpg`)
2. Optimize images for web (compress and resize)
3. Consider adding WebP versions for better performance
4. Update the blog post data in the `components/blog-teaser.tsx` file 