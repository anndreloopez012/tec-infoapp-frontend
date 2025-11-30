import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getNodeByKey, COMMAND_PRIORITY_LOW, LexicalEditor } from 'lexical';
import { $isTableNode, TableNode } from '@lexical/table';

export default function TableResizePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerMutationListener(TableNode, (mutatedNodes) => {
      for (const [nodeKey, mutation] of mutatedNodes) {
        if (mutation === 'created' || mutation === 'updated') {
          setTimeout(() => {
            editor.getEditorState().read(() => {
              const node = $getNodeByKey(nodeKey);
              if ($isTableNode(node)) {
                const element = editor.getElementByKey(nodeKey);
                if (element) {
                  addResizeHandles(element as HTMLTableElement, nodeKey, editor);
                }
              }
            });
          }, 0);
        }
      }
    });
  }, [editor]);

  return null;
}

function addResizeHandles(
  tableElement: HTMLTableElement,
  nodeKey: string,
  editor: LexicalEditor
): void {
  // Check if already wrapped
  if (tableElement.parentElement?.classList.contains('table-wrapper-with-resize')) {
    return;
  }

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'table-wrapper-with-resize';
  wrapper.style.cssText = `
    position: relative;
    display: inline-block;
    margin: 20px 0;
    max-width: 100%;
  `;

  // Move table into wrapper
  tableElement.parentNode?.insertBefore(wrapper, tableElement);
  wrapper.appendChild(tableElement);

  // Restore saved styles
  if (tableElement.dataset.width) {
    tableElement.style.width = tableElement.dataset.width;
  } else if (!tableElement.style.width) {
    const rect = tableElement.getBoundingClientRect();
    tableElement.style.width = `${rect.width}px`;
  }
  
  if (tableElement.dataset.height) {
    tableElement.style.height = tableElement.dataset.height;
  }

  // Restore border styles
  if (tableElement.dataset.borderStyle && tableElement.dataset.borderStyle !== 'none') {
    const borderWidth = tableElement.dataset.borderWidth || '1px';
    tableElement.style.border = `${borderWidth} ${tableElement.dataset.borderStyle} hsl(var(--border))`;
  }

  // Restore cell colors and borders
  const cells = tableElement.querySelectorAll('td, th');
  cells.forEach((cell) => {
    const htmlCell = cell as HTMLTableCellElement;
    if (htmlCell.dataset.bgColor) {
      htmlCell.style.backgroundColor = htmlCell.dataset.bgColor;
    }
    if (htmlCell.dataset.borderStyle && htmlCell.dataset.borderStyle !== 'none') {
      const borderWidth = htmlCell.dataset.borderWidth || '1px';
      htmlCell.style.border = `${borderWidth} ${htmlCell.dataset.borderStyle} hsl(var(--border))`;
    }
  });

  // Create resize handles
  const positions = [
    { name: 'se', cursor: 'nwse-resize', position: 'bottom: -5px; right: -5px;' },
    { name: 'sw', cursor: 'nesw-resize', position: 'bottom: -5px; left: -5px;' },
    { name: 'e', cursor: 'ew-resize', position: 'top: 50%; right: -5px; transform: translateY(-50%);' },
    { name: 's', cursor: 'ns-resize', position: 'bottom: -5px; left: 50%; transform: translateX(-50%);' },
  ];

  positions.forEach((config) => {
    const handle = document.createElement('div');
    handle.className = `table-resize-handle table-resize-handle-${config.name}`;
    handle.style.cssText = `
      position: absolute;
      width: 12px;
      height: 12px;
      background: hsl(var(--primary));
      border: 2px solid hsl(var(--background));
      border-radius: 50%;
      cursor: ${config.cursor};
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 10;
      ${config.position}
    `;

    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      startX = e.clientX;
      startY = e.clientY;
      const rect = tableElement.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;

      const onMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        // Calculate new dimensions based on handle
        if (config.name.includes('e')) {
          newWidth = Math.max(200, startWidth + deltaX);
        } else if (config.name.includes('w')) {
          newWidth = Math.max(200, startWidth - deltaX);
        }

        if (config.name.includes('s')) {
          newHeight = Math.max(100, startHeight + deltaY);
        } else if (config.name.includes('n')) {
          newHeight = Math.max(100, startHeight - deltaY);
        }

        tableElement.style.width = `${newWidth}px`;
        if (config.name.includes('s') || config.name.includes('n')) {
          tableElement.style.height = `${newHeight}px`;
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        
        // Save dimensions to dataset in an editor update
        editor.update(() => {
          tableElement.dataset.width = tableElement.style.width;
          tableElement.dataset.height = tableElement.style.height || '';
        });
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = config.cursor;
    };

    handle.addEventListener('mousedown', onMouseDown);
    wrapper.appendChild(handle);
  });

  // Show/hide handles on hover
  const showHandles = () => {
    const handles = wrapper.querySelectorAll('.table-resize-handle');
    handles.forEach((h) => ((h as HTMLElement).style.opacity = '1'));
  };

  const hideHandles = () => {
    const handles = wrapper.querySelectorAll('.table-resize-handle');
    handles.forEach((h) => ((h as HTMLElement).style.opacity = '0'));
  };

  wrapper.addEventListener('mouseenter', showHandles);
  wrapper.addEventListener('mouseleave', hideHandles);
}
