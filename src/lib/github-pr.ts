type DescriptionSection = {
  title: string;
  body?: string | string[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export const generateBranchName = (issueNumber: number, issueTitle: string) => {
  const slug = slugify(issueTitle);
  return `issue-${issueNumber}-${slug || "update"}`;
};

export const buildPullRequestDescription = (options: {
  issueUrl?: string;
  summary?: string;
  triageSummary?: string;
  workItems?: string[];
  testing?: string[];
  notes?: string;
}) => {
  const sections: DescriptionSection[] = [];

  if (options.summary) {
    sections.push({
      title: "Summary",
      body: options.summary,
    });
  }

  if (options.triageSummary) {
    sections.push({
      title: "Triage Context",
      body: options.triageSummary,
    });
  }

  if (options.workItems?.length) {
    sections.push({
      title: "Implemented Changes",
      body: options.workItems.map((item) => `- ${item}`),
    });
  }

  if (options.testing?.length) {
    sections.push({
      title: "Verification",
      body: options.testing.map((item) => `- ${item}`),
    });
  }

  if (options.notes) {
    sections.push({
      title: "Notes",
      body: options.notes,
    });
  }

  const content = sections
    .map((section) => {
      const header = `## ${section.title}`;
      if (!section.body) {
        return header;
      }
      const body = Array.isArray(section.body) ? section.body.join("\n") : section.body;
      return `${header}\n${body}`;
    })
    .join("\n\n");

  if (options.issueUrl) {
    return `${content}\n\nResolves ${options.issueUrl}`;
  }

  return content;
};

export const summarizeChanges = (changes: string[]) => {
  if (!changes.length) {
    return undefined;
  }

  return changes.slice(0, 5).map((change) => change.trim()).filter(Boolean);
};
