// ============================================================================
// Toggle Component
// Switch-style toggle for boolean settings
// ============================================================================

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  id,
}: ToggleProps) {
  const toggleId = id || `toggle-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? `${toggleId}-label` : undefined}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
          ${checked ? 'bg-primary' : 'bg-border'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper shadow-raised
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              id={`${toggleId}-label`}
              htmlFor={toggleId}
              className="font-sans text-ui-base font-medium text-ink cursor-pointer"
              onClick={() => onChange(!checked)}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="font-sans text-ui-sm text-muted mt-1">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
