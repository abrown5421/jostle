import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FileDropzone } from './file-dropzone.js';

function mount() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return { container, root };
}

function fileList(files: File[]): FileList {
  const indexed: Record<number, File> = {};
  files.forEach((file, index) => {
    indexed[index] = file;
  });
  return {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    [Symbol.iterator]: function* () {
      yield* files;
    },
    ...indexed,
  } as unknown as FileList;
}

describe('FileDropzone', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    ({ container, root } = mount());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows the label text', () => {
    act(() => {
      root.render(
        <FileDropzone onFileSelected={vi.fn()} label="Drop it here" />,
      );
    });
    expect(container.textContent).toContain('Drop it here');
  });

  it('calls onFileSelected with the dropped file', () => {
    const onFileSelected = vi.fn();
    act(() => {
      root.render(<FileDropzone onFileSelected={onFileSelected} />);
    });
    const dropzone = container.querySelector(
      '[role="button"]',
    ) as HTMLDivElement;
    const file = new File(['bytes'], 'avatar.png', { type: 'image/png' });

    act(() => {
      dropzone.dispatchEvent(
        Object.assign(new Event('drop', { bubbles: true, cancelable: true }), {
          dataTransfer: { files: fileList([file]) },
        }),
      );
    });

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it('calls onFileSelected when a file is chosen via the hidden input', () => {
    const onFileSelected = vi.fn();
    act(() => {
      root.render(<FileDropzone onFileSelected={onFileSelected} />);
    });
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['bytes'], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(input, 'files', { value: fileList([file]) });

    act(() => {
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onFileSelected).toHaveBeenCalledWith(file);
  });

  it('does not respond to drops while disabled', () => {
    const onFileSelected = vi.fn();
    act(() => {
      root.render(<FileDropzone onFileSelected={onFileSelected} disabled />);
    });
    const dropzone = container.querySelector(
      '[role="button"]',
    ) as HTMLDivElement;
    const file = new File(['bytes'], 'avatar.png', { type: 'image/png' });

    act(() => {
      dropzone.dispatchEvent(
        Object.assign(new Event('drop', { bubbles: true, cancelable: true }), {
          dataTransfer: { files: fileList([file]) },
        }),
      );
    });

    expect(onFileSelected).not.toHaveBeenCalled();
  });
});
