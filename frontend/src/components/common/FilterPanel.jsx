import { useState } from 'react';
import { Filter, X, ChevronDown, RotateCcw, Search } from 'lucide-react';
import Button from './Button';

/**
 * FilterPanel - Horizontal filter bar component
 */
export default function FilterPanel({
  filters = [],
  values = {},
  onChange,
  onApply,
  onReset,
  isLoading = false,
  showSearch = true,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  const activeFilterCount = Object.entries(values).filter(([key, val]) => {
    if (key === 'search') return val && val.length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return val !== null && val !== '' && val !== undefined;
  }).length;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-accent-400" />
          <span className="font-medium text-white">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-accent-500/20 text-accent-400 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
          {/* Search */}
          {showSearch && (
            <div className="pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, customer, or keyword..."
                  value={values.search || ''}
                  onChange={(e) => handleChange('search', e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
          )}

          {/* Filter Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 py-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {filter.label}
                </label>
                {filter.type === 'select' && (
                  <select
                    value={values[filter.key] || ''}
                    onChange={(e) => handleChange(filter.key, e.target.value || null)}
                    className="select text-sm"
                  >
                    <option value="">All {filter.label}</option>
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {filter.type === 'multiselect' && (
                  <MultiSelect
                    options={filter.options}
                    value={values[filter.key] || []}
                    onChange={(val) => handleChange(filter.key, val)}
                    placeholder={`Select ${filter.label}`}
                  />
                )}
                {filter.type === 'range' && (
                  <select
                    value={values[filter.key] || ''}
                    onChange={(e) => handleChange(filter.key, e.target.value || null)}
                    className="select text-sm"
                  >
                    <option value="">Any</option>
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
            <button
              onClick={onReset}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Filters
            </button>
            <Button
              variant="primary"
              onClick={onApply}
              isLoading={isLoading}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * MultiSelect - Dropdown with multiple selection
 */
function MultiSelect({ options, value = [], onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (optValue) => {
    if (value.includes(optValue)) {
      onChange(value.filter(v => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const selectedLabels = value
    .map(v => options.find(o => o.value === v)?.label)
    .filter(Boolean);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-left flex items-center justify-between hover:border-slate-600 transition-colors"
      >
        <span className={value.length > 0 ? 'text-white' : 'text-slate-500'}>
          {value.length > 0 ? `${value.length} selected` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleOption(opt.value)}
                className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-slate-700/50 transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  value.includes(opt.value) 
                    ? 'bg-accent-500 border-accent-500' 
                    : 'border-slate-600'
                }`}>
                  {value.includes(opt.value) && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-slate-300">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.slice(0, 2).map((label, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent-500/20 text-accent-400 rounded"
            >
              {label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const optValue = options.find(o => o.label === label)?.value;
                  if (optValue) toggleOption(optValue);
                }}
                className="hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedLabels.length > 2 && (
            <span className="px-2 py-0.5 text-xs text-slate-400">
              +{selectedLabels.length - 2} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
