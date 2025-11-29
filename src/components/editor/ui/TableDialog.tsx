import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface TableDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: string, columns: string) => void;
}

export default function TableDialog({ open, onClose, onConfirm }: TableDialogProps) {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);

  const handleInsert = () => {
    if (rows < 1 || columns < 1) {
      toast.error('Las filas y columnas deben ser al menos 1');
      return;
    }

    if (rows > 20 || columns > 10) {
      toast.error('Máximo 20 filas y 10 columnas');
      return;
    }

    onConfirm(String(rows), String(columns));
    handleClose();
    toast.success('Tabla insertada correctamente');
  };

  const handleClose = () => {
    setRows(3);
    setColumns(3);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Insertar Tabla</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="table-rows">Número de Filas</Label>
            <Input
              id="table-rows"
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 3)}
            />
            <p className="text-xs text-muted-foreground">Mínimo 1, máximo 20</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="table-columns">Número de Columnas</Label>
            <Input
              id="table-columns"
              type="number"
              min="1"
              max="10"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value) || 3)}
            />
            <p className="text-xs text-muted-foreground">Mínimo 1, máximo 10</p>
          </div>

          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm">
              Vista previa: Tabla de <span className="font-semibold">{rows} × {columns}</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleInsert}>
            Insertar Tabla
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
