import React, { useState } from 'react';
import SearchStatusCheckboxes from './SearchStatusCheckboxes';

const SearchStatusCheckboxesDemo = () => {
  const [selectedValues, setSelectedValues] = useState([]);

  const options = [
    { value: 'Семейная пара(М+Ж)', label: 'Семейную пару(М+Ж)' },
    { value: 'Несемейная пара(М+Ж)', label: 'Несемейную пару(М+Ж)' },
    { value: 'Мужчина', label: 'Мужчину' },
    { value: 'Женщина', label: 'Женщину' }
  ];

  const handleChange = (newValues) => {
    console.log('Изменение:', newValues);
    setSelectedValues(newValues);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Демо компонента SearchStatusCheckboxes</h2>
      <p><strong>Выбранные значения:</strong> {selectedValues.join(', ') || 'Ничего не выбрано'}</p>
      <p><strong>Строка для отправки:</strong> {selectedValues.join('&&') || 'Пусто'}</p>
      <p><strong>Количество выбранных:</strong> {selectedValues.length}</p>
      
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
          Кого ищете? <span style={{ color: 'red' }}>*</span>
        </label>
        <SearchStatusCheckboxes
          options={options}
          selectedValues={selectedValues}
          onChange={handleChange}
          error={selectedValues.length === 0 ? 'Выберите кого ищете' : null}
        />
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => setSelectedValues([])}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3522',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Сбросить выбор
        </button>
      </div>
    </div>
  );
};

export default SearchStatusCheckboxesDemo;
