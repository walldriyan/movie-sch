
'use client';

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link2, ImageIcon, Strikethrough, Heading, X, Smile, Film, Notebook, ImageUp, Underline, RemoveFormatting } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import UnderlineExtension from '@tiptap/extension-underline';


const ImageComponentWithResize = ({ node, updateAttributes, deleteNode }: NodeViewProps) => {
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const setSize = (size: 'sm' | 'md' | 'lg' | null, width: number | null) => {
    updateAttributes({ 'data-size': size, width });
    setPopoverOpen(false);
  }

  return (
    <NodeViewWrapper className="block group/image-wrapper">
       <div className="relative">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <img 
              src={node.attrs.src} 
              alt={node.attrs.alt} 
              width={node.attrs.width}
              data-size={node.attrs['data-size']}
              className={cn('max-w-full h-auto cursor-pointer transition-all inline-block', {
                'ring-2 ring-primary ring-offset-2 ring-offset-background': popoverOpen
              })}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setSize('sm', 24)} title="Emoji"
                className={cn({'bg-muted': node.attrs['data-size'] === 'sm'})}
              >
                <Smile className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSize('md', 200)} title="Small"
                className={cn({'bg-muted': node.attrs['data-size'] === 'md'})}
              >
                <Film className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSize('lg', 500)} title="Medium"
                className={cn({'bg-muted': node.attrs['data-size'] === 'lg'})}
              >
                <Notebook className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setSize(null, null)} title="Original"
                className={cn({'bg-muted': !node.attrs['data-size']})}
              >
                <ImageUp className="w-4 h-4" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <button
          onClick={deleteNode}
          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover/image-wrapper:opacity-100 transition-opacity"
          aria-label="Remove image"
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuillEditor = ({ value, onChange }: QuillEditorProps) => {
  const [contextMenuOpen, setContextMenuOpen] = React.useState(false);
  const [contextMenuPosition, setContextMenuPosition] = React.useState({ top: 0, left: 0 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'm-0', // Tailwind margin-0
          },
        },
      }),
      UnderlineExtension,
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
            },
            'data-size': {
              default: null,
            },
          }
        },
        addNodeView() {
          return ReactNodeViewRenderer(ImageComponentWithResize);
        },
      }).configure({
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
        class: 'tiptap p-4 min-h-[200px] max-h-[600px] overflow-y-auto focus:outline-none',
      },
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(event.target as Node)) {
        setContextMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleContextMenu = (e: React.MouseEvent) => {
    if (editor.state.selection.empty) {
      setContextMenuOpen(false);
      return;
    }
    e.preventDefault();
    setContextMenuPosition({ top: e.clientY, left: e.clientX });
    setContextMenuOpen(true);
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
          className={cn('p-2 rounded hover:bg-muted')}
          type="button"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div onContextMenu={handleContextMenu} ref={editorRef}>
          <EditorContent editor={editor} />
      </div>

      <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <DropdownMenuTrigger />
        <DropdownMenuContent
          style={{
            position: 'fixed',
            top: contextMenuPosition.top,
            left: contextMenuPosition.left,
          }}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="mr-2 h-4 w-4" />
            <span>Bold</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="mr-2 h-4 w-4" />
            <span>Italic</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => editor.chain().focus().toggleUnderline().run()}>
            <Underline className="mr-2 h-4 w-4" />
            <span>Underline</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => editor.chain().focus().unsetAllMarks().run()}>
            <RemoveFormatting className="mr-2 h-4 w-4" />
            <span>Clear formatting</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


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
