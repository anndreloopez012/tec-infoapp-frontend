import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { $getSelection, $isRangeSelection, $getNodeByKey } from 'lexical';

import { TableCellNode } from '@lexical/table';
import TableActionMenu from '../ui/TableActionMenu';
import { createPortal } from 'react-dom';

export default function TableActionPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [currentCell, setCurrentCell] = useState<HTMLTableCellElement | null>(null);

  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const cellElement = target.closest('td, th') as HTMLTableCellElement;
      
      if (!cellElement) return;

      // Check if it's within our editor
      const editorElement = editor.getRootElement();
      if (!editorElement?.contains(cellElement)) return;

      event.preventDefault();
      event.stopPropagation();

      setCurrentCell(cellElement);
      setMenuPosition({ x: event.clientX, y: event.clientY });
    };

    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener('contextmenu', handleContextMenu);
      return () => {
        editorElement.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [editor]);

  const paintCell = (color: string) => {
    if (!currentCell) return;
    editor.update(() => {
      currentCell.style.backgroundColor = color;
      currentCell.dataset.bgColor = color;

      const key = currentCell.getAttribute('data-lexical-node');
      if (key) {
        const cellNode = $getNodeByKey(key);
        if (cellNode instanceof TableCellNode) {
          (cellNode as any).__backgroundColor = color;
        }
      }
    });
    closeMenu();
  };

  const paintRow = (color: string) => {
    if (!currentCell) return;
    const row = currentCell.parentElement as HTMLTableRowElement;
    if (!row) return;

    editor.update(() => {
      const cells = Array.from(row.cells);
      cells.forEach((cell) => {
        const htmlCell = cell as HTMLTableCellElement;
        htmlCell.style.backgroundColor = color;
        htmlCell.dataset.bgColor = color;

        const key = htmlCell.getAttribute('data-lexical-node');
        if (key) {
          const cellNode = $getNodeByKey(key);
          if (cellNode instanceof TableCellNode) {
            (cellNode as any).__backgroundColor = color;
          }
        }
      });
    });
    closeMenu();
  };

  const paintColumn = (color: string) => {
    if (!currentCell) return;
    const table = currentCell.closest('table');
    if (!table) return;

    const colIndex = currentCell.cellIndex;
    const rows = Array.from(table.rows);
    
    editor.update(() => {
      rows.forEach((row) => {
        const cell = row.cells[colIndex] as HTMLTableCellElement | undefined;
        if (cell) {
          cell.style.backgroundColor = color;
          cell.dataset.bgColor = color;

          const key = cell.getAttribute('data-lexical-node');
          if (key) {
            const cellNode = $getNodeByKey(key);
            if (cellNode instanceof TableCellNode) {
              (cellNode as any).__backgroundColor = color;
            }
          }
        }
      });
    });
    closeMenu();
  };

  const clearCell = () => {
    if (!currentCell) return;
    editor.update(() => {
      currentCell.style.backgroundColor = '';
      delete currentCell.dataset.bgColor;

      const key = currentCell.getAttribute('data-lexical-node');
      if (key) {
        const cellNode = $getNodeByKey(key);
        if (cellNode instanceof TableCellNode) {
          (cellNode as any).__backgroundColor = '';
        }
      }
    });
    closeMenu();
  };

  const clearRow = () => {
    if (!currentCell) return;
    const row = currentCell.parentElement as HTMLTableRowElement;
    if (!row) return;

    editor.update(() => {
      const cells = Array.from(row.cells);
      cells.forEach((cell) => {
        const htmlCell = cell as HTMLTableCellElement;
        htmlCell.style.backgroundColor = '';
        delete htmlCell.dataset.bgColor;

        const key = htmlCell.getAttribute('data-lexical-node');
        if (key) {
          const cellNode = $getNodeByKey(key);
          if (cellNode instanceof TableCellNode) {
            (cellNode as any).__backgroundColor = '';
          }
        }
      });
    });
    closeMenu();
  };

  const clearColumn = () => {
    if (!currentCell) return;
    const table = currentCell.closest('table');
    if (!table) return;

    const colIndex = currentCell.cellIndex;
    const rows = Array.from(table.rows);
    
    editor.update(() => {
      rows.forEach((row) => {
        const cell = row.cells[colIndex] as HTMLTableCellElement | undefined;
        if (cell) {
          cell.style.backgroundColor = '';
          delete cell.dataset.bgColor;

          const key = cell.getAttribute('data-lexical-node');
          if (key) {
            const cellNode = $getNodeByKey(key);
            if (cellNode instanceof TableCellNode) {
              (cellNode as any).__backgroundColor = '';
            }
          }
        }
      });
    });
    closeMenu();
  };

  const setBorderStyle = (style: string, width: string) => {
    if (!currentCell) return;
    const table = currentCell.closest('table');
    if (!table) return;

    editor.update(() => {
      if (style === 'none') {
        table.style.border = 'none';
        table.dataset.borderStyle = 'none';
      } else {
        table.style.border = `${width} ${style} hsl(var(--border))`;
        table.dataset.borderStyle = style;
        table.dataset.borderWidth = width;
      }
    });
    closeMenu();
  };

  const setInnerBorderStyle = (style: string, width: string) => {
    if (!currentCell) return;
    const table = currentCell.closest('table');
    if (!table) return;

    editor.update(() => {
      const cells = table.querySelectorAll('td, th');
      cells.forEach((cell) => {
        const htmlCell = cell as HTMLTableCellElement;
        if (style === 'none') {
          htmlCell.style.border = 'none';
          htmlCell.dataset.borderStyle = 'none';
        } else {
          htmlCell.style.border = `${width} ${style} hsl(var(--border))`;
          htmlCell.dataset.borderStyle = style;
          htmlCell.dataset.borderWidth = width;
        }
      });
    });
    closeMenu();
  };

  const closeMenu = () => {
    setMenuPosition(null);
    setCurrentCell(null);
  };

  if (!menuPosition) return null;

  return createPortal(
    <TableActionMenu
      position={menuPosition}
      onPaintCell={paintCell}
      onPaintRow={paintRow}
      onPaintColumn={paintColumn}
      onClearCell={clearCell}
      onClearRow={clearRow}
      onClearColumn={clearColumn}
      onSetBorderStyle={setBorderStyle}
      onSetInnerBorderStyle={setInnerBorderStyle}
      onClose={closeMenu}
    />,
    document.body
  );
}
