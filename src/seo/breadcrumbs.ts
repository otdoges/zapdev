import { BreadcrumbItem } from "./types";
import { SEO_CONFIG } from "./config";

export function generateBreadcrumbs(path: string): BreadcrumbItem[] {
  const segments = path.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
  ];

  let currentPath = "";
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const name = formatBreadcrumbName(segment);
    breadcrumbs.push({ name, url: currentPath });
  });

  return breadcrumbs;
}

export function formatBreadcrumbName(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function generateBreadcrumbJsonLd(breadcrumbs: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SEO_CONFIG.siteUrl}${item.url}`,
    })),
  };
}

export function createBreadcrumb(name: string, url: string): BreadcrumbItem {
  return { name, url };
}

export function mergeBreadcrumbs(
  baseBreadcrumbs: BreadcrumbItem[],
  additionalBreadcrumbs: BreadcrumbItem[]
): BreadcrumbItem[] {
  return [...baseBreadcrumbs, ...additionalBreadcrumbs];
}

export function getBreadcrumbsForProject(projectId: string, projectName?: string): BreadcrumbItem[] {
  return [
    { name: "Home", url: "/" },
    { name: "Projects", url: "/projects" },
    { name: projectName || projectId, url: `/projects/${projectId}` },
  ];
}

export function getBreadcrumbsForBlogPost(
  category: string,
  postSlug: string,
  postTitle?: string
): BreadcrumbItem[] {
  return [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: formatBreadcrumbName(category), url: `/blog/category/${category}` },
    { name: postTitle || formatBreadcrumbName(postSlug), url: `/blog/${postSlug}` },
  ];
}

export function getBreadcrumbsForDocumentation(
  sections: string[],
  currentPage: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { name: "Home", url: "/" },
    { name: "Documentation", url: "/docs" },
  ];

  let currentPath = "/docs";
  sections.forEach((section) => {
    currentPath += `/${section}`;
    breadcrumbs.push({
      name: formatBreadcrumbName(section),
      url: currentPath,
    });
  });

  breadcrumbs.push({
    name: formatBreadcrumbName(currentPage),
    url: `${currentPath}/${currentPage}`,
  });

  return breadcrumbs;
}
