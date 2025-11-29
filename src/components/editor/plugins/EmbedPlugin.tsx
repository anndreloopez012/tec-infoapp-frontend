import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes } from 'lexical';
import { useEffect } from 'react';
import { $createEmbedNode, EmbedPayload } from '../nodes/EmbedNode';
import { COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';

export const INSERT_EMBED_COMMAND: LexicalCommand<EmbedPayload> = createCommand(
  'INSERT_EMBED_COMMAND'
);

export default function EmbedPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<EmbedPayload>(
      INSERT_EMBED_COMMAND,
      (payload) => {
        const embedNode = $createEmbedNode(payload);
        $insertNodes([embedNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
