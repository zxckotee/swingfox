const { calculateDistance, parseGeo } = require('./helpers');

/**
 * Калькулятор совместимости для рекомендательной системы
 * Рассчитывает вероятность совместимости между двумя пользователями
 */
class CompatibilityCalculator {
  constructor() {
    // Веса для различных критериев совместимости
    this.weights = {
      mutualStatus: 0.25,      // Взаимный поиск статусов
      age: 0.20,               // Возрастная совместимость
      distance: 0.15,          // Географическая близость
      location: 0.15,          // Предпочтения по местам встреч
      lifestyle: 0.10,         // Образ жизни (курение, алкоголь)
      physical: 0.10,          // Физические параметры
      activity: 0.05           // Активность (онлайн, регистрация)
    };
  }

  /**
   * Основной метод расчета совместимости
   * @param {Object} user1 - Первый пользователь
   * @param {Object} user2 - Второй пользователь
   * @returns {Object} Результат с вероятностью и детализацией
   */
  calculateCompatibility(user1, user2) {
    const scores = {
      mutualStatus: this.calculateMutualStatusScore(user1, user2),
      age: this.calculateAgeScore(user1, user2),
      distance: this.calculateDistanceScore(user1, user2),
      location: this.calculateLocationScore(user1, user2),
      lifestyle: this.calculateLifestyleScore(user1, user2),
      physical: this.calculatePhysicalScore(user1, user2),
      activity: this.calculateActivityScore(user1, user2)
    };

    // Рассчитываем общую вероятность совместимости
    const totalScore = Object.keys(scores).reduce((total, key) => {
      return total + (scores[key] * this.weights[key]);
    }, 0);

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      scores,
      weights: this.weights,
      recommendations: this.generateRecommendations(scores, totalScore)
    };
  }

  /**
   * Взаимный поиск статусов (самый важный критерий)
   */
  calculateMutualStatusScore(user1, user2) {
    // Проверяем, что user1 ищет user2 и наоборот
    const user1WantsUser2 = this.checkStatusCompatibility(user1.search_status, user2.status);
    const user2WantsUser1 = this.checkStatusCompatibility(user2.search_status, user1.status);
    
    if (user1WantsUser2 && user2WantsUser1) {
      return 1.0; // Полная совместимость
    } else if (user1WantsUser2 || user2WantsUser1) {
      return 0.5; // Частичная совместимость
    }
    return 0.0; // Нет совместимости
  }

  /**
   * Проверка совместимости статусов
   */
  checkStatusCompatibility(searchStatus, targetStatus) {
    if (!searchStatus || !targetStatus) return false;
    
    const searchArray = searchStatus.split('&&');
    return searchArray.includes(targetStatus);
  }

  /**
   * Возрастная совместимость
   */
  calculateAgeScore(user1, user2) {
    if (!user1.date || !user2.date) return 0.5;

    const age1 = this.calculateAge(user1.date);
    const age2 = this.calculateAge(user2.date);
    
    if (!age1 || !age2) return 0.5;

    const ageDiff = Math.abs(age1 - age2);
    
    // Проверяем предпочтения по возрасту
    const agePreference1 = this.parseAgePreference(user1.search_age);
    const agePreference2 = this.parseAgePreference(user2.search_age);
    
    let score = 1.0;
    
    // Применяем ограничения по возрасту
    if (agePreference1 && !this.checkAgePreference(age1, age2, agePreference1)) {
      score *= 0.3;
    }
    if (agePreference2 && !this.checkAgePreference(age2, age1, agePreference2)) {
      score *= 0.3;
    }
    
    // Бонус за близкий возраст
    if (ageDiff <= 5) score *= 1.2;
    else if (ageDiff <= 10) score *= 1.0;
    else if (ageDiff <= 20) score *= 0.8;
    else score *= 0.6;
    
    return Math.min(score, 1.0);
  }

  /**
   * Расчет возраста из даты
   */
  calculateAge(dateString) {
    if (!dateString) return null;
    
    // Для пар берем средний возраст
    if (dateString.includes('_')) {
      const [date1, date2] = dateString.split('_');
      const age1 = this.calculateSingleAge(date1);
      const age2 = this.calculateSingleAge(date2);
      return age1 && age2 ? Math.round((age1 + age2) / 2) : null;
    }
    
    return this.calculateSingleAge(dateString);
  }

  /**
   * Расчет возраста для одной даты
   */
  calculateSingleAge(dateString) {
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      return null;
    }
  }

  /**
   * Парсинг предпочтений по возрасту
   */
  parseAgePreference(searchAge) {
    if (!searchAge) return null;
    
    if (searchAge.includes('+/- 5 лет')) return 5;
    if (searchAge.includes('+/- 10 лет')) return 10;
    if (searchAge.includes('ровестниками')) return 5;
    
    return null;
  }

  /**
   * Проверка соответствия возрастов предпочтениям
   */
  checkAgePreference(searcherAge, targetAge, maxDiff) {
    return Math.abs(searcherAge - targetAge) <= maxDiff;
  }

  /**
   * Географическая близость
   */
  calculateDistanceScore(user1, user2) {
    if (!user1.geo || !user2.geo) return 0.5;
    
    const geo1 = parseGeo(user1.geo);
    const geo2 = parseGeo(user2.geo);
    
    if (!geo1 || !geo2) return 0.5;
    
    const distance = calculateDistance(geo1.lat, geo1.lng, geo2.lat, geo2.lng);
    
    // Нормализуем расстояние (0-1000 км)
    let score = 1.0;
    
    if (distance <= 50) score = 1.0;      // Очень близко
    else if (distance <= 100) score = 0.9; // Близко
    else if (distance <= 200) score = 0.8; // Умеренно
    else if (distance <= 500) score = 0.6; // Далеко, но приемлемо
    else score = 0.3;                      // Очень далеко
    
    return score;
  }

  /**
   * Совместимость по местам встреч
   */
  calculateLocationScore(user1, user2) {
    if (!user1.location || !user2.location) return 0.5;
    
    const locations1 = user1.location.split('&&');
    const locations2 = user2.location.split('&&');
    
    // Находим пересечения
    const commonLocations = locations1.filter(loc => locations2.includes(loc));
    
    if (commonLocations.length === 0) return 0.2;
    if (commonLocations.length === 1) return 0.6;
    if (commonLocations.length >= 2) return 1.0;
    
    return 0.5;
  }

  /**
   * Совместимость по образу жизни
   */
  calculateLifestyleScore(user1, user2) {
    let score = 0.5;
    let factors = 0;
    
    // Курение
    if (user1.smoking && user2.smoking) {
      const smoking1 = user1.smoking.split('&&')[0];
      const smoking2 = user2.smoking.split('&&')[0];
      
      if (smoking1 === smoking2) score += 0.2;
      else if (smoking1.includes('Не курю') && smoking2.includes('Не курю')) score += 0.1;
      
      factors++;
    }
    
    // Алкоголь
    if (user1.alko && user2.alko) {
      const alko1 = user1.alko.split('&&')[0];
      const alko2 = user2.alko.split('&&')[0];
      
      if (alko1 === alko2) score += 0.2;
      else if (alko1.includes('Не употребляю') && alko2.includes('Не употребляю')) score += 0.1;
      
      factors++;
    }
    
    if (factors > 0) {
      score = score / factors;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Физические параметры
   */
  calculatePhysicalScore(user1, user2) {
    let score = 0.5;
    let factors = 0;
    
    // Рост (если указан)
    if (user1.height && user2.height) {
      const height1 = this.parseHeight(user1.height);
      const height2 = this.parseHeight(user2.height);
      
      if (height1 && height2) {
        const heightDiff = Math.abs(height1 - height2);
        if (heightDiff <= 10) score += 0.2;
        else if (heightDiff <= 20) score += 0.1;
        factors++;
      }
    }
    
    // Вес (если указан)
    if (user1.weight && user2.weight) {
      const weight1 = this.parseWeight(user1.weight);
      const weight2 = this.parseWeight(user2.weight);
      
      if (weight1 && weight2) {
        const weightDiff = Math.abs(weight1 - weight2);
        if (weightDiff <= 10) score += 0.2;
        else if (weightDiff <= 20) score += 0.1;
        factors++;
      }
    }
    
    if (factors > 0) {
      score = score / factors;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Парсинг роста
   */
  parseHeight(heightString) {
    if (!heightString) return null;
    
    if (heightString.includes('_')) {
      const [height1, height2] = heightString.split('_');
      return Math.round((parseInt(height1) + parseInt(height2)) / 2);
    }
    
    return parseInt(heightString);
  }

  /**
   * Парсинг веса
   */
  parseWeight(weightString) {
    if (!weightString) return null;
    
    if (weightString.includes('_')) {
      const [weight1, weight2] = weightString.split('_');
      return Math.round((parseInt(weight1) + parseInt(weight2)) / 2);
    }
    
    return parseInt(weightString);
  }

  /**
   * Активность пользователей
   */
  calculateActivityScore(user1, user2) {
    let score = 0.5;
    
    // Онлайн статус
    const now = new Date();
    const online1 = user1.online ? (now - new Date(user1.online)) / (1000 * 60 * 60) : 24;
    const online2 = user2.online ? (now - new Date(user2.online)) / (1000 * 60 * 60) : 24;
    
    // Бонус за активных пользователей
    if (online1 <= 1 && online2 <= 1) score += 0.3;      // Оба онлайн
    else if (online1 <= 24 && online2 <= 24) score += 0.1; // Оба активны за день
    
    // Дата регистрации (бонус за новых пользователей)
    const reg1 = user1.registration ? (now - new Date(user1.registration)) / (1000 * 60 * 60 * 24) : 365;
    const reg2 = user2.registration ? (now - new Date(user2.registration)) / (1000 * 60 * 60 * 24) : 365;
    
    if (reg1 <= 30 && reg2 <= 30) score += 0.2;      // Оба новые
    else if (reg1 <= 90 && reg2 <= 90) score += 0.1;  // Оба относительно новые
    
    return Math.min(score, 1.0);
  }

  /**
   * Генерация рекомендаций на основе оценок
   */
  generateRecommendations(scores, totalScore) {
    const recommendations = [];
    
    if (totalScore >= 0.8) {
      recommendations.push('Отличная совместимость!');
    } else if (totalScore >= 0.6) {
      recommendations.push('Хорошая совместимость');
    } else if (totalScore >= 0.4) {
      recommendations.push('Умеренная совместимость');
    } else {
      recommendations.push('Низкая совместимость');
    }
    
    // Конкретные рекомендации по критериям
    if (scores.mutualStatus < 0.5) {
      recommendations.push('Проверьте настройки поиска');
    }
    
    if (scores.distance < 0.5) {
      recommendations.push('Рассмотрите расширение географии поиска');
    }
    
    if (scores.location < 0.5) {
      recommendations.push('Разные предпочтения по местам встреч');
    }
    
    return recommendations;
  }

  /**
   * Сортировка пользователей по совместимости
   */
  sortByCompatibility(users, currentUser) {
    return users
      .map(user => ({
        user,
        compatibility: this.calculateCompatibility(currentUser, user)
      }))
      .sort((a, b) => b.compatibility.totalScore - a.compatibility.totalScore);
  }

  /**
   * Получение топ рекомендаций с рандомизацией
   */
  getTopRecommendations(users, currentUser, limit = 10) {
    const sortedUsers = this.sortByCompatibility(users, currentUser);
    
    // Берем топ 30% и рандомизируем их
    const topCount = Math.max(3, Math.floor(limit * 0.3));
    const topUsers = sortedUsers.slice(0, topCount);
    
    // Перемешиваем топ пользователей
    for (let i = topUsers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [topUsers[i], topUsers[j]] = [topUsers[j], topUsers[i]];
    }
    
    // Добавляем случайных пользователей для разнообразия
    const remainingUsers = sortedUsers.slice(topCount);
    const randomUsers = this.shuffleArray(remainingUsers).slice(0, limit - topCount);
    
    return [...topUsers, ...randomUsers].slice(0, limit);
  }

  /**
   * Перемешивание массива
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = new CompatibilityCalculator();
