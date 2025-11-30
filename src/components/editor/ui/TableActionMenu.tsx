import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Paintbrush, Trash2 } from 'lucide-react';

interface TableActionMenuProps {
  anchorElement: HTMLElement | null;
  onPaintCell: (color: string) => void;
  onPaintRow: (color: string) => void;
  onPaintColumn: (color: string) => void;
  onClearCell: () => void;
  onClearRow: () => void;
  onClearColumn: () => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'Rojo', value: '#fee2e2' },
  { name: 'Naranja', value: '#fed7aa' },
  { name: 'Amarillo', value: '#fef3c7' },
  { name: 'Verde', value: '#d1fae5' },
  { name: 'Azul', value: '#dbeafe' },
  { name: 'Índigo', value: '#e0e7ff' },
  { name: 'Morado', value: '#f3e8ff' },
  { name: 'Rosa', value: '#fce7f3' },
  { name: 'Gris', value: '#f3f4f6' },
  { name: 'Oscuro', value: '#e5e7eb' },
];

export default function TableActionMenu({
  anchorElement,
  onPaintCell,
  onPaintRow,
  onPaintColumn,
  onClearCell,
  onClearRow,
  onClearColumn,
  onClose,
}: TableActionMenuProps) {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  if (!anchorElement) return null;

  return (
    <DropdownMenu open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DropdownMenuTrigger asChild>
        <div
          style={{
            position: 'absolute',
            left: anchorElement.offsetLeft,
            top: anchorElement.offsetTop,
            width: 0,
            height: 0,
          }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* Paint Cell */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Paintbrush className="mr-2 h-4 w-4" />
            Pintar Celda
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <div className="grid grid-cols-5 gap-2 p-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    onPaintCell(color.value);
                    handleClose();
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Paint Row */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Paintbrush className="mr-2 h-4 w-4" />
            Pintar Fila Completa
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <div className="grid grid-cols-5 gap-2 p-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    onPaintRow(color.value);
                    handleClose();
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Paint Column */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Paintbrush className="mr-2 h-4 w-4" />
            Pintar Columna Completa
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <div className="grid grid-cols-5 gap-2 p-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  className="w-8 h-8 rounded border-2 border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: color.value }}
                  onClick={() => {
                    onPaintColumn(color.value);
                    handleClose();
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Clear Cell */}
        <DropdownMenuItem onClick={() => { onClearCell(); handleClose(); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpiar Celda
        </DropdownMenuItem>

        {/* Clear Row */}
        <DropdownMenuItem onClick={() => { onClearRow(); handleClose(); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpiar Fila
        </DropdownMenuItem>

        {/* Clear Column */}
        <DropdownMenuItem onClick={() => { onClearColumn(); handleClose(); }}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpiar Columna
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
