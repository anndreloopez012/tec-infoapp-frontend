import {
  DecoratorNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  $getNodeByKey,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState } from 'react';

export interface EmbedPayload {
  url: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  key?: NodeKey;
  width?: number;
  height?: number;
}

export type SerializedEmbedNode = Spread<
  {
    url: string;
    platform: 'instagram' | 'facebook' | 'twitter';
    width?: number;
    height?: number;
  },
  SerializedLexicalNode
>;

function getEmbedCode(url: string, platform: string, width: number, height: number): string {
  switch (platform) {
    case 'instagram':
      return `<iframe src="${url.replace('/p/', '/embed/p/')}" width="${width}" height="${height}" frameborder="0" scrolling="no" allowtransparency="true"></iframe>`;
    case 'facebook':
      return `<iframe src="https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=${width}&height=${height}" width="${width}" height="${height}" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>`;
    case 'twitter':
      const tweetId = url.split('/status/')[1]?.split('?')[0];
      return `<iframe src="https://platform.twitter.com/embed/Tweet.html?id=${tweetId}" width="${width}" height="${height}" frameborder="0"></iframe>`;
    default:
      return '';
  }
}

function EmbedComponent({ 
  url, 
  platform, 
  width = 500, 
  height = 600,
  nodeKey 
}: { 
  url: string; 
  platform: 'instagram' | 'facebook' | 'twitter'; 
  width?: number; 
  height?: number;
  nodeKey: NodeKey;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({ width, height });
  const [editor] = useLexicalComposerContext();

  const handleResize = (e: React.MouseEvent, direction: 'width' | 'height' | 'both') => {
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
      
      newWidth = direction === 'width' || direction === 'both' ? Math.max(300, startWidth + deltaX) : startWidth;
      newHeight = direction === 'height' || direction === 'both' ? Math.max(400, startHeight + deltaY) : startHeight;

      setDimensions({
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof EmbedNode) {
          node.setDimensions(newWidth, newHeight);
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const embedCode = getEmbedCode(url, platform, dimensions.width, dimensions.height);

  return (
    <div 
      className="relative inline-block group my-4"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <div 
        dangerouslySetInnerHTML={{ __html: embedCode }}
        style={{ width: dimensions.width, height: dimensions.height }}
      />
      
      {/* Resize handles */}
      <div className="absolute bottom-0 right-0 w-4 h-4 bg-primary rounded-tl cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => handleResize(e, 'both')}
      />
      <div className="absolute bottom-0 left-1/2 w-8 h-2 bg-primary rounded-t cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
        onMouseDown={(e) => handleResize(e, 'height')}
      />
      <div className="absolute right-0 top-1/2 w-2 h-8 bg-primary rounded-l cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity -translate-y-1/2"
        onMouseDown={(e) => handleResize(e, 'width')}
      />
      
      {/* Dimensions display */}
      {isResizing && (
        <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs z-10">
          {dimensions.width} × {dimensions.height}
        </div>
      )}
    </div>
  );
}

export class EmbedNode extends DecoratorNode<JSX.Element> {
  __url: string;
  __platform: 'instagram' | 'facebook' | 'twitter';
  __width: number;
  __height: number;

  static getType(): string {
    return 'embed';
  }

  static clone(node: EmbedNode): EmbedNode {
    return new EmbedNode(node.__url, node.__platform, node.__width, node.__height, node.__key);
  }

  static importJSON(serializedNode: SerializedEmbedNode): EmbedNode {
    const { url, platform, width, height } = serializedNode;
    return $createEmbedNode({ url, platform, width, height });
  }

  exportJSON(): SerializedEmbedNode {
    return {
      url: this.__url,
      platform: this.__platform,
      width: this.__width,
      height: this.__height,
      type: 'embed',
      version: 1,
    };
  }

  constructor(url: string, platform: 'instagram' | 'facebook' | 'twitter', width = 500, height = 600, key?: NodeKey) {
    super(key);
    this.__url = url;
    this.__platform = platform;
    this.__width = width;
    this.__height = height;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.style.display = 'inline-block';
    return div;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <EmbedComponent 
        url={this.__url} 
        platform={this.__platform} 
        width={this.__width}
        height={this.__height}
        nodeKey={this.__key}
      />
    );
  }
}

export function $createEmbedNode({ url, platform, width, height, key }: EmbedPayload): EmbedNode {
  return new EmbedNode(url, platform, width, height, key);
}

export function $isEmbedNode(node: LexicalNode | null | undefined): node is EmbedNode {
  return node instanceof EmbedNode;
}
