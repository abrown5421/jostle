import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigurationForm } from './configuration-form.js';
import type { DynamicSettingFieldDefinition } from './types.js';

const SCHEMA: DynamicSettingFieldDefinition[] = [
  { key: 'enableArtistGuess', label: 'Enable Artist Guess', type: 'boolean', defaultValue: true },
  { key: 'playlistSourceUrl', label: 'Playlist Source URL', type: 'string', defaultValue: '' },
];

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

function setNativeInputValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('ConfigurationForm', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders one control per schema field, seeded from defaultValue', () => {
    act(() => {
      root.render(<ConfigurationForm schema={SCHEMA} onSave={vi.fn()} />);
    });

    const toggle = container.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    const textInput = container.querySelector('input[type="text"], input:not([role])') as HTMLInputElement;
    expect(textInput.value).toBe('');
  });

  it('seeds from initialValues when provided, overriding schema defaults', () => {
    act(() => {
      root.render(
        <ConfigurationForm
          schema={SCHEMA}
          initialValues={{ enableArtistGuess: false, playlistSourceUrl: 'https://example.com/list' }}
          onSave={vi.fn()}
        />,
      );
    });

    const toggle = container.querySelector('[role="switch"]') as HTMLButtonElement;
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  it('does not call onSave until the Save button is clicked, and posts the whole accumulated map once', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    act(() => {
      root.render(<ConfigurationForm schema={SCHEMA} onSave={onSave} />);
    });

    const toggle = container.querySelector('[role="switch"]') as HTMLButtonElement;
    act(() => toggle.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onSave).not.toHaveBeenCalled();

    const urlInput = container.querySelector('input') as HTMLInputElement;
    act(() => setNativeInputValue(urlInput, 'https://example.com/list'));
    expect(onSave).not.toHaveBeenCalled();

    const saveButton = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Save Configuration')!;
    await act(async () => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ enableArtistGuess: false, playlistSourceUrl: 'https://example.com/list' });
  });

  it('disables the Save button while saving is in flight', async () => {
    let resolveSave: () => void = () => {};
    const onSave = vi.fn(() => new Promise<void>((resolve) => (resolveSave = resolve)));
    act(() => {
      root.render(<ConfigurationForm schema={SCHEMA} onSave={onSave} />);
    });

    const saveButton = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Save Configuration')!;
    act(() => {
      saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect((saveButton as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      resolveSave();
    });

    expect((saveButton as HTMLButtonElement).disabled).toBe(false);
  });
});
