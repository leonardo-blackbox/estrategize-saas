import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { useEffect, useRef } from 'react';

interface Props {
  initialContent: unknown;
  onChange: (doc: unknown) => void;
}

export function CentralPageEditor({ initialContent, onChange }: Props) {
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Título…';
          return "Comece a escrever, ou apague para começar do zero…";
        },
      }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'central-link' } }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: (initialContent as object | undefined) ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.getJSON());
    },
  });

  // Reset content when switching pages
  useEffect(() => {
    if (!editor) return;
    const current = editor.getJSON();
    if (JSON.stringify(current) !== JSON.stringify(initialContent)) {
      editor.commands.setContent(initialContent as object, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContent, editor]);

  return <EditorContent editor={editor} className="central-editor" />;
}
