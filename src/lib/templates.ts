export interface TemplateOption {
  key: string;
  label: string;
  description: string;
}

const TEMPLATE_OPTIONS_BY_TYPE: Record<string, TemplateOption[]> = {
  post: [
    {
      key: "post-default",
      label: "Post Default",
      description: "Standard blog post layout",
    },
    {
      key: "post-feature",
      label: "Post Feature",
      description: "Hero-first post layout for standout content",
    },
  ],
  page: [
    {
      key: "page-default",
      label: "Page Default",
      description: "Standard content page layout",
    },
    {
      key: "page-landing",
      label: "Page Landing",
      description: "Landing page style with large intro block",
    },
  ],
};

export function getTemplateOptionsByType(): Record<string, TemplateOption[]> {
  return TEMPLATE_OPTIONS_BY_TYPE;
}

export function getTemplateOptionsForPageType(pageType: string): TemplateOption[] {
  const normalizedType = pageType.trim().toLowerCase();
  return TEMPLATE_OPTIONS_BY_TYPE[normalizedType] ?? TEMPLATE_OPTIONS_BY_TYPE.page;
}

export function getDefaultTemplateKeyForPageType(pageType: string): string {
  const options = getTemplateOptionsForPageType(pageType);
  return options[0]?.key ?? "page-default";
}

export function isValidTemplateKeyForPageType(pageType: string, templateKey: string): boolean {
  const options = getTemplateOptionsForPageType(pageType);
  return options.some((option) => option.key === templateKey);
}

export function normalizeTemplateKeyForPageType(pageType: string, templateKey: string): string {
  const trimmed = templateKey.trim();
  if (trimmed && isValidTemplateKeyForPageType(pageType, trimmed)) {
    return trimmed;
  }
  return getDefaultTemplateKeyForPageType(pageType);
}
