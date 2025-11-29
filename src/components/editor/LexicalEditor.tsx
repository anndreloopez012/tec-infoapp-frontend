import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import ToolbarPlugin from './ToolbarPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { $getRoot, $insertNodes } from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';

const theme = {
  paragraph: 'mb-2',
  quote: 'border-l-4 border-border pl-4 italic my-2',
  heading: {
    h1: 'text-4xl font-bold my-4',
    h2: 'text-3xl font-bold my-3',
    h3: 'text-2xl font-bold my-3',
    h4: 'text-xl font-bold my-2',
    h5: 'text-lg font-bold my-2',
    h6: 'text-base font-bold my-2',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal ml-4 my-2',
    ul: 'list-disc ml-4 my-2',
    listitem: 'ml-2',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-muted px-1 py-0.5 rounded font-mono text-sm',
  },
  code: 'bg-muted p-4 rounded font-mono text-sm my-2 block',
  link: 'text-primary underline hover:text-primary/80',
};

function onError(error: Error) {
  console.error(error);
}

interface UpdatePluginProps {
  value: string;
  onChange: (value: string) => void;
}

function UpdatePlugin({ value, onChange }: UpdatePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender && value) {
      editor.update(() => {
        try {
          const parsedState = editor.parseEditorState(value);
          editor.setEditorState(parsedState);
        } catch (e) {
          console.error('Error parsing editor state:', e);
        }
      });
      setIsFirstRender(false);
    }
  }, [editor, value, isFirstRender]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const json = JSON.stringify(editorState.toJSON());
      onChange(json);
    });
  }, [editor, onChange]);

  return null;
}

interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function LexicalEditor({ value, onChange, placeholder = 'Enter some rich text...' }: LexicalEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const initialConfig = {
    namespace: 'ContentEditor',
    theme,
    onError,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      AutoLinkNode,
      LinkNode,
    ],
  };

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-background flex flex-col' : 'border rounded-md overflow-hidden'}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className="flex flex-col h-full">
          <ToolbarPlugin 
            isFullscreen={isFullscreen} 
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)} 
          />
          <div className={`relative flex-1 ${isFullscreen ? 'overflow-auto' : ''}`}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className={`outline-none p-4 ${isFullscreen ? 'min-h-screen' : 'min-h-[400px]'} prose prose-sm max-w-none`}
                />
              }
              placeholder={
                <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <LinkPlugin />
            <ListPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <UpdatePlugin value={value} onChange={onChange} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}
