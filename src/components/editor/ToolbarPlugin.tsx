import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { $isHeadingNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { $isCodeNode, $createCodeNode } from '@lexical/code';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Quote,
  CodeSquare,
} from 'lucide-react';

const LowPriority = 1;

interface ToolbarPluginProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function ToolbarPlugin({ isFullscreen, onToggleFullscreen }: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $findMatchingParent(element, (node) => $isListNode(node));
          const type = parentList ? (parentList as ListNode).getListType() : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : $isCodeNode(element)
            ? 'code'
            : element.getType();
          setBlockType(type);
        }
      }

      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      const node = selection.anchor.getNode();
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
    // Return focus to editor
    setTimeout(() => editor.focus(), 0);
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
    // Return focus to editor
    setTimeout(() => editor.focus(), 0);
  };

  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
    setTimeout(() => editor.focus(), 0);
  };

  const formatCode = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (blockType === 'code') {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createCodeNode());
        }
      }
    });
    setTimeout(() => editor.focus(), 0);
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setTimeout(() => editor.focus(), 0);
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setTimeout(() => editor.focus(), 0);
  };

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
    setTimeout(() => editor.focus(), 0);
  }, [editor, isLink]);

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-background sticky top-0 z-10" ref={toolbarRef}>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
          setTimeout(() => editor.focus(), 0);
        }}
        aria-label="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
          setTimeout(() => editor.focus(), 0);
        }}
        aria-label="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border" />

      <Select
        value={blockType}
        onValueChange={(value) => {
          if (value === 'paragraph') {
            formatParagraph();
          } else if (value.startsWith('h')) {
            formatHeading(value as any);
          } else if (value === 'quote') {
            formatQuote();
          } else if (value === 'code') {
            formatCode();
          }
        }}
      >
        <SelectTrigger className="w-[140px] h-8" onMouseDown={(e) => e.preventDefault()}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Normal</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
          <SelectItem value="h4">Heading 4</SelectItem>
          <SelectItem value="h5">Heading 5</SelectItem>
          <SelectItem value="h6">Heading 6</SelectItem>
          <SelectItem value="quote">Quote</SelectItem>
          <SelectItem value="code">Code Block</SelectItem>
        </SelectContent>
      </Select>

      <div className="w-px h-6 bg-border" />

      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
          setTimeout(() => editor.focus(), 0);
        }}
        className={isBold ? 'bg-muted' : ''}
        aria-label="Format Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
          setTimeout(() => editor.focus(), 0);
        }}
        className={isItalic ? 'bg-muted' : ''}
        aria-label="Format Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
          setTimeout(() => editor.focus(), 0);
        }}
        className={isUnderline ? 'bg-muted' : ''}
        aria-label="Format Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
          setTimeout(() => editor.focus(), 0);
        }}
        className={isStrikethrough ? 'bg-muted' : ''}
        aria-label="Format Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
          setTimeout(() => editor.focus(), 0);
        }}
        className={isCode ? 'bg-muted' : ''}
        aria-label="Format Code"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={insertLink}
        className={isLink ? 'bg-muted' : ''}
        aria-label="Insert Link"
      >
        <Link className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border" />

      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
          setTimeout(() => editor.focus(), 0);
        }}
        aria-label="Left Align"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
          setTimeout(() => editor.focus(), 0);
        }}
        aria-label="Center Align"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
          setTimeout(() => editor.focus(), 0);
        }}
        aria-label="Right Align"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
          setTimeout(() => editor.focus(), 0);
        }}
        aria-label="Justify Align"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border" />

      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={formatBulletList}
        className={blockType === 'bullet' ? 'bg-muted' : ''}
        aria-label="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={formatNumberedList}
        className={blockType === 'number' ? 'bg-muted' : ''}
        aria-label="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="sm"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggleFullscreen}
        aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
