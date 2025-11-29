import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
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
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { 
  Undo2, 
  Redo2, 
  Bold, 
  Italic, 
  Underline, 
  Code,
  Link as LinkIcon,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Type,
  Plus,
  Maximize2,
  Minimize2,
  Minus,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const LowPriority = 1;

const blockTypeToBlockName = {
  bullet: 'Bullet List',
  check: 'Check List',
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  number: 'Numbered List',
  paragraph: 'Normal',
  quote: 'Quote',
};

const FONT_FAMILY_OPTIONS = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const FONT_SIZE_OPTIONS = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];

function Divider() {
  return <div className="divider" />;
}

interface ToolbarPluginProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function ToolbarPlugin({ isFullscreen, onToggleFullscreen }: ToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blockType, setBlockType] = useState<keyof typeof blockTypeToBlockName>('paragraph');
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('15px');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }

      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
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
        () => {
          updateToolbar();
          return false;
        },
        LowPriority,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority,
      ),
    );
  }, [editor, updateToolbar]);

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        $setBlocksType(selection, () => $createQuoteNode());
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();
        $setBlocksType(selection, () => $createCodeNode());
      });
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        {/* Undo/Redo */}
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          className="toolbar-item"
          aria-label="Deshacer"
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          className="toolbar-item"
          aria-label="Rehacer"
        >
          <Redo2 size={18} />
        </button>

        <Divider />

        {/* Block Type */}
        <Select
          value={blockType}
          onValueChange={(value) => {
            if (value === 'paragraph') formatParagraph();
            else if (value === 'h1') formatHeading('h1');
            else if (value === 'h2') formatHeading('h2');
            else if (value === 'h3') formatHeading('h3');
            else if (value === 'bullet') formatBulletList();
            else if (value === 'number') formatNumberedList();
            else if (value === 'quote') formatQuote();
            else if (value === 'code') formatCode();
          }}
        >
          <SelectTrigger className="toolbar-select">
            <SelectValue placeholder={blockTypeToBlockName[blockType]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">Normal</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
            <SelectItem value="bullet">Bullet List</SelectItem>
            <SelectItem value="number">Numbered List</SelectItem>
            <SelectItem value="quote">Quote</SelectItem>
            <SelectItem value="code">Code Block</SelectItem>
          </SelectContent>
        </Select>

        <Divider />

        {/* Font Family */}
        <Select value={fontFamily} onValueChange={setFontFamily}>
          <SelectTrigger className="toolbar-select">
            <SelectValue placeholder="Arial" />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILY_OPTIONS.map(([option, text]) => (
              <SelectItem key={option} value={option} style={{ fontFamily: option }}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Divider />

        {/* Font Size */}
        <div className="toolbar-font-size-group">
          <button
            type="button"
            className="toolbar-item toolbar-item-small"
            onClick={() => {
              const currentSize = parseInt(fontSize);
              if (currentSize > 10) {
                setFontSize(`${currentSize - 1}px`);
              }
            }}
            aria-label="Decrease font size"
          >
            <Minus size={14} />
          </button>
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="toolbar-select-small">
              <SelectValue placeholder="15px" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZE_OPTIONS.map(([option, text]) => (
                <SelectItem key={option} value={option}>
                  {text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            className="toolbar-item toolbar-item-small"
            onClick={() => {
              const currentSize = parseInt(fontSize);
              if (currentSize < 72) {
                setFontSize(`${currentSize + 1}px`);
              }
            }}
            aria-label="Increase font size"
          >
            <Plus size={14} />
          </button>
        </div>

        <Divider />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          className={`toolbar-item ${isBold ? 'active' : ''}`}
          aria-label="Negrita"
        >
          <Bold size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          className={`toolbar-item ${isItalic ? 'active' : ''}`}
          aria-label="Cursiva"
        >
          <Italic size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          className={`toolbar-item ${isUnderline ? 'active' : ''}`}
          aria-label="Subrayado"
        >
          <Underline size={18} />
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
          className={`toolbar-item ${isCode ? 'active' : ''}`}
          aria-label="Código"
        >
          <Code size={18} />
        </button>
        <button
          type="button"
          onClick={insertLink}
          className={`toolbar-item ${isLink ? 'active' : ''}`}
          aria-label="Enlace"
        >
          <LinkIcon size={18} />
        </button>

        <Divider />

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="toolbar-item toolbar-dropdown" aria-label="Color de texto">
              <Type size={18} />
              <ChevronDown size={14} className="ml-1" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="grid grid-cols-8 gap-2">
              {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(color => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    // Apply text color
                  }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Background Color */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="toolbar-item toolbar-dropdown" aria-label="Color de fondo">
              <Palette size={18} />
              <ChevronDown size={14} className="ml-1" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="grid grid-cols-8 gap-2">
              {['transparent', '#FFEBEE', '#E8F5E9', '#E3F2FD', '#FFF9C4', '#F3E5F5', '#E0F7FA', '#F5F5F5'].map(color => (
                <button
                  key={color}
                  type="button"
                  className="w-6 h-6 rounded border border-border"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    // Apply background color
                  }}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Divider />

        {/* More Options */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="toolbar-item toolbar-dropdown" aria-label="Más opciones">
              <Type size={18} />
              <ChevronDown size={14} className="ml-1" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="flex flex-col gap-1">
              <button type="button" className="text-left px-3 py-2 hover:bg-accent rounded text-sm">
                Strikethrough
              </button>
              <button type="button" className="text-left px-3 py-2 hover:bg-accent rounded text-sm">
                Subscript
              </button>
              <button type="button" className="text-left px-3 py-2 hover:bg-accent rounded text-sm">
                Superscript
              </button>
              <button type="button" className="text-left px-3 py-2 hover:bg-accent rounded text-sm">
                Clear Formatting
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <Divider />

        {/* Insert */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="toolbar-item toolbar-dropdown" aria-label="Insertar">
              <Plus size={18} />
              <span className="ml-1 text-sm">Insert</span>
              <ChevronDown size={14} className="ml-1" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="flex flex-col gap-1">
              <button type="button" className="text-left px-3 py-2 hover:bg-accent rounded text-sm">
                Horizontal Rule
              </button>
              <button type="button" className="text-left px-3 py-2 hover:bg-accent rounded text-sm">
                Image
              </button>
              <button type="button" className="text-left px-3 py-2 hover:bg-accent rounded text-sm">
                Table
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <Divider />

        {/* Alignment */}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="toolbar-item toolbar-dropdown" aria-label="Alineación">
              <AlignLeft size={18} />
              <span className="ml-1 text-sm">Left Align</span>
              <ChevronDown size={14} className="ml-1" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded text-sm"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
              >
                <AlignLeft size={18} />
                Left Align
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded text-sm"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
              >
                <AlignCenter size={18} />
                Center Align
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded text-sm"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
              >
                <AlignRight size={18} />
                Right Align
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded text-sm"
                onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
              >
                <AlignJustify size={18} />
                Justify Align
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="toolbar-spacer" />

        {/* Fullscreen */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="toolbar-item"
          aria-label={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
        >
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>
    </div>
  );
}
