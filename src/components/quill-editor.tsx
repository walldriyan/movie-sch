'use client';

import { Editor } from '@tinymce/tinymce-react';
import React from 'react';

interface TinyMCEEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const TinyMCEEditor = ({ value, onChange }: TinyMCEEditorProps) => {
  return (
    <Editor
      apiKey="no-api-key"
      init={{
        height: 300,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar:
          'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; background-color: hsl(var(--background)); color: hsl(var(--foreground)); }',
        skin: 'oxide-dark',
        content_css: 'dark'
      }}
      initialValue={value}
      onEditorChange={(newValue, editor) => {
        onChange(newValue);
      }}
    />
  );
};

export default TinyMCEEditor;
