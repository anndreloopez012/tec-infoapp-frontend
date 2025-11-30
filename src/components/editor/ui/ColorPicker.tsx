import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#92400E',
  '#84CC16', '#16A34A', '#A855F7', '#7C3AED',
  '#3B82F6', '#06B6D4', '#A7F3D0', '#000000',
  '#6B7280', '#9CA3AF', '#D1D5DB', '#FFFFFF',
];

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [hexValue, setHexValue] = useState(value);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexValue(newValue);
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handlePresetClick = (color: string) => {
    setHexValue(color);
    onChange(color);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium mb-1 block">Color Personalizado</label>
        <Input
          type="text"
          value={hexValue}
          onChange={handleHexChange}
          placeholder="#000000"
          className="font-mono text-sm h-8"
        />
      </div>
      
      <div className="grid grid-cols-8 gap-1.5">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => handlePresetClick(color)}
            className="w-6 h-6 rounded border-2 border-border hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setHexValue('');
          onChange('');
        }}
        className="w-full h-7 text-xs"
      >
        Limpiar
      </Button>
    </div>
  );
}
