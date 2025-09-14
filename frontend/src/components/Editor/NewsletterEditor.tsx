import React, { useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface NewsletterEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

const NewsletterEditor: React.FC<NewsletterEditorProps> = ({
  initialContent = '',
  onChange,
  placeholder = 'Start writing your newsletter...'
}) => {
  const [content, setContent] = useState(initialContent);

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['link', 'image', 'video'],
        ['clean']
      ]
    },
    clipboard: {
      matchVisual: false,
    }
  };

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background', 'align'
  ];

  const handleChange = useCallback((value: string) => {
    setContent(value);
    onChange?.(value);
  }, [onChange]);

  return (
    <div className="newsletter-editor">
      <ReactQuill
        theme="snow"
        value={content}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          height: '400px',
          marginBottom: '50px'
        }}
      />
    </div>
  );
};

export default NewsletterEditor;