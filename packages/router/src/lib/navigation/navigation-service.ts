import { NavigateFunction } from 'react-router-dom';
import { Page } from '@inithium/types';

type TransitionRequest = {
  targetPath: string;
  resolve: () => void;
};

type TransitionHandler = (request: TransitionRequest) => void;

class NavigationService {
  private _navigate: NavigateFunction | null = null;
  private _pages: Map<string, Page> = new Map(); 
  private _pagesByKey: Map<string, Page> = new Map();
  private _transitionHandler: TransitionHandler | null = null;

  register(navigate: NavigateFunction): void {
    this._navigate = navigate;
  }

  setPages(pages: Page[]): void {
    this._pages.clear();
    this._pagesByKey.clear();
    for (const page of pages) {
      this._pages.set(page.path, page);
      this._pagesByKey.set(page.key, page);
    }
  }

  registerTransitionHandler(handler: TransitionHandler): void {
    this._transitionHandler = handler;
  }

  unregisterTransitionHandler(): void {
    this._transitionHandler = null;
  }

  async navigate(path: string): Promise<void> {
    if (!this._navigate) {
      console.warn('[NavigationService] navigate() called before router mounted.');
      return;
    }

    if (this._transitionHandler) {
      await new Promise<void>((resolve) => {
        this._transitionHandler!({ targetPath: path, resolve });
      });
    }

    this._navigate(path);
  }

  async navigateToKey(key: string, params?: Record<string, string>): Promise<void> {
    const page = this.getPageByKey(key);
    if (!page) return Promise.resolve();
    
    const resolvedPath = params
      ? page.path.replace(/:([^/]+)/g, (_, token) => params[token] ?? `:${token}`)
      : page.path;

    return this.navigate(resolvedPath);
  }

  getPageByPath(path: string): Page | undefined {
    return this._pages.get(path);
  }

  getPageByKey(key: string): Page | undefined {
    return this._pagesByKey.get(key);
  }

  getAllPages(): Page[] {
    return Array.from(this._pages.values());
  }

  isReady(): boolean {
    return this._navigate !== null;
  }
}

export const navigationService = new NavigationService();