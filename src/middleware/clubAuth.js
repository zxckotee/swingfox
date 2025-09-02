const jwt = require('jsonwebtoken');
const { Clubs } = require('../models');

const authenticateClub = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Токен не предоставлен' });
    }

    const decoded = jwt.verify(token, process.env.CLUB_JWT_SECRET || 'club_secret_key_2024');
    const club = await Clubs.findOne({
      where: { 
        id: decoded.clubId,
        is_active: true 
      }
    });

    if (!club) {
      return res.status(403).json({ error: 'Клуб не найден или неактивен' });
    }

    req.club = {
      id: club.id,
      name: club.name,
      login: club.login,
      type: club.type
    };

    next();
  } catch (error) {
    console.error('Club auth error:', error);
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

const checkClubOwnership = (req, res, next) => {
  const { clubId } = req.params;
  
  if (req.club.id !== parseInt(clubId)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }
  
  next();
};

const checkEventOwnership = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { ClubEvents } = require('../models');
    
    const event = await ClubEvents.findOne({
      where: { id: eventId, club_id: req.club.id }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }
    
    req.event = event;
    next();
  } catch (error) {
    console.error('Event ownership check error:', error);
    return res.status(500).json({ error: 'Ошибка проверки прав доступа' });
  }
};

const generateClubToken = (club) => {
  return jwt.sign(
    { 
      clubId: club.id,
      name: club.name,
      type: club.type 
    },
    process.env.CLUB_JWT_SECRET || 'club_secret_key_2024',
    { expiresIn: '7d' }
  );
};

module.exports = {
  authenticateClub,
  checkClubOwnership,
  checkEventOwnership,
  generateClubToken
};
