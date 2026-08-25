import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuessForm } from './guess-form.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

describe('GuessForm', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('only renders the track name field when artist/album are not required', () => {
    act(() => {
      root.render(<GuessForm requireArtist={false} requireAlbum={false} onSubmit={vi.fn()} />);
    });

    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBe(1);
  });

  it('renders artist and album fields when required', () => {
    act(() => {
      root.render(<GuessForm requireArtist={true} requireAlbum={true} onSubmit={vi.fn()} />);
    });

    const inputs = container.querySelectorAll('input');
    expect(inputs.length).toBe(3);
  });

  it('submits the guess and locks the form', () => {
    const onSubmit = vi.fn();
    act(() => {
      root.render(<GuessForm requireArtist={false} requireAlbum={false} onSubmit={onSubmit} />);
    });

    const trackInput = container.querySelector('input') as HTMLInputElement;
    act(() => {
      trackInput.dispatchEvent(new Event('focus', { bubbles: true }));
    });
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;
    act(() => {
      nativeSetter?.call(trackInput, 'Bohemian Rhapsody');
      trackInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('form') as HTMLFormElement;
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(onSubmit).toHaveBeenCalledWith({ trackName: 'Bohemian Rhapsody', artistName: undefined, albumName: undefined });
    expect((container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
  });
});
