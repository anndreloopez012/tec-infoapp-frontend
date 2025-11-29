import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes } from 'lexical';
import { useEffect } from 'react';
import { $createImageNode, ImagePayload } from '../nodes/ImageNode';
import { COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand(
  'INSERT_IMAGE_COMMAND'
);

export default function ImagesPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<ImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload);
        $insertNodes([imageNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
