import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

export interface Note {
  id: number;
  title: string;
  body: string;
}

const INITIAL_NOTES: readonly Note[] = [
  { id: 1, title: 'Buy milk', body: 'Two litres' },
  { id: 2, title: 'Call Sam', body: 'About the trip' },
];

/** max(id) + 1 over the current list; an empty list yields 1 (freed ids may be reused). */
function nextId(notes: readonly Note[]): number {
  return notes.reduce((max, n) => Math.max(max, n.id), 0) + 1;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(() => [...INITIAL_NOTES]);
  const [title, setTitle] = useState<string>('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = title.trim();
    // Source returns early without clearing the input on blank/whitespace-only titles.
    if (!trimmed) return;
    setNotes((prev) => [...prev, { id: nextId(prev), title: trimmed, body: '' }]);
    setTitle('');
  };

  const handleDelete = (id: number): void => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <main>
      <h1>Notes</h1>
      <form id="note-form" onSubmit={handleSubmit}>
        <input
          id="title"
          placeholder="New note"
          value={title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
      <ul id="notes">
        {notes.map((note) => (
          <li key={note.id}>
            <strong>{note.title}</strong>
            {note.body ? <span>{' — ' + note.body}</span> : null}
            {/* No explicit type, matching the source's $('<button>') (it sits outside the form). */}
            <button onClick={() => handleDelete(note.id)}>Delete</button>
          </li>
        ))}
      </ul>
      {/* Intentionally no pluralisation: preserves source text "1 notes" / "0 notes". */}
      <p id="count">{`${notes.length} notes`}</p>
    </main>
  );
}
