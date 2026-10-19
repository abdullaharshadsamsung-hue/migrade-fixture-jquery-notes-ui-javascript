import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf-8');

function parse(): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('index.html (document load)', () => {
  let doc: Document;

  beforeEach(() => {
    doc = parse();
  });

  it('has title "Notes", lang "en" and UTF-8 charset', () => {
    expect(doc.title).toBe('Notes');
    expect(doc.documentElement.getAttribute('lang')).toBe('en');
    const meta = doc.querySelector('meta[charset]');
    expect(meta).not.toBeNull();
    expect(meta!.getAttribute('charset')!.toUpperCase()).toBe('UTF-8');
  });

  it('declares a single #root mount point for React', () => {
    const roots = doc.querySelectorAll('#root');
    expect(roots.length).toBe(1);
    expect(roots[0].tagName).toBe('DIV');
    expect(roots[0].children.length).toBe(0);
  });

  it('no longer loads jQuery from the CDN (intentional migration)', () => {
    const scripts = Array.from(doc.querySelectorAll('script'));
    expect(scripts.some((s) => (s.getAttribute('src') || '').includes('jquery'))).toBe(false);
    expect(html).not.toMatch(/code\.jquery\.com/);
  });

  it('no longer loads app.js; loads /src/main.tsx as a module instead', () => {
    const scripts = Array.from(doc.querySelectorAll('script'));
    expect(scripts.some((s) => (s.getAttribute('src') || '').includes('app.js'))).toBe(false);
    const main = scripts.find((s) => s.getAttribute('src') === '/src/main.tsx');
    expect(main).toBeDefined();
    expect(main!.getAttribute('type')).toBe('module');
  });

  it('places the entry script as the last child of body, after the mount point', () => {
    const body = doc.body;
    const last = body.lastElementChild!;
    expect(last.tagName).toBe('SCRIPT');
    expect(last.getAttribute('src')).toBe('/src/main.tsx');
    const root = doc.getElementById('root')!;
    expect(root.compareDocumentPosition(last) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('has only one script and it is in the body, not the head', () => {
    expect(doc.head.querySelectorAll('script').length).toBe(0);
    expect(doc.querySelectorAll('script').length).toBe(1);
  });

  it('contains no inline scripts or inline event handlers', () => {
    doc.querySelectorAll('script').forEach((s) => {
      expect(s.textContent!.trim()).toBe('');
    });
    doc.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((a) => {
        expect(a.name.startsWith('on')).toBe(false);
      });
    });
  });

  it('static notes markup moved out of the shell (rendered by React now)', () => {
    expect(doc.querySelector('main')).toBeNull();
    expect(doc.getElementById('note-form')).toBeNull();
    expect(doc.getElementById('title')).toBeNull();
    expect(doc.getElementById('notes')).toBeNull();
    expect(doc.getElementById('count')).toBeNull();
    expect(doc.querySelectorAll('h1').length).toBe(0);
  });

  it('documents the migration decisions in comments', () => {
    expect(html).toMatch(/MIGRATION_NOTE/);
    expect(html).toMatch(/NotesPage\.tsx/);
  });
});