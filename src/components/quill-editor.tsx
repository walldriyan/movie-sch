'use client';

import 'react-quill/dist/quill.snow.css';
import { useEffect, useRef, useState } from 'react';
import type ReactQuill from 'react-quill';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuillEditor = ({ value, onChange }: QuillEditorProps) => {
  const [Quill, setQuill] = useState<typeof ReactQuill | null>(null);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    import('react-quill').then((mod) => {
      setQuill(() => mod.default);
    });
  }, []);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  if (!Quill) {
    return (
      <div className="bg-background text-foreground rounded-lg h-[200px] flex items-center justify-center">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground rounded-lg">
      <Quill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        className="h-full"
      />
    </div>
  );
};

export default QuillEditor;
