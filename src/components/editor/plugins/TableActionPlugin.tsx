import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { $getSelection, $isRangeSelection } from 'lexical';
import TableActionMenu from '../ui/TableActionMenu';
import { createPortal } from 'react-dom';

export default function TableActionPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
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
      setMenuAnchor(cellElement);
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
    currentCell.style.backgroundColor = color;
    currentCell.dataset.bgColor = color;
    closeMenu();
  };

  const paintRow = (color: string) => {
    if (!currentCell) return;
    const row = currentCell.parentElement as HTMLTableRowElement;
    if (!row) return;

    const cells = Array.from(row.cells);
    cells.forEach((cell) => {
      cell.style.backgroundColor = color;
      cell.dataset.bgColor = color;
    });
    closeMenu();
  };

  const paintColumn = (color: string) => {
    if (!currentCell) return;
    const table = currentCell.closest('table');
    if (!table) return;

    const colIndex = currentCell.cellIndex;
    const rows = Array.from(table.rows);
    
    rows.forEach((row) => {
      const cell = row.cells[colIndex];
      if (cell) {
        cell.style.backgroundColor = color;
        cell.dataset.bgColor = color;
      }
    });
    closeMenu();
  };

  const clearCell = () => {
    if (!currentCell) return;
    currentCell.style.backgroundColor = '';
    delete currentCell.dataset.bgColor;
    closeMenu();
  };

  const clearRow = () => {
    if (!currentCell) return;
    const row = currentCell.parentElement as HTMLTableRowElement;
    if (!row) return;

    const cells = Array.from(row.cells);
    cells.forEach((cell) => {
      cell.style.backgroundColor = '';
      delete cell.dataset.bgColor;
    });
    closeMenu();
  };

  const clearColumn = () => {
    if (!currentCell) return;
    const table = currentCell.closest('table');
    if (!table) return;

    const colIndex = currentCell.cellIndex;
    const rows = Array.from(table.rows);
    
    rows.forEach((row) => {
      const cell = row.cells[colIndex];
      if (cell) {
        cell.style.backgroundColor = '';
        delete cell.dataset.bgColor;
      }
    });
    closeMenu();
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setCurrentCell(null);
  };

  if (!menuAnchor) return null;

  return createPortal(
    <TableActionMenu
      anchorElement={menuAnchor}
      onPaintCell={paintCell}
      onPaintRow={paintRow}
      onPaintColumn={paintColumn}
      onClearCell={clearCell}
      onClearRow={clearRow}
      onClearColumn={clearColumn}
      onClose={closeMenu}
    />,
    document.body
  );
}
