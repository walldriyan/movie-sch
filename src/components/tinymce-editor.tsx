'use client';

import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface TinyMCEEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TinyMCEEditor = ({ value, onChange }: TinyMCEEditorProps) => {
  const editorRef = useRef<any>(null);
  
  // Note: This is a free-tier API key. For production use, you should get your own from tiny.cloud
  const apiKey = 'YOUR_TINYMCE_API_KEY';

  return (
    <Editor
      apiKey={apiKey}
      onInit={(evt, editor) => editorRef.current = editor}
      initialValue={value}
      onEditorChange={(newValue, editor) => {
        onChange(newValue);
      }}
      init={{
        height: 500,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: `
          body { 
            font-family:Helvetica,Arial,sans-serif; 
            font-size:16px;
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
          }
        `,
        skin: 'oxide-dark',
        content_css: 'dark'
      }}
    />
  );
};

export default TinyMCEEditor;
