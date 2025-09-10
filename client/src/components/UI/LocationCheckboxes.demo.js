import React, { useState } from 'react';
import LocationCheckboxes from './LocationCheckboxes';

const LocationCheckboxesDemo = () => {
  const [selectedValues, setSelectedValues] = useState([]);

  const options = [
    { value: 'У себя дома (пригласим к себе)', label: 'У себя дома (пригласим к себе)' },
    { value: 'У вас дома (примем приглашение)', label: 'У вас дома (примем приглашение)' },
    { value: 'В свинг-клубе или на закрытой вечеринке', label: 'В свинг-клубе или на закрытой вечеринке' },
    { value: 'В сауне', label: 'В сауне' },
    { value: 'В гостинице или на съемной квартире', label: 'В гостинице или на съемной квартире' }
  ];

  const handleChange = (newValues) => {
    console.log('Изменение мест встреч:', newValues);
    setSelectedValues(newValues);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Демо компонента LocationCheckboxes</h2>
      <p><strong>Выбранные места:</strong> {selectedValues.join(', ') || 'Ничего не выбрано'}</p>
      <p><strong>Строка для отправки:</strong> {selectedValues.join('&&') || 'Пусто'}</p>
      <p><strong>Количество выбранных:</strong> {selectedValues.length}</p>
      
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
          Предпочитаемые места для встреч
        </label>
        <LocationCheckboxes
          options={options}
          selectedValues={selectedValues}
          onChange={handleChange}
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
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Сбросить выбор
        </button>
        
        <button 
          onClick={() => setSelectedValues(options.map(opt => opt.value))}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Выбрать все
        </button>
      </div>
    </div>
  );
};

export default LocationCheckboxesDemo;
