import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
import NotesPage from './NotesPage';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup() {
  const utils = render(<NotesPage />);
  const list = utils.container.querySelector('#notes') as HTMLUListElement;
  const count = utils.container.querySelector('#count') as HTMLParagraphElement;
  const input = utils.container.querySelector('#title') as HTMLInputElement;
  const form = utils.container.querySelector('#note-form') as HTMLFormElement;
  const items = () => Array.from(list.querySelectorAll('li'));
  const titles = () => items().map((li) => li.querySelector('strong')?.textContent);
  const add = async (text: string) => {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.click(within(form).getByRole('button', { name: 'Add' }));
  };
  const del = async (title: string) => {
    const li = items().find((l) => l.querySelector('strong')?.textContent === title)!;
    fireEvent.click(within(li).getByRole('button', { name: 'Delete' }));
  };
  return { ...utils, list, count, input, form, items, titles, add, del };
}

describe('initialization', () => {
  it('renders two seed notes in order with bodies, delete buttons and count', () => {
    const { items, count } = setup();
    const lis = items();
    expect(lis).toHaveLength(2);
    expect(lis[0].querySelector('strong')!.textContent).toBe('Buy milk');
    expect(lis[0].querySelector('span')!.textContent).toBe(' — Two litres');
    expect(lis[1].querySelector('strong')!.textContent).toBe('Call Sam');
    expect(lis[1].querySelector('span')!.textContent).toBe(' — About the trip');
    lis.forEach((li) => expect(within(li).getAllByRole('button', { name: 'Delete' })).toHaveLength(1));
    expect(count.textContent).toBe('2 notes');
  });

  it('makes no network or storage calls', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { add, del } = setup();
    await add('X');
    await del('X');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('resets to seed notes on remount (reload)', async () => {
    const { add, del, unmount } = setup();
    await add('Temp');
    await del('Buy milk');
    unmount();
    const s = setup();
    expect(s.titles()).toEqual(['Buy milk', 'Call Sam']);
    expect(s.count.textContent).toBe('2 notes');
  });

  it('renders without throwing', () => {
    expect(() => render(<NotesPage />)).not.toThrow();
  });
});

describe('render', () => {
  it('note with body has strong, span, button in order', () => {
    const { items } = setup();
    const children = Array.from(items()[0].children).map((c) => c.tagName);
    expect(children).toEqual(['STRONG', 'SPAN', 'BUTTON']);
  });

  it('note with empty body has no span', async () => {
    const { add, items } = setup();
    await add('Walk dog');
    const children = Array.from(items()[2].children).map((c) => c.tagName);
    expect(children).toEqual(['STRONG', 'BUTTON']);
  });

  it('renders HTML as literal text', async () => {
    const { add, items } = setup();
    await add('<b>x</b>');
    const strong = items()[2].querySelector('strong')!;
    expect(strong.textContent).toBe('<b>x</b>');
    expect(strong.querySelector('b')).toBeNull();
  });

  it('empty list shows 0 notes', async () => {
    const { del, list, count } = setup();
    await del('Buy milk');
    await del('Call Sam');
    expect(list.children).toHaveLength(0);
    expect(count.textContent).toBe('0 notes');
  });

  it('one note shows "1 notes"', async () => {
    const { del, count } = setup();
    await del('Call Sam');
    expect(count.textContent).toBe('1 notes');
  });

  it('count always matches li count', async () => {
    const { add, del, items, count } = setup();
    const check = () => expect(count.textContent).toBe(`${items().length} notes`);
    check();
    await add('A');
    check();
    await del('Buy milk');
    check();
  });
});

describe('#note-form submit', () => {
  it('adds trimmed note, clears input', async () => {
    const { add, items, count, input, titles } = setup();
    await add('  Walk dog  ');
    expect(items()).toHaveLength(3);
    expect(titles()[2]).toBe('Walk dog');
    expect(items()[2].querySelector('span')).toBeNull();
    expect(count.textContent).toBe('3 notes');
    expect(input.value).toBe('');
  });

  it('prevents default submission', () => {
    const { form, input } = setup();
    fireEvent.change(input, { target: { value: 'A' } });
    const ev = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
  });

  it('prevents default even for blank title', () => {
    const { form, input, items } = setup();
    fireEvent.change(input, { target: { value: '   ' } });
    const ev = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(items()).toHaveLength(2);
  });

  it('empty title adds nothing', async () => {
    const { add, items, count } = setup();
    await add('');
    expect(items()).toHaveLength(2);
    expect(count.textContent).toBe('2 notes');
  });

  it('whitespace title adds nothing and is not cleared', async () => {
    const { add, items, count, input } = setup();
    await add('   ');
    expect(items()).toHaveLength(2);
    expect(count.textContent).toBe('2 notes');
    expect(input.value).toBe('   ');
  });

  it('after deleting all, adding A gives one note', async () => {
    const { add, del, titles, count } = setup();
    await del('Buy milk');
    await del('Call Sam');
    await add('A');
    expect(titles()).toEqual(['A']);
    expect(count.textContent).toBe('1 notes');
  });

  it('reuses id 2 after deleting note 2 (keys remain unique, deletion targets correctly)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { add, del, titles } = setup();
    await del('Call Sam');
    await add('New');
    expect(titles()).toEqual(['Buy milk', 'New']);
    await add('Another');
    await del('New');
    expect(titles()).toEqual(['Buy milk', 'Another']);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes('same key'))).toBe(false);
  });

  it('allows duplicate titles with distinct ids', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { add, del, titles } = setup();
    await add('Dup');
    await add('Dup');
    expect(titles()).toEqual(['Buy milk', 'Call Sam', 'Dup', 'Dup']);
    await del('Dup');
    expect(titles()).toEqual(['Buy milk', 'Call Sam', 'Dup']);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes('same key'))).toBe(false);
  });
});

describe('Delete button click', () => {
  it('deletes Buy milk', async () => {
    const { del, titles, count } = setup();
    await del('Buy milk');
    expect(titles()).toEqual(['Call Sam']);
    expect(count.textContent).toBe('1 notes');
  });

  it('deleting last note empties list', async () => {
    const { del, list, count } = setup();
    await del('Call Sam');
    await del('Buy milk');
    expect(list.querySelectorAll('li')).toHaveLength(0);
    expect(count.textContent).toBe('0 notes');
  });

  it('deleting a new note preserves others order', async () => {
    const { add, del, titles } = setup();
    await add('A');
    await add('B');
    await del('A');
    expect(titles()).toEqual(['Buy milk', 'Call Sam', 'B']);
  });

  it('delete click does not submit the form', async () => {
    const { del, input, items } = setup();
    fireEvent.change(input, { target: { value: 'Pending' } });
    await del('Buy milk');
    expect(items()).toHaveLength(1);
    expect(input.value).toBe('Pending');
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
  });
});