import React from 'react';
import { Link } from 'react-router-dom';
import './ClubCard.css';

const ClubCard = ({ club }) => {
  const getClubTypeLabel = (type) => {
    const types = {
      'nightclub': 'Ночной клуб',
      'restaurant': 'Ресторан',
      'event_space': 'Event Space',
      'other': 'Другое'
    };
    return types[type] || 'Клуб';
  };

  const getClubTypeIcon = (type) => {
    switch (type) {
      case 'nightclub':
        return '🎵';
      case 'restaurant':
        return '🍽️';
      case 'event_space':
        return '🏢';
      default:
        return '🏛️';
    }
  };

  return (
    <div className="club-card">
      <div className="club-card-header">
        <div className="club-avatar">
          <img 
            src={club.avatar ? `/uploads/${club.avatar}` : '/uploads/no_photo.jpg'} 
            alt={club.name}
            onError={(e) => {
              e.target.src = '/uploads/no_photo.jpg';
            }}
          />
        </div>
        <div className="club-type-badge">
          <span className="club-type-icon">{getClubTypeIcon(club.type)}</span>
          <span className="club-type-label">{getClubTypeLabel(club.type)}</span>
        </div>
      </div>

      <div className="club-card-content">
        <h3 className="club-name">{club.name}</h3>
        <p className="club-description">
          {club.description ? 
            (club.description.length > 120 ? 
              `${club.description.substring(0, 120)}...` : 
              club.description
            ) : 
            'Описание не указано'
          }
        </p>
        
        <div className="club-location">
          <span className="location-icon">📍</span>
          <span className="location-text">
            {club.city}, {club.country}
          </span>
        </div>

        {club.website && (
          <div className="club-website">
            <span className="website-icon">🌐</span>
            <a 
              href={club.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="website-link"
            >
              {club.website}
            </a>
          </div>
        )}
      </div>

      <div className="club-card-actions">
        <Link 
          to={`/clubs/${club.id}`} 
          className="btn btn-primary btn-sm"
        >
          Подробнее
        </Link>
        <Link 
          to={`/clubs/${club.id}/events`} 
          className="btn btn-secondary btn-sm"
        >
          События
        </Link>
      </div>
    </div>
  );
};

export default ClubCard;
