'use client';

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link2, ImageIcon, Strikethrough, Heading, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

// Custom Image Component with a remove button
const ImageComponent = ({ node, deleteNode }: { node: any; deleteNode: () => void; }) => (
  <NodeViewWrapper className="block">
    <div className="relative group">
      <img src={node.attrs.src} alt={node.attrs.alt} className="max-w-full h-auto" />
      <button
        onClick={deleteNode}
        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove image"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </NodeViewWrapper>
);


interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuillEditor = ({ value, onChange }: QuillEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // No need to configure history here as it's default
      }),
      Image.extend({
        addNodeView() {
          return ReactNodeViewRenderer(ImageComponent);
        },
      }).configure({
        inline: true,
        allowBase64: true,
      }),
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
        class: 'prose prose-sm dark:prose-invert max-w-none p-4 min-h-[200px] max-h-[600px] overflow-y-auto focus:outline-none',
      },
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!editor) {
    return null;
  }
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
          editor.chain().focus().setImage({ src }).run();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
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
          className={cn('p-2 rounded hover:bg-muted', { 'bg-muted': editor.isActive('heading', { level: 2 }) })}
          type="button"
        >
          <Heading className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn('p-2 rounded hover:bg-muted', { 'bg-muted': editor.isActive('bold') })}
          type="button"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn('p-2 rounded hover:bg-muted', { 'bg-muted': editor.isActive('italic') })}
          type="button"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn('p-2 rounded hover:bg-muted', { 'bg-muted': editor.isActive('strike') })}
          type="button"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn('p-2 rounded hover:bg-muted', { 'bg-muted': editor.isActive('bulletList') })}
          type="button"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn('p-2 rounded hover:bg-muted', { 'bg-muted': editor.isActive('orderedList') })}
          type="button"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={addLink}
          className={cn('p-2 rounded hover:bg-muted', { 'bg-muted': editor.isActive('link') })}
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
      <EditorContent 
        editor={editor}
      />
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*"
      />
    </div>
  );
};

export default QuillEditor;
