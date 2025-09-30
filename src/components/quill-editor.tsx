'use client';

import 'react-quill/dist/quill.snow.css';
import { useMemo } from 'react';
import dynamic from 'next/dynamic';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuillEditor = ({ value, onChange }: QuillEditorProps) => {
  const ReactQuill = useMemo(
    () => dynamic(() => import('react-quill'), { ssr: false }),
    []
  );

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  return (
    <div className="bg-background text-foreground rounded-lg">
      <ReactQuill
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
