import React from 'react';
import Select from 'react-select';

const SelectField = ({
  value,
  onChange,
  options,
  placeholder = '',
  required = false,
  isDisabled = false,
  className = '',
  dropdownWidth = '200px', // width of the dropdown menu
  ...props
}) => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      border: '1px solid #ced4da',
      borderRadius: '8px',
      minHeight: '38px',
      fontSize: '1rem',
      fontFamily: 'inherit',
      backgroundColor: '#fff',
      boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,0.25)' : 'none',
      borderColor: state.isFocused ? '#80bdff' : '#ced4da',
      width: '100%', // full width input box
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '0 0.75rem',
      height: '38px',
      display: 'flex',
      alignItems: 'center',
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
      fontSize: '1rem',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d',
      fontSize: '1rem',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#495057',
      fontSize: '1rem',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: '#6c757d',
      '&:hover': { color: '#495057' },
    }),
    menu: (provided) => ({
      ...provided,
      border: '1px solid #ced4da',
      borderRadius: '8px',
      boxShadow: '0 0.5rem 1rem rgba(0,0,0,0.15)',
      zIndex: 9999,
      width: dropdownWidth, // narrower menu
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
      width: dropdownWidth, // narrower menu portal
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#007bff' : state.isFocused ? '#f8f9fa' : '#fff',
      color: state.isSelected ? '#fff' : '#495057',
      padding: '8px 12px',
      cursor: 'pointer',
    }),
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
      menuPortalTarget={document.body} // ensures dropdown is on top
      menuPosition="fixed"
      {...props}
    />
  );
};

export default SelectField;
