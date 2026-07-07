import { ComponentType, lazy, LazyExoticComponent } from 'react';

export type AnyPageComponent = ComponentType<Record<string, unknown>>;

export type PageGlobMap = Record<string, any>;

function pathToComponentKey(path: string): string {
  const filename = path.split('/').pop() ?? '';
  const stem = filename.replace(/\.tsx?$/, '');
  const pascal = stem
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
  return pascal.endsWith('Page') ? pascal : `${pascal}Page`;
}

const registry: Record<string, LazyExoticComponent<AnyPageComponent>> = {};

export function bootstrapRegistry(globMap: PageGlobMap): void {
  for (const [path, value] of Object.entries(globMap)) {
    if (typeof value !== 'function') continue;
    const key = pathToComponentKey(path);
    registry[key] = lazy(value as () => Promise<{ default: AnyPageComponent }>);
  }
}

export function resolvePageComponent(
  componentKey: string,
): LazyExoticComponent<AnyPageComponent> | undefined {
  return registry[componentKey];
}

export function registerPageComponent(
  componentKey: string,
  component: LazyExoticComponent<AnyPageComponent>,
): void {
  if (registry[componentKey]) {
    console.warn(`[PageRegistry] Overwriting existing entry for "${componentKey}"`);
  }
  registry[componentKey] = component;
}

export function getRegisteredKeys(): string[] {
  return Object.keys(registry);
}