import fs from 'fs/promises';
import path from 'path';

export interface WriteFileOptions {
  filePath: string;
  content: string;
  overwrite?: boolean;
}

export interface DeleteFileOptions {
  filePath: string;
  force?: boolean;
}

export interface EnsureDirOptions {
  dirPath: string;
}

export interface AppendToFileOptions {
  filePath: string;
  content: string;
}

export interface RemoveLineFromFileOptions {
  filePath: string;
  matcher: (line: string) => boolean;
}

export async function ensureDir(opts: EnsureDirOptions): Promise<void> {
  await fs.mkdir(opts.dirPath, { recursive: true });
}

export async function writeFile(opts: WriteFileOptions): Promise<void> {
  if (!opts.overwrite) {
    const exists = await fs
      .access(opts.filePath)
      .then(() => true)
      .catch(() => false);
    if (exists) throw new Error(`File already exists: ${opts.filePath}`);
  }
  await fs.mkdir(path.dirname(opts.filePath), { recursive: true });
  await fs.writeFile(opts.filePath, opts.content, 'utf-8');
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function deleteFile(opts: DeleteFileOptions): Promise<void> {
  await fs.rm(opts.filePath, { recursive: true, force: opts.force ?? true });
}

export async function appendToFile(opts: AppendToFileOptions): Promise<void> {
  const existing = await readFile(opts.filePath);
  if (!existing.includes(opts.content.trim())) {
    await fs.writeFile(opts.filePath, existing + opts.content, 'utf-8');
  }
}

export async function removeLineFromFile(opts: RemoveLineFromFileOptions): Promise<void> {
  const existing = await readFile(opts.filePath);
  const updated = existing
    .split('\n')
    .filter((line) => !opts.matcher(line))
    .join('\n');
  await fs.writeFile(opts.filePath, updated.trimEnd() + '\n', 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.access(filePath).then(() => true).catch(() => false);
}
