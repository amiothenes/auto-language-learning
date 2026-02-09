// ============================================================================
// Slider Component
// Range input slider with gradient fill and value display
// ============================================================================

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  label,
  showValue = true,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="font-sans text-ui-sm font-medium text-ink">
            {label}
          </label>
          {showValue && (
            <span className="font-sans text-ui-sm text-muted">{value}%</span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-border rounded-full appearance-none cursor-pointer slider"
        style={{
          background: `linear-gradient(to right, #183A37 0%, #183A37 ${percentage}%, #E5E2DA ${percentage}%, #E5E2DA 100%)`,
        }}
      />
    </div>
  );
}
