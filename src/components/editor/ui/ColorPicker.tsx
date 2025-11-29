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
    <div className="w-64 p-4 space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Hex</label>
        <Input
          type="text"
          value={hexValue}
          onChange={handleHexChange}
          placeholder="#000000"
          className="font-mono"
        />
      </div>
      
      <div className="grid grid-cols-8 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handlePresetClick(color)}
            className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
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
        className="w-full"
      >
        Limpiar Color
      </Button>
    </div>
  );
}
