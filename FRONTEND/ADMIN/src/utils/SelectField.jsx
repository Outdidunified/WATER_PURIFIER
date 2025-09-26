import React from 'react';
import Select from 'react-select';

const SelectField = ({
  value,
  onChange,
  options,
  placeholder = '',
  required = false,
  isDisabled = false,
  className = 'form-control',
  ...props
}) => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      border: '1px solid #ced4da',
      borderRadius: '0 0.375rem 0.375rem 0', // match input group right side
      height: '38px', // fixed to Bootstrap input height
      minHeight: '38px',
      fontSize: '1rem',
      fontFamily: 'inherit',
      backgroundColor: '#fff',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
      '&:hover': {
        borderColor: state.isFocused ? '#80bdff' : '#ced4da'
      },
      width: '100%', // Use 100% width within the wrapper
      flex: '1 1 auto', // Grow and shrink flexibly
      display: 'flex',
      alignItems: 'center', // vertical center
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 0.75rem', // same as Bootstrap inputs
      height: '38px',
      display: 'flex',
      alignItems: 'center',
    }),
    input: (provided) => ({
      ...provided,
      fontSize: '1rem',
      padding: 0,
      margin: 0,
      height: 'auto',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d',
      fontSize: '1rem'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#495057',
      fontSize: '1rem'
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      display: 'none'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#6c757d',
      '&:hover': {
        color: '#495057'
      }
    }),
    menu: (provided) => ({
      ...provided,
      border: '1px solid #ced4da',
      borderRadius: '0.375rem',
      boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
      zIndex: 9999
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : 'white',
      color: state.isSelected ? 'white' : '#495057',
      padding: '0.375rem 0.75rem',
      cursor: 'pointer'
    })
  };

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      isDisabled={isDisabled}
      styles={customStyles}
      className={className}
      required={required}
      {...props}
    />
  );
};

export default SelectField;