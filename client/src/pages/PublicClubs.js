import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClubCard from '../components/ClubCard';
import { api } from '../services/api';
import './PublicClubs.css';

const PublicClubs = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');

  useEffect(() => {
    loadClubs();
  }, [searchTerm, selectedType, selectedCity]);

  const loadClubs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Используем правильный API для получения клубов
      const response = await api.clubs.getClubs({
        limit: 50,
        search: searchTerm,
        type: selectedType !== 'all' ? selectedType : undefined,
        city: selectedCity !== 'all' ? selectedCity : undefined
      });
      
      setClubs(response.clubs || []);
    } catch (error) {
      console.error('Ошибка загрузки клубов:', error);
      setError('Не удалось загрузить список клубов');
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация теперь происходит на сервере, поэтому используем clubs напрямую
  const filteredClubs = clubs;

  const getClubTypes = () => {
    const types = [...new Set(clubs.map(club => club.type).filter(Boolean))];
    return types.map(type => ({
      value: type,
      label: getClubTypeLabel(type)
    }));
  };

  const getClubTypeLabel = (type) => {
    const types = {
      'nightclub': 'Ночные клубы',
      'restaurant': 'Рестораны',
      'event_space': 'Event Space',
      'other': 'Другое'
    };
    return types[type] || 'Клуб';
  };

  const getCities = () => {
    const cities = [...new Set(clubs.map(club => club.city).filter(Boolean))];
    return cities.sort();
  };

  if (loading) {
    return (
      <div className="public-clubs-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка клубов...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-clubs-error">
        <h2>Ошибка загрузки</h2>
        <p>{error}</p>
        <button onClick={loadClubs} className="btn btn-primary">
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="public-clubs">
      <div className="public-clubs-header">
        <h1>Клубы и мероприятия</h1>
        <p>Найдите интересные места и события в вашем городе</p>
      </div>

      {/* Filters */}
      <div className="clubs-filters">
        <div className="filter-group">
          <label htmlFor="search">Поиск</label>
          <input
            id="search"
            type="text"
            placeholder="Название клуба или описание..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="type">Тип</label>
          <select
            id="type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все типы</option>
            {getClubTypes().map(type => (
              <option key={type.value || 'unknown'} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="city">Город</label>
          <select
            id="city"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="filter-select"
          >
            <option value="all">Все города</option>
            {getCities().map(city => (
              <option key={city || 'unknown'} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="clubs-results">
        <div className="results-header">
          <h2>
            Найдено клубов: {filteredClubs.length}
            {filteredClubs.length !== clubs.length && (
              <span className="filtered-count">
                {' '}(из {clubs.length})
              </span>
            )}
          </h2>
        </div>

        {filteredClubs.length === 0 ? (
          <div className="no-clubs">
            <div className="no-clubs-icon">🏛️</div>
            <h3>Клубы не найдены</h3>
            <p>
              {searchTerm || selectedType !== 'all' || selectedCity !== 'all' 
                ? 'Попробуйте изменить параметры поиска'
                : 'В данный момент нет доступных клубов'
              }
            </p>
            {(searchTerm || selectedType !== 'all' || selectedCity !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedCity('all');
                }}
                className="btn btn-secondary"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="clubs-grid">
            {filteredClubs.map(club => (
              <ClubCard key={club.id || `club-${Math.random()}`} club={club} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicClubs;
