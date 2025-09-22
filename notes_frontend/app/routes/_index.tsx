import type { MetaFunction, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigation, useSubmit, useSearchParams } from "@remix-run/react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 PUBLIC_INTERFACE
*/
export const meta: MetaFunction = () => {
  return [
    { title: "Notes — Ocean Professional" },
    {
      name: "description",
      content:
        "A simple notes app to create, view, edit, and delete notes with a modern Ocean Professional theme.",
    },
  ];
};

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

type LoaderData = {
  notes: Note[];
  selectedId?: string;
};

/**
 Utilities to work with localStorage safely on client.
 The loader returns empty set; the UI hydrates from localStorage in useEffect.
 This keeps the app fully frontend while using Remix structure.
*/
const STORAGE_KEY = "remix-notes-v1";

/**
 PUBLIC_INTERFACE
*/
export async function loader({ request }: LoaderFunctionArgs) {
  // Server cannot access browser localStorage, so we return an empty dataset.
  // Client-side effect will hydrate from localStorage after render.
  const url = new URL(request.url);
  const selectedId = url.searchParams.get("note") || undefined;
  return json<LoaderData>({ notes: [], selectedId });
}

/**
 PUBLIC_INTERFACE
*/
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  // Intentionally unused on the server; client handles localStorage mutations.
  // Keeping form handling structure for future backend integration.

  // Since we are using localStorage for persistence, we redirect back to the page.
  // The client will process the intent optimistically and sync to localStorage.
  const selectedId = formData.get("id") ? String(formData.get("id")) : undefined;
  const sp = selectedId ? `?note=${encodeURIComponent(selectedId)}` : "";
  return redirect("/" + sp);
}

/**
 Hook to manage notes in localStorage with React state.
*/
function useLocalNotes(initial: Note[]) {
  const [notes, setNotes] = useState<Note[]>(initial);

  // Load from localStorage on client
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Note[];
        setNotes(parsed);
      }
    } catch {
      // ignore parsing errors
    }
  }, []);

  // Persist anytime notes change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // storage may be unavailable
    }
  }, [notes]);

  const createNote = (partial?: Partial<Note>) => {
    const ts = Date.now();
    const newNote: Note = {
      id: cryptoRandomId(),
      title: partial?.title ?? "Untitled",
      content: partial?.content ?? "",
      createdAt: ts,
      updatedAt: ts,
    };
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n))
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return { notes, setNotes, createNote, updateNote, deleteNote };
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-expect-error - randomUUID exists in modern runtimes
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function formatRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.round(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/**
 PUBLIC_INTERFACE
 Main Notes App Route Component
*/
export default function Index() {
  const data = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state } = useNavigation();
  const isSubmitting = state !== "idle";

  const { notes, createNote, updateNote, deleteNote } = useLocalNotes(data.notes);

  // Selected note id from URL
  const selectedId = searchParams.get("note") || undefined;
  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId),
    [notes, selectedId]
  );

  // Auto-select first note if none selected and notes exist
  useEffect(() => {
    if (!selectedId && notes.length > 0) {
      setSearchParams((sp) => {
        const next = new URLSearchParams(sp);
        next.set("note", notes[0].id);
        return next;
      });
    }
  }, [notes, selectedId, setSearchParams]);

  // Handlers
  const handleCreate = () => {
    const newNote = createNote({ title: "New Note" });
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      next.set("note", newNote.id);
      return next;
    });
  };

  const handleDelete = (id: string) => {
    deleteNote(id);
    // If we deleted the selected note, switch to next available
    setSearchParams((sp) => {
      const next = new URLSearchParams(sp);
      const remaining = notes.filter((n) => n.id !== id);
      if (remaining.length) {
        next.set("note", remaining[0].id);
      } else {
        next.delete("note");
      }
      return next;
    });
  };

  const handleTitleChange = (id: string, title: string) => {
    updateNote(id, { title });
  };

  const handleContentChange = (id: string, content: string) => {
    updateNote(id, { content });
  };

  return (
    <div className="flex h-dvh w-full flex-col">
      {/* Top Bar */}
      <header className="ocean-gradient surface sticky top-0 z-10 border-b border-gray-200/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              {/* simple wave logo */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 15c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-semibold text-gray-800">Notes</h1>
              <p className="text-xs text-gray-500">Ocean Professional</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleCreate} className="btn-primary">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              New note
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto flex h-[calc(100dvh-64px)] w-full max-w-7xl flex-1 gap-4 px-4 pb-6 pt-4 sm:px-6">
        {/* Sidebar */}
        <aside className="surface relative flex w-full max-w-[320px] flex-col overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="note-badge">Notes</span>
              <span className="text-xs text-gray-500">{notes.length}</span>
            </div>
            <button className="icon-btn" onClick={handleCreate} title="Create note">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="divider" />
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {notes.length === 0 ? (
              <div className="m-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                No notes yet. Click “New note” to get started.
              </div>
            ) : (
              <ul className="space-y-1">
                {notes.map((n) => {
                  const active = n.id === selectedId;
                  return (
                    <li key={n.id}>
                      <button
                        className={`sidebar-item ${active ? "sidebar-item-active" : ""}`}
                        onClick={() =>
                          setSearchParams((sp) => {
                            const next = new URLSearchParams(sp);
                            next.set("note", n.id);
                            return next;
                          })
                        }
                      >
                        <div className="mt-0.5 inline-flex h-2 w-2 flex-none rounded-full bg-blue-500" />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-gray-800">{n.title || "Untitled"}</p>
                            <span className="ml-2 flex-shrink-0 text-[10px] text-gray-400">
                              {formatRelativeTime(n.updatedAt)}
                            </span>
                          </div>
                          <p className="line-clamp-1 text-xs text-gray-500">{n.content || "No content"}</p>
                        </div>
                        {active && (
                          <span className="ml-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                            Active
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Editor panel */}
        <section className="surface flex min-w-0 flex-1 flex-col overflow-hidden border border-gray-200">
          {!selected ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Create your first note</h2>
                <p className="mt-1 text-sm text-gray-600">Notes are saved in your browser.</p>
                <div className="mt-4">
                  <button onClick={handleCreate} className="btn-primary">New note</button>
                </div>
              </div>
            </div>
          ) : (
            <Editor
              key={selected.id}
              note={selected}
              onDelete={() => handleDelete(selected.id)}
              onTitleChange={(t) => handleTitleChange(selected.id, t)}
              onContentChange={(c) => handleContentChange(selected.id, c)}
              isSaving={isSubmitting}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function Editor({
  note,
  onDelete,
  onTitleChange,
  onContentChange,
  isSaving,
}: {
  note: Note;
  onDelete: () => void;
  onTitleChange: (t: string) => void;
  onContentChange: (c: string) => void;
  isSaving: boolean;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const submit = useSubmit();

  // Auto-focus title when opening a new note with default title "New Note"
  useEffect(() => {
    if (note.title === "New Note") {
      titleRef.current?.select();
    }
  }, [note.id, note.title]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="note-badge">Editor</span>
          <span className="text-xs text-gray-500">Last edit {formatRelativeTime(note.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Form method="post" onSubmit={(e) => {
            e.preventDefault();
            onDelete();
            // Also inform action for URL-state parity (no-op server)
            const fd = new FormData();
            fd.append("intent", "delete");
            fd.append("id", note.id);
            submit(fd, { method: "post" });
          }}>
            <button type="submit" className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 7h12M10 10v6M14 10v6M9 7l1-2h4l1 2m-9 0l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Delete
            </button>
          </Form>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl">
          <input
            ref={titleRef}
            value={note.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Note title"
            className="input mb-3 text-lg font-semibold"
            aria-label="Note title"
          />
          <textarea
            value={note.content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Write your note here..."
            className="textarea min-h-[50dvh]"
            aria-label="Note content"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
        <div className="text-xs text-gray-500">
          {isSaving ? "Saving…" : "Saved locally"}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-primary"
            onClick={() => {
              // no-op explicit save as changes are auto-saved; show feedback
              const el = document.createElement("span");
              el.textContent = "Saved!";
              el.className =
                "ml-2 rounded bg-green-50 px-2 py-0.5 text-xs text-green-700 ring-1 ring-green-200";
              // ephemeral UI indication
              (event?.currentTarget as HTMLButtonElement)?.appendChild(el);
              setTimeout(() => el.remove(), 800);
            }}
          >
            Save
          </button>
          <button
            className="btn-ghost"
            onClick={() => {
              onTitleChange(note.title.trim());
              onContentChange(note.content);
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
