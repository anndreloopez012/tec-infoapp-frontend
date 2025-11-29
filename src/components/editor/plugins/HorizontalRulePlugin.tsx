import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes } from 'lexical';
import { useEffect } from 'react';
import { $createHorizontalRuleNode } from '../nodes/HorizontalRuleNode';
import { COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';

export const INSERT_HORIZONTAL_RULE_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_HORIZONTAL_RULE_COMMAND'
);

export default function HorizontalRulePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INSERT_HORIZONTAL_RULE_COMMAND,
      () => {
        const horizontalRuleNode = $createHorizontalRuleNode();
        $insertNodes([horizontalRuleNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
