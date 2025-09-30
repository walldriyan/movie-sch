'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link2, ImageIcon, Strikethrough, Heading } from 'lucide-react';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuillEditor = ({ value, onChange }: QuillEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none p-4 min-h-[200px] focus:outline-none',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Link URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="bg-background text-foreground rounded-lg border">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}`}
          type="button"
        >
          <Heading className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('bold') ? 'bg-muted' : ''}`}
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('italic') ? 'bg-muted' : ''}`}
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('strike') ? 'bg-muted' : ''}`}
          type="button"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
          type="button"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={addLink}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('link') ? 'bg-muted' : ''}`}
          type="button"
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          onClick={addImage}
          className="p-2 rounded hover:bg-muted"
          type="button"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default QuillEditor;
