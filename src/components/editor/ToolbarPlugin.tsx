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
  $createTextNode,
  $insertNodes,
} from 'lexical';
import { $isLinkNode, $createLinkNode } from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from '@lexical/list';
import {
  INSERT_TABLE_COMMAND,
  TableNode,
} from '@lexical/table';
import { $isHeadingNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType, $patchStyleText } from '@lexical/selection';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { $isCodeNode, $createCodeNode } from '@lexical/code';
import { INSERT_IMAGE_COMMAND } from './plugins/ImagesPlugin';
import { INSERT_HORIZONTAL_RULE_COMMAND } from './plugins/HorizontalRulePlugin';
import { INSERT_VIDEO_COMMAND } from './plugins/VideoPlugin';
import { INSERT_EMBED_COMMAND } from './plugins/EmbedPlugin';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  Minus,
  Image,
  Table,
  ChevronDown,
  Video,
  Share2,
  Palette,
  Highlighter,
  CaseLower,
  CaseUpper,
  Type,
  Subscript,
  Superscript,
  Eraser,
} from 'lucide-react';
import LinkDialog from './ui/LinkDialog';
import ImageDialog from './ui/ImageDialog';
import VideoDialog from './ui/VideoDialog';
import EmbedDialog from './ui/EmbedDialog';
import TableDialog from './ui/TableDialog';
import ColorPicker from './ui/ColorPicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('');
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('16px');

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
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));

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
    setShowLinkDialog(true);
  }, []);

  const handleLinkConfirm = useCallback(
    (url: string, text?: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (text) {
            // Create new link with text
            const linkNode = $createLinkNode(url);
            const textNode = $createTextNode(text);
            linkNode.append(textNode);
            selection.insertNodes([linkNode]);
          } else {
            // Convert selection to link
            const node = selection.anchor.getNode();
            const parent = node.getParent();
            if ($isLinkNode(parent)) {
              // Update existing link
              parent.setURL(url);
            } else if (selection.getTextContent()) {
              // Create link from selected text
              const linkNode = $createLinkNode(url);
              selection.insertNodes([linkNode]);
            }
          }
        }
      });
      setTimeout(() => editor.focus(), 0);
    },
    [editor]
  );

  const handleImageConfirm = useCallback(
    (src: string, altText: string) => {
      editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src,
        altText,
      });
      setTimeout(() => editor.focus(), 0);
    },
    [editor]
  );

  const handleVideoConfirm = useCallback(
    (src: string, type: 'youtube' | 'upload', width: number, height: number) => {
      editor.dispatchCommand(INSERT_VIDEO_COMMAND, {
        src,
        type,
        width,
        height,
      });
      setTimeout(() => editor.focus(), 0);
    },
    [editor]
  );

  const handleEmbedConfirm = useCallback(
    (url: string, platform: 'instagram' | 'facebook' | 'twitter', width: number, height: number) => {
      editor.dispatchCommand(INSERT_EMBED_COMMAND, {
        url,
        platform,
        width,
        height,
      });
      setTimeout(() => editor.focus(), 0);
    },
    [editor]
  );

  const insertHorizontalRule = useCallback(() => {
    editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
    setTimeout(() => editor.focus(), 0);
  }, [editor]);

  const handleTableConfirm = useCallback((rows: string, columns: string) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows, columns });
    setTimeout(() => editor.focus(), 0);
  }, [editor]);

  const applyTextColor = useCallback((color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color: color || null });
      }
    });
    setShowTextColorPicker(false);
    setTimeout(() => editor.focus(), 0);
  }, [editor]);

  const applyBackgroundColor = useCallback((color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { 'background-color': color || null });
      }
    });
    setShowBgColorPicker(false);
    setTimeout(() => editor.focus(), 0);
  }, [editor]);

  const transformText = useCallback((transform: 'lowercase' | 'uppercase' | 'capitalize') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent();
        let transformedText = text;
        
        if (transform === 'lowercase') {
          transformedText = text.toLowerCase();
        } else if (transform === 'uppercase') {
          transformedText = text.toUpperCase();
        } else if (transform === 'capitalize') {
          transformedText = text.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
        }
        
        selection.insertText(transformedText);
      }
    });
    setTimeout(() => editor.focus(), 0);
  }, [editor]);

  const clearFormatting = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Remove all text formatting
        if (selection.hasFormat('bold')) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }
        if (selection.hasFormat('italic')) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }
        if (selection.hasFormat('underline')) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }
        if (selection.hasFormat('strikethrough')) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }
        if (selection.hasFormat('code')) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
        }
        if (selection.hasFormat('subscript')) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
        }
        if (selection.hasFormat('superscript')) {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
        }
        // Remove colors and font styles
        $patchStyleText(selection, { 
          color: null, 
          'background-color': null,
          'font-family': null,
          'font-size': null
        });
      }
    });
    setTimeout(() => editor.focus(), 0);
  }, [editor]);

  const applyFontFamily = useCallback((font: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { 'font-family': font });
      }
    });
    setFontFamily(font);
    setTimeout(() => editor.focus(), 0);
  }, [editor]);

  const applyFontSize = useCallback((size: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { 'font-size': size });
      }
    });
    setFontSize(size);
    setTimeout(() => editor.focus(), 0);
  }, [editor]);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-background sticky top-0 z-10" ref={toolbarRef}>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Deshacer</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Rehacer</TooltipContent>
        </Tooltip>
      
        <div className="w-px h-6 bg-border" />

        <Select
          value={fontFamily}
          onValueChange={applyFontFamily}
        >
          <SelectTrigger className="w-[160px] h-8" onMouseDown={(e) => e.preventDefault()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Courier New">Courier New</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Verdana">Verdana</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Palatino">Palatino</SelectItem>
            <SelectItem value="Garamond">Garamond</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={fontSize}
          onValueChange={applyFontSize}
        >
          <SelectTrigger className="w-[100px] h-8" onMouseDown={(e) => e.preventDefault()}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="8px">8px</SelectItem>
            <SelectItem value="10px">10px</SelectItem>
            <SelectItem value="12px">12px</SelectItem>
            <SelectItem value="14px">14px</SelectItem>
            <SelectItem value="16px">16px</SelectItem>
            <SelectItem value="18px">18px</SelectItem>
            <SelectItem value="20px">20px</SelectItem>
            <SelectItem value="24px">24px</SelectItem>
            <SelectItem value="30px">30px</SelectItem>
            <SelectItem value="36px">36px</SelectItem>
            <SelectItem value="48px">48px</SelectItem>
            <SelectItem value="60px">60px</SelectItem>
            <SelectItem value="72px">72px</SelectItem>
          </SelectContent>
        </Select>

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Insert"
          >
            <Plus className="h-4 w-4 mr-1" />
            Insertar
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onSelect={() => {
              insertHorizontalRule();
            }}
          >
            <Minus className="h-4 w-4 mr-2" />
            Línea horizontal
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setShowImageDialog(true);
            }}
          >
            <Image className="h-4 w-4 mr-2" />
            Imagen
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setShowVideoDialog(true);
            }}
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setShowEmbedDialog(true);
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Redes Sociales
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setShowTableDialog(true);
            }}
          >
            <Table className="h-4 w-4 mr-2" />
            Tabla
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

        <div className="w-px h-6 bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Negrita</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Cursiva</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Subrayado</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Tachado</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Código</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Insertar enlace</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
                setTimeout(() => editor.focus(), 0);
              }}
              className={isSubscript ? 'bg-muted' : ''}
              aria-label="Subscript"
            >
              <Subscript className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Subíndice</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
                setTimeout(() => editor.focus(), 0);
              }}
              className={isSuperscript ? 'bg-muted' : ''}
              aria-label="Superscript"
            >
              <Superscript className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Superíndice</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border" />

        <Popover open={showTextColorPicker} onOpenChange={setShowTextColorPicker}>
          <PopoverTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label="Text Color"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Color de texto</TooltipContent>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <ColorPicker value={textColor} onChange={applyTextColor} />
          </PopoverContent>
        </Popover>

        <Popover open={showBgColorPicker} onOpenChange={setShowBgColorPicker}>
          <PopoverTrigger asChild>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label="Background Color"
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Color de fondo</TooltipContent>
            </Tooltip>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <ColorPicker value={bgColor} onChange={applyBackgroundColor} />
          </PopoverContent>
        </Popover>

      <div className="w-px h-6 bg-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            aria-label="Text Transform"
          >
            <Type className="h-4 w-4" />
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem
            onSelect={() => transformText('lowercase')}
          >
            <CaseLower className="h-4 w-4 mr-2" />
            Lowercase
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => transformText('uppercase')}
          >
            <CaseUpper className="h-4 w-4 mr-2" />
            Uppercase
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => transformText('capitalize')}
          >
            <Type className="h-4 w-4 mr-2" />
            Capitalize
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => clearFormatting()}
          >
            <Eraser className="h-4 w-4 mr-2" />
            Clear Formatting
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

        <div className="w-px h-6 bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Alinear izquierda</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Centrar</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Alinear derecha</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Justificar</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Lista con viñetas</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>Lista numerada</TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onToggleFullscreen}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}</TooltipContent>
        </Tooltip>

      <LinkDialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        onConfirm={handleLinkConfirm}
      />
      <ImageDialog
        open={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onConfirm={handleImageConfirm}
      />
      <VideoDialog
        open={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        onConfirm={handleVideoConfirm}
      />
      <EmbedDialog
        open={showEmbedDialog}
        onClose={() => setShowEmbedDialog(false)}
        onConfirm={handleEmbedConfirm}
      />
        <TableDialog
          open={showTableDialog}
          onClose={() => setShowTableDialog(false)}
          onConfirm={handleTableConfirm}
        />
      </div>
    </TooltipProvider>
  );
}
