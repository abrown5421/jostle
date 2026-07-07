import { lazy } from 'react';
import { registerPageComponent } from './page-registry';
import type { AnyPageComponent } from './page-registry';

const pageModules = import.meta.glob<{ default: AnyPageComponent }>(
  '/src/pages/**/*.tsx',
);

const slugToComponentKey = (slug: string): string =>
  slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');

const slugToPath = (slug: string): string =>
  `/src/pages/${slug}/${slug}.tsx`;

export function registerAllDynamicPages(): void {
  for (const [path, loader] of Object.entries(pageModules)) {
    const match = path.match(/\/src\/pages\/([^/]+)\/[^/]+\.tsx$/);
    if (!match) continue;

    const slug = match[1];
    const componentKey = slugToComponentKey(slug);
    registerPageComponent(componentKey, lazy(loader));
  }
}

export function registerDynamicPage(slug: string): void {
  const path = slugToPath(slug);
  const loader = pageModules[path];

  if (!loader) {
    console.error(
      `[DynamicPageImporter] No glob entry found for "${path}". ` +
      `The dev server must be restarted to pick up newly scaffolded files.`,
    );
    return;
  }

  const componentKey = slugToComponentKey(slug);
  registerPageComponent(componentKey, lazy(loader));
}