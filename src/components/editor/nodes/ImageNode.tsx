import {
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  $getNodeByKey,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as React from 'react';

export interface ImagePayload {
  altText: string;
  src: string;
  key?: NodeKey;
  width?: number;
  height?: number;
  maxWidth?: number;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    src: string;
    width?: number;
    height?: number;
    maxWidth?: number;
  },
  SerializedLexicalNode
>;

function convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode;
    const node = $createImageNode({ altText, src, width, height });
    return { node };
  }
  return null;
}

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;
  __maxWidth?: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__maxWidth,
      node.__key
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, src, width, height, maxWidth } = serializedNode;
    return $createImageNode({
      altText,
      src,
      width,
      height,
      maxWidth,
    });
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width) element.setAttribute('width', this.__width.toString());
    if (this.__height) element.setAttribute('height', this.__height.toString());
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    maxWidth?: number,
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__maxWidth = maxWidth || 800;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      src: this.getSrc(),
      width: this.__width,
      height: this.__height,
      maxWidth: this.__maxWidth,
      type: 'image',
      version: 1,
    };
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  setWidthAndHeight(width: number, height: number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        nodeKey={this.__key}
      />
    );
  }
}

function ImageComponent({
  src,
  altText,
  width,
  height,
  maxWidth = 800,
  nodeKey,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  maxWidth?: number;
  nodeKey: NodeKey;
}) {
  const [isResizing, setIsResizing] = React.useState(false);
  const [dimensions, setDimensions] = React.useState({
    width: width || maxWidth,
    height: height || 0,
  });
  const [editor] = useLexicalComposerContext();
  const isEditable = editor.isEditable();

  const handleResize = (
    e: React.MouseEvent,
    direction: 'width' | 'height' | 'both'
  ) => {
    if (!editor.isEditable()) return;
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;
    let newWidth = startWidth;
    let newHeight = startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      newWidth =
        direction === 'width' || direction === 'both'
          ? Math.max(100, startWidth + deltaX)
          : startWidth;
      newHeight =
        direction === 'height' || direction === 'both'
          ? Math.max(50, startHeight + deltaY)
          : startHeight;

      setDimensions({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Persist dimensions into Lexical node
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof ImageNode) {
          node.setWidthAndHeight(newWidth, newHeight || 0);
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className="relative inline-block group my-4"
      style={{
        maxWidth: maxWidth ? `${maxWidth}px` : '100%',
        width: dimensions.width ? `${dimensions.width}px` : 'auto',
      }}
    >
      <img
        src={src}
        alt={altText}
        style={{
          width: '100%',
          height: dimensions.height ? `${dimensions.height}px` : 'auto',
          display: 'block',
          borderRadius: '0.5rem',
        }}
      />
      {isEditable && (
        <>
          {/* Resize handles */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-tl cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleResize(e, 'both')}
          />
          <div
            className="absolute bottom-0 left-1/2 w-8 h-2 bg-primary rounded-t cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
            onMouseDown={(e) => handleResize(e, 'height')}
          />
          <div
            className="absolute right-0 top-1/2 w-2 h-8 bg-primary rounded-l cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2"
            onMouseDown={(e) => handleResize(e, 'width')}
          />

          {/* Dimensions display */}
          {isResizing && (
            <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs z-10">
              {dimensions.width} × {dimensions.height}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function $createImageNode({
  altText,
  src,
  width,
  height,
  maxWidth,
  key,
}: ImagePayload): ImageNode {
  return new ImageNode(src, altText, width, height, maxWidth, key);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
