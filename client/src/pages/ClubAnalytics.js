import React, { useState, useEffect } from 'react';
import { clubApi } from '../services/clubApi';
import '../styles/ClubAnalytics.css';

// Иконки
const ChartBarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 20V10"/>
    <path d="M12 20V4"/>
    <path d="M6 20v-6"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const CurrencyRubleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 3h12"/>
    <path d="M6 8h12"/>
    <path d="M6 13l8 0"/>
    <path d="M6 18l8 0"/>
    <path d="M15 8a3 3 0 1 0 0 6"/>
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
    <polyline points="16,7 22,7 22,13"/>
  </svg>
);

const TrendingDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22,17 13.5,8.5 8.5,13.5 2,7"/>
    <polyline points="16,17 22,17 22,11"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const ClubAnalytics = () => {
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      const [overview, events, participants, financial] = await Promise.all([
        clubApi.getAnalytics('overview', period),
        clubApi.getAnalytics('events', period),
        clubApi.getAnalytics('participants', period),
        clubApi.getAnalytics('financial', period)
      ]);
      
      setAnalytics({
        overview: overview.analytics || overview,
        events: events.analytics || events,
        participants: participants.analytics || participants,
        financial: financial.analytics || financial
      });
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricChange = (current, previous) => {
    if (!previous) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change >= 0
    };
  };

  const renderMetricCard = (title, value, icon, change, color = 'blue') => {
    const changeData = getMetricChange(value, change?.previous);
    
    return (
      <div className={`metric-card ${color}`}>
        <div className="metric-header">
          <div className={`metric-icon ${color}`}>
            {icon}
          </div>
          <div className="metric-change">
            {changeData.value > 0 && (
              <>
                {changeData.isPositive ? (
                  <TrendingUpIcon className="trend-icon positive" />
                ) : (
                  <TrendingDownIcon className="trend-icon negative" />
                )}
                <span className={`change-value ${changeData.isPositive ? 'positive' : 'negative'}`}>
                  {changeData.value}%
                </span>
              </>
            )}
          </div>
        </div>
        <div className="metric-content">
          <h3 className="metric-value">{value?.toLocaleString() || 0}</h3>
          <p className="metric-title">{title}</p>
        </div>
      </div>
    );
  };

  const renderChart = (data, title, type = 'bar') => {
    // Простая визуализация данных
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="chart-container">
          <h3 className="chart-title">{title}</h3>
          <div className="chart-content">
            <p>Нет данных для отображения</p>
          </div>
        </div>
      );
    }
    
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-content">
          {data.map((item, index) => (
            <div key={index} className="chart-bar">
              <div className="bar-label">{item.label}</div>
              <div className="bar-container">
                <div 
                  className="bar-fill"
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: `hsl(${index * 60}, 70%, 60%)`
                  }}
                ></div>
              </div>
              <div className="bar-value">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="club-analytics-loading">
        <div className="loading-spinner"></div>
        <p>Загрузка аналитики...</p>
      </div>
    );
  }

  return (
    <div className="club-analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-content">
          <h1>Аналитика клуба</h1>
          <p>Детальная статистика и метрики вашего клуба</p>
        </div>
        <div className="period-selector">
          <button
            className={`period-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Неделя
          </button>
          <button
            className={`period-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Месяц
          </button>
          <button
            className={`period-btn ${period === 'year' ? 'active' : ''}`}
            onClick={() => setPeriod('year')}
          >
            Год
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="metrics-grid">
        {renderMetricCard(
          'Всего мероприятий',
          analytics.overview?.total_events,
          <CalendarIcon />,
          analytics.overview?.events_change,
          'blue'
        )}
        
        {renderMetricCard(
          'Участников',
          analytics.overview?.total_participants,
          <UsersIcon />,
          analytics.overview?.participants_change,
          'green'
        )}
        
        {renderMetricCard(
          'Доход',
          analytics.overview?.total_revenue,
          <CurrencyRubleIcon />,
          analytics.overview?.revenue_change,
          'purple'
        )}
        
        {renderMetricCard(
          'Рейтинг',
          analytics.overview?.average_rating,
          <HeartIcon />,
          analytics.overview?.rating_change,
          'red'
        )}
      </div>

      {/* Detailed Analytics */}
      <div className="analytics-sections">
        {/* Events Analytics */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>Аналитика мероприятий</h2>
            <div className="section-actions">
              <button className="btn btn-sm btn-secondary">
                <EyeIcon className="icon" />
                Экспорт
              </button>
            </div>
          </div>
          
          <div className="section-content">
            <div className="metrics-row">
              <div className="metric-item">
                <span className="metric-label">Средняя посещаемость</span>
                <span className="metric-value">
                  {analytics.events?.average_participation || 0}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Популярные дни</span>
                <span className="metric-value">
                  {analytics.events?.popular_days?.join(', ') || 'Нет данных'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Отмены</span>
                <span className="metric-value">
                  {analytics.events?.cancellations || 0}
                </span>
              </div>
            </div>
            
            {analytics.events?.monthly_data && (
              <div className="chart-section">
                {renderChart(
                  analytics.events.monthly_data,
                  'Мероприятия по месяцам'
                )}
              </div>
            )}
          </div>
        </div>

        {/* Participants Analytics */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>Аналитика участников</h2>
          </div>
          
          <div className="section-content">
            <div className="metrics-row">
              <div className="metric-item">
                <span className="metric-label">Новые участники</span>
                <span className="metric-value">
                  {analytics.participants?.new_participants || 0}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Активные участники</span>
                <span className="metric-value">
                  {analytics.participants?.active_participants || 0}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Средний возраст</span>
                <span className="metric-value">
                  {analytics.participants?.average_age || 0} лет
                </span>
              </div>
            </div>
            
            {analytics.participants?.demographics && (
              <div className="demographics-grid">
                <div className="demographic-item">
                  <h4>Пол</h4>
                  <div className="demographic-data">
                    <div className="demographic-bar">
                      <span>Мужчины</span>
                      <div className="bar">
                        <div 
                          className="bar-fill male"
                          style={{ width: `${analytics.participants.demographics.gender?.male || 0}%` }}
                        ></div>
                      </div>
                      <span>{analytics.participants.demographics.gender?.male || 0}%</span>
                    </div>
                    <div className="demographic-bar">
                      <span>Женщины</span>
                      <div className="bar">
                        <div 
                          className="bar-fill female"
                          style={{ width: `${analytics.participants.demographics.gender?.female || 0}%` }}
                        ></div>
                      </div>
                      <span>{analytics.participants.demographics.gender?.female || 0}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="demographic-item">
                  <h4>Возраст</h4>
                  <div className="demographic-data">
                    {(analytics.participants.demographics.age_groups || []).map((group, index) => (
                      <div key={index} className="demographic-bar">
                        <span>{group.range}</span>
                        <div className="bar">
                          <div 
                            className="bar-fill age"
                            style={{ width: `${group.percentage}%` }}
                          ></div>
                        </div>
                        <span>{group.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Financial Analytics */}
        <div className="analytics-section">
          <div className="section-header">
            <h2>Финансовая аналитика</h2>
          </div>
          
          <div className="section-content">
            <div className="metrics-row">
              <div className="metric-item">
                <span className="metric-label">Общий доход</span>
                <span className="metric-value">
                  {analytics.financial?.total_revenue?.toLocaleString() || 0} ₽
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Средний чек</span>
                <span className="metric-value">
                  {analytics.financial?.average_ticket?.toLocaleString() || 0} ₽
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Прибыль</span>
                <span className="metric-value">
                  {analytics.financial?.profit?.toLocaleString() || 0} ₽
                </span>
              </div>
            </div>
            
            {analytics.financial?.revenue_by_month && (
              <div className="chart-section">
                {renderChart(
                  analytics.financial.revenue_by_month,
                  'Доход по месяцам'
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ClubAnalytics;
