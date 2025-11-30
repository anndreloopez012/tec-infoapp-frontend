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
import { Paintbrush, Trash2, Grid3x3, Minus } from 'lucide-react';
import ColorPicker from './ColorPicker';

interface TableActionMenuProps {
  position: { x: number; y: number } | null;
  onPaintCell: (color: string) => void;
  onPaintRow: (color: string) => void;
  onPaintColumn: (color: string) => void;
  onClearCell: () => void;
  onClearRow: () => void;
  onClearColumn: () => void;
  onSetBorderStyle: (style: string, width: string) => void;
  onSetInnerBorderStyle: (style: string, width: string) => void;
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
  position,
  onPaintCell,
  onPaintRow,
  onPaintColumn,
  onClearCell,
  onClearRow,
  onClearColumn,
  onSetBorderStyle,
  onSetInnerBorderStyle,
  onClose,
}: TableActionMenuProps) {
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  if (!position) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
      }}
    >
      <DropdownMenu open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DropdownMenuTrigger asChild>
          <div style={{ width: 0, height: 0 }} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
        {/* Paint Cell */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Paintbrush className="mr-2 h-4 w-4" />
            Pintar Celda
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            <div className="p-2">
              <div className="grid grid-cols-5 gap-2 mb-3">
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
              <ColorPicker
                value=""
                onChange={(color) => {
                  onPaintCell(color);
                  handleClose();
                }}
              />
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Paint Row */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Paintbrush className="mr-2 h-4 w-4" />
            Pintar Fila Completa
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            <div className="p-2">
              <div className="grid grid-cols-5 gap-2 mb-3">
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
              <ColorPicker
                value=""
                onChange={(color) => {
                  onPaintRow(color);
                  handleClose();
                }}
              />
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Paint Column */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Paintbrush className="mr-2 h-4 w-4" />
            Pintar Columna Completa
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-64">
            <div className="p-2">
              <div className="grid grid-cols-5 gap-2 mb-3">
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
              <ColorPicker
                value=""
                onChange={(color) => {
                  onPaintColumn(color);
                  handleClose();
                }}
              />
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

        <DropdownMenuSeparator />

        {/* Outer Borders */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Grid3x3 className="mr-2 h-4 w-4" />
            Borde Externo
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => { onSetBorderStyle('solid', '1px'); handleClose(); }}>
              Sólido Delgado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetBorderStyle('solid', '2px'); handleClose(); }}>
              Sólido Medio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetBorderStyle('solid', '3px'); handleClose(); }}>
              Sólido Grueso
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetBorderStyle('dashed', '1px'); handleClose(); }}>
              Punteado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetBorderStyle('dotted', '1px'); handleClose(); }}>
              Puntos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetBorderStyle('none', '0'); handleClose(); }}>
              Sin Borde
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Inner Borders */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Minus className="mr-2 h-4 w-4" />
            Bordes Internos
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => { onSetInnerBorderStyle('solid', '1px'); handleClose(); }}>
              Sólido Delgado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetInnerBorderStyle('solid', '2px'); handleClose(); }}>
              Sólido Medio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetInnerBorderStyle('solid', '3px'); handleClose(); }}>
              Sólido Grueso
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetInnerBorderStyle('dashed', '1px'); handleClose(); }}>
              Punteado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetInnerBorderStyle('dotted', '1px'); handleClose(); }}>
              Puntos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onSetInnerBorderStyle('none', '0'); handleClose(); }}>
              Sin Bordes
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
    </div>
  );
}
