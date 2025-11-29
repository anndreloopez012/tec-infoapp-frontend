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
} from 'lexical';
import { useState } from 'react';

export interface VideoPayload {
  src: string;
  type: 'youtube' | 'upload';
  key?: NodeKey;
  width?: number;
  height?: number;
}

export type SerializedVideoNode = Spread<
  {
    src: string;
    type: 'youtube' | 'upload';
    width?: number;
    height?: number;
  },
  SerializedLexicalNode
>;

function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function VideoComponent({ 
  src, 
  type, 
  width = 560, 
  height = 315,
  nodeKey 
}: { 
  src: string; 
  type: 'youtube' | 'upload'; 
  width?: number; 
  height?: number;
  nodeKey: NodeKey;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({ width, height });

  const handleResize = (e: React.MouseEvent, direction: 'width' | 'height' | 'both') => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      setDimensions({
        width: direction === 'width' || direction === 'both' ? Math.max(200, startWidth + deltaX) : startWidth,
        height: direction === 'height' || direction === 'both' ? Math.max(150, startHeight + deltaY) : startHeight,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const embedSrc = type === 'youtube' ? getYouTubeEmbedUrl(src) : src;

  return (
    <div 
      className="relative inline-block group my-4"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {type === 'youtube' ? (
        <iframe
          src={embedSrc}
          width={dimensions.width}
          height={dimensions.height}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg"
        />
      ) : (
        <video
          src={src}
          controls
          width={dimensions.width}
          height={dimensions.height}
          className="rounded-lg"
        />
      )}
      
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
        <div className="absolute top-2 left-2 bg-black/75 text-white px-2 py-1 rounded text-xs">
          {dimensions.width} × {dimensions.height}
        </div>
      )}
    </div>
  );
}

export class VideoNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __videoType: 'youtube' | 'upload';
  __width: number;
  __height: number;

  static getType(): string {
    return 'video';
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(node.__src, node.__videoType, node.__width, node.__height, node.__key);
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    const { src, type, width, height } = serializedNode;
    return $createVideoNode({ src, type, width, height });
  }

  exportJSON(): SerializedVideoNode {
    return {
      src: this.__src,
      type: this.__videoType,
      width: this.__width,
      height: this.__height,
      version: 1,
    };
  }

  constructor(src: string, type: 'youtube' | 'upload', width = 560, height = 315, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__videoType = type;
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
      <VideoComponent 
        src={this.__src} 
        type={this.__videoType} 
        width={this.__width}
        height={this.__height}
        nodeKey={this.__key}
      />
    );
  }
}

export function $createVideoNode({ src, type, width, height, key }: VideoPayload): VideoNode {
  return new VideoNode(src, type, width, height, key);
}

export function $isVideoNode(node: LexicalNode | null | undefined): node is VideoNode {
  return node instanceof VideoNode;
}
