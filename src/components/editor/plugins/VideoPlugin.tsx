import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes } from 'lexical';
import { useEffect } from 'react';
import { $createVideoNode, VideoPayload } from '../nodes/VideoNode';
import { COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';

export const INSERT_VIDEO_COMMAND: LexicalCommand<VideoPayload> = createCommand(
  'INSERT_VIDEO_COMMAND'
);

export default function VideoPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<VideoPayload>(
      INSERT_VIDEO_COMMAND,
      (payload) => {
        const videoNode = $createVideoNode(payload);
        $insertNodes([videoNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
