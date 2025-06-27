import { BaseProjectTemplate, ProjectSetupOptions, ProjectSetupResult } from './base-template';
import { HTMLProjectTemplate } from './html-template';
import { ReactProjectTemplate } from './react-template';
import { GenericProjectTemplate } from './generic-template';

export class TemplateRegistry {
  private templates: Map<string, BaseProjectTemplate> = new Map();
  private defaultTemplate: BaseProjectTemplate;

  constructor() {
    this.initializeTemplates();
    this.defaultTemplate = this.templates.get('generic')!;
  }

  private initializeTemplates(): void {
    const templates = [
      new HTMLProjectTemplate(),
      new ReactProjectTemplate(),
      new GenericProjectTemplate(),
    ];

    for (const template of templates) {
      this.templates.set(template.getInfo().type, template);
    }
  }

  getTemplate(type: string): BaseProjectTemplate | null {
    return this.templates.get(type) || null;
  }

  getAllTemplates(): BaseProjectTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplateInfo() {
    return Array.from(this.templates.values()).map(template => template.getInfo());
  }

  detectProjectType(codeContent: string): BaseProjectTemplate {
    for (const template of this.templates.values()) {
      if (template.detectProjectType(codeContent)) {
        return template;
      }
    }
    return this.defaultTemplate;
  }

  async setupProject(
    type: string | undefined,
    options: ProjectSetupOptions
  ): Promise<ProjectSetupResult> {
    let template: BaseProjectTemplate;

    if (type) {
      template = this.getTemplate(type) || this.defaultTemplate;
    } else if (options.codeContent) {
      template = this.detectProjectType(options.codeContent);
    } else {
      template = this.defaultTemplate;
    }

    return await template.setupProject(options);
  }

  registerTemplate(template: BaseProjectTemplate): void {
    this.templates.set(template.getInfo().type, template);
  }

  unregisterTemplate(type: string): boolean {
    return this.templates.delete(type);
  }
}