import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ImageNode } from './nodes/ImageNode';
import { HorizontalRuleNode } from './nodes/HorizontalRuleNode';
import { VideoNode } from './nodes/VideoNode';
import { EmbedNode } from './nodes/EmbedNode';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

const viewerTheme = {
  paragraph: 'mb-4 text-base leading-relaxed',
  quote: 'border-l-4 border-primary pl-6 italic my-6 text-muted-foreground',
  heading: {
    h1: 'text-4xl font-bold my-6 text-foreground',
    h2: 'text-3xl font-bold my-5 text-foreground',
    h3: 'text-2xl font-bold my-4 text-foreground',
    h4: 'text-xl font-semibold my-3 text-foreground',
    h5: 'text-lg font-semibold my-3 text-foreground',
    h6: 'text-base font-semibold my-2 text-foreground',
  },
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal ml-6 my-4 space-y-2',
    ul: 'list-disc ml-6 my-4 space-y-2',
    listitem: 'ml-2 text-base leading-relaxed',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    code: 'bg-accent px-2 py-1 rounded font-mono text-sm',
  },
  code: 'bg-accent p-6 rounded-lg font-mono text-sm my-6 block overflow-x-auto border border-border',
  link: 'text-primary underline hover:text-primary/80 cursor-pointer transition-colors',
  image: 'editor-image',
  table: 'border-collapse border border-border my-6 w-full',
  tableCell: 'border border-border p-3 min-w-[100px]',
  tableCellHeader: 'border border-border p-3 min-w-[100px] bg-accent font-semibold',
};

function onError(error: Error) {
  console.error('Lexical Viewer Error:', error);
}

interface LoadContentPluginProps {
  content: string;
}

function LoadContentPlugin({ content }: LoadContentPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!content) return;

    try {
      // Parse the JSON content and set editor state
      const parsedState = editor.parseEditorState(content);
      editor.setEditorState(parsedState);
      
      // Make editor read-only
      editor.setEditable(false);

      // Restore table styles after content is loaded
      setTimeout(() => {
        const rootElement = editor.getRootElement();
        if (!rootElement) return;

        const tables = rootElement.querySelectorAll('table');
        tables.forEach((table) => {
          const htmlTable = table as HTMLTableElement;
          
          // Restore table dimensions
          if (htmlTable.dataset.width) {
            htmlTable.style.width = htmlTable.dataset.width;
          }
          if (htmlTable.dataset.height) {
            htmlTable.style.height = htmlTable.dataset.height;
          }
          
          // Restore table border
          if (htmlTable.dataset.borderStyle && htmlTable.dataset.borderStyle !== 'none') {
            const borderWidth = htmlTable.dataset.borderWidth || '1px';
            htmlTable.style.border = `${borderWidth} ${htmlTable.dataset.borderStyle} hsl(var(--border))`;
          }
          
          // Restore cell styles
          const cells = htmlTable.querySelectorAll('td, th');
          cells.forEach((cell) => {
            const htmlCell = cell as HTMLTableCellElement;
            
            // Restore background color
            if (htmlCell.dataset.bgColor) {
              htmlCell.style.backgroundColor = htmlCell.dataset.bgColor;
            }
            
            // Restore cell border
            if (htmlCell.dataset.borderStyle && htmlCell.dataset.borderStyle !== 'none') {
              const borderWidth = htmlCell.dataset.borderWidth || '1px';
              htmlCell.style.border = `${borderWidth} ${htmlCell.dataset.borderStyle} hsl(var(--border))`;
            }
          });
        });
      }, 100);
    } catch (error) {
      console.error('Error loading content in viewer:', error);
      // If parsing fails, try to handle plain text
      editor.update(() => {
        const root = editor.getEditorState()._nodeMap.get('root');
        if (root) {
          console.warn('Failed to parse Lexical JSON, showing raw content');
        }
      });
    }
  }, [editor, content]);

  return null;
}

interface LexicalViewerProps {
  content: string;
  className?: string;
}

export default function LexicalViewer({ content, className = '' }: LexicalViewerProps) {
  const initialConfig = {
    namespace: 'ContentViewer',
    theme: viewerTheme,
    onError,
    editable: false,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
      ImageNode,
      HorizontalRuleNode,
      VideoNode,
      EmbedNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
  };

  if (!content) {
    return (
      <div className="text-muted-foreground italic py-8 text-center">
        Sin contenido disponible
      </div>
    );
  }

  return (
    <div className={`lexical-viewer ${className}`} style={{ maxWidth: '100%', overflow: 'hidden' }}>
      <style>{`
        .lexical-viewer .image-resizer,
        .lexical-viewer .video-resizer,
        .lexical-viewer .embed-resizer,
        .lexical-viewer [class*="resizer"],
        .lexical-viewer [class*="resize-handle"],
        .lexical-viewer button {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        .lexical-viewer * {
          max-width: 100% !important;
        }
        .lexical-viewer img {
          pointer-events: none !important;
          user-select: none !important;
          width: 100% !important;
          height: auto !important;
          object-fit: contain !important;
          display: block !important;
        }
        .lexical-viewer video,
        .lexical-viewer iframe {
          pointer-events: none !important;
          user-select: none !important;
          max-width: 100% !important;
          height: auto !important;
        }
      `}</style>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className="outline-none prose prose-base lg:prose-lg max-w-none focus:outline-none
                prose-headings:text-foreground 
                prose-p:text-foreground 
                prose-strong:text-foreground 
                prose-a:text-primary 
                prose-code:text-foreground 
                prose-pre:bg-accent/50 
                prose-li:text-foreground
                prose-blockquote:text-muted-foreground
                prose-blockquote:border-primary
                prose-img:rounded-lg
                prose-img:shadow-md
                select-text"
              style={{ userSelect: 'text' }}
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <LoadContentPlugin content={content} />
      </LexicalComposer>
    </div>
  );
}
