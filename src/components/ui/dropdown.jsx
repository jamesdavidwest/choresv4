// src/components/ui/dropdown.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from 'lucide-react';

export const Dropdown = ({ 
  options, 
  selectedValue, 
  onSelect, 
  placeholder = 'Select...',
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.id === selectedValue) || { name: placeholder };

  return (
    <div className={`relative w-full ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 
          bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-between"
      >
        <span>{selectedOption.name}</span>
        <ChevronDown className="h-4 w-4 ml-2" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full text-left py-2 px-4 hover:bg-slate-700 transition-colors duration-200 
                ${selectedValue === option.id 
                  ? 'bg-blue-500 text-white' 
                  : 'text-slate-300'
                }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

Dropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedValue: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string
};
