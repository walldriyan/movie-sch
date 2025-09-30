'use client';

import React, { useMemo } from 'react';
import 'react-quill/dist/quill.snow.css';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues with React 18
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const QuillEditor = ({ value, onChange }: QuillEditorProps) => {

  // A custom handler for the image upload button on the toolbar
  const imageHandler = () => {
    // This is a placeholder.
    // In a real application, you would implement logic to:
    // 1. Open a file picker dialog.
    // 2. Upload the selected image to a storage service (like Firebase Storage).
    // 3. Get the public URL of the uploaded image.
    // 4. Insert the image URL into the editor.
    alert('Image upload functionality is not yet implemented.');

    // Example of what the logic might look like:
    /*
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      // const imageUrl = await uploadToFirebaseStorage(file); // Your upload function
      // const quill = this.quill.getEditor();
      // const range = quill.getSelection();
      // quill.insertEmbed(range.index, 'image', imageUrl);
    };
    */
  };
  
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
      },
    },
    clipboard: {
      // Prevent pasting images as base64
      matchVisual: false,
    }
  }), []);


  return (
    <div className="bg-background text-foreground rounded-lg">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        className="[&_.ql-container]:min-h-80 [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:rounded-b-lg"
      />
    </div>
  );
};

export default QuillEditor;
