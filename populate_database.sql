-- SQL скрипт для заполнения базы данных SwingFox разнообразными данными
-- Пароль для всех пользователей: 44445555 (хешированный bcrypt)
-- Аватарки: no_photo.jpg

-- Очистка существующих данных (кроме клубов, которые уже есть)
DELETE FROM profile_comments;
DELETE FROM event_participants;
DELETE FROM club_events WHERE id > 5; -- Оставляем существующие 5 мероприятий
DELETE FROM events;
DELETE FROM ads;
DELETE FROM users;

-- ===========================================
-- ПОЛЬЗОВАТЕЛИ (6 пользователей включая админа)
-- ===========================================

-- Пользователь 1: Семейная пара
INSERT INTO users (id, login, email, password, status, country, city, geo, registration, info, online, viptype, images, search_status, search_age, location, mobile, height, weight, smoking, alko, date, balance, locked_images, images_password, privacy_settings, geo_updated_at, notification_token, premium_features, created_at, updated_at) VALUES
(1, 'alex_maria_couple', 'alex.maria@example.com', '$2a$10$k7WQEhFAOwdFJ6o4wl/5ueKIQqWN40UjARLCBtwDQqxMEQRYjmUui', 'Семейная пара(М+Ж)', 'Россия', 'Москва', '55.7558&&37.6176', '2024-01-15', 'Активная семейная пара, ищем интересные знакомства и новые впечатления. Любим путешествовать и открывать что-то новое.', NOW() - INTERVAL '2 hours', 'PREMIUM', 'no_photo.jpg&&no_photo.jpg', 'Семейная пара(М+Ж)&&Несемейная пара(М+Ж)&&Мужчина&&Женщина', '25-45', 'У себя дома&&У вас дома&&В свинг-клубе&&В сауне&&В гостинице', '+7-900-123-4567', '185_165', '80_55', 'Не курю&&Не курю', 'Иногда&&Не употребляю', '1985-03-15_1988-07-22', 500, NULL, NULL, '{"privacy":{"anonymous_visits":false,"show_online_status":true,"show_last_seen":true,"allow_messages":true,"allow_gifts":true,"allow_ratings":true,"allow_comments":true},"notifications":{"new_matches":true,"messages":true,"likes":true,"gifts":true,"profile_visits":true}}', NOW() - INTERVAL '1 day', 'fcm_token_alex_maria', '{"can_view_guests":true,"can_anonymous_visits":true,"can_see_who_liked":true,"can_rewind_last_swipe":true,"can_send_superlikes":true,"can_see_read_receipts":true,"can_see_online_status":true}', NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 hours');

-- Пользователь 2: Несемейная пара
INSERT INTO users (id, login, email, password, status, country, city, geo, registration, info, online, viptype, images, search_status, search_age, location, mobile, height, weight, smoking, alko, date, balance, locked_images, images_password, privacy_settings, geo_updated_at, notification_token, premium_features, created_at, updated_at) VALUES
(2, 'dmitry_olga_pair', 'dmitry.olga@example.com', '$2a$10$k7WQEhFAOwdFJ6o4wl/5ueKIQqWN40UjARLCBtwDQqxMEQRYjmUui', 'Несемейная пара(М+Ж)', 'Россия', 'Санкт-Петербург', '59.9311&&30.3609', '2024-02-20', 'Молодая пара, познакомились недавно. Ищем единомышленников для совместного времяпрепровождения.', NOW() - INTERVAL '30 minutes', 'VIP', 'no_photo.jpg&&no_photo.jpg', 'Семейная пара(М+Ж)&&Несемейная пара(М+Ж)&&Мужчина&&Женщина', '22-40', 'У себя дома&&У вас дома&&В свинг-клубе', '+7-900-234-5678', '180_170', '75_60', 'Курю&&Не курю', 'Иногда&&Не употребляю', '1990-11-08_1992-04-12', 300, NULL, NULL, '{"privacy":{"anonymous_visits":false,"show_online_status":true,"show_last_seen":true,"allow_messages":true,"allow_gifts":true,"allow_ratings":true,"allow_comments":true},"notifications":{"new_matches":true,"messages":true,"likes":true,"gifts":true,"profile_visits":true}}', NOW() - INTERVAL '2 hours', 'fcm_token_dmitry_olga', '{"can_view_guests":true,"can_anonymous_visits":true,"can_see_who_liked":true,"can_rewind_last_swipe":true,"can_send_superlikes":true,"can_see_read_receipts":false,"can_see_online_status":false}', NOW() - INTERVAL '25 days', NOW() - INTERVAL '30 minutes');

-- Пользователь 3: Мужчина
INSERT INTO users (id, login, email, password, status, country, city, geo, registration, info, online, viptype, images, search_status, search_age, location, mobile, height, weight, smoking, alko, date, balance, locked_images, images_password, privacy_settings, geo_updated_at, notification_token, premium_features, created_at, updated_at) VALUES
(3, 'sergey_solo', 'sergey@example.com', '$2a$10$k7WQEhFAOwdFJ6o4wl/5ueKIQqWN40UjARLCBtwDQqxMEQRYjmUui', 'Мужчина', 'Россия', 'Екатеринбург', '56.8431&&60.6454', '2024-03-10', 'Успешный предприниматель, веду активный образ жизни. Ищу интересных людей для общения и новых знакомств.', NOW() - INTERVAL '1 hour', 'FREE', 'no_photo.jpg', 'Семейная пара(М+Ж)&&Несемейная пара(М+Ж)&&Женщина', '25-50', 'У себя дома&&В свинг-клубе&&В сауне&&В гостинице', '+7-900-345-6789', '190', '85', 'Не курю', 'Иногда', '1982-09-25', 100, NULL, NULL, '{"privacy":{"anonymous_visits":false,"show_online_status":true,"show_last_seen":true,"allow_messages":true,"allow_gifts":true,"allow_ratings":true,"allow_comments":true},"notifications":{"new_matches":true,"messages":true,"likes":true,"gifts":true,"profile_visits":true}}', NOW() - INTERVAL '3 hours', 'fcm_token_sergey', '{"can_view_guests":false,"can_anonymous_visits":false,"can_see_who_liked":false,"can_rewind_last_swipe":false,"can_send_superlikes":false,"can_see_read_receipts":false,"can_see_online_status":false}', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 hour');

-- Пользователь 4: Женщина
INSERT INTO users (id, login, email, password, status, country, city, geo, registration, info, online, viptype, images, search_status, search_age, location, mobile, height, weight, smoking, alko, date, balance, locked_images, images_password, privacy_settings, geo_updated_at, notification_token, premium_features, created_at, updated_at) VALUES
(4, 'anna_beautiful', 'anna@example.com', '$2a$10$k7WQEhFAOwdFJ6o4wl/5ueKIQqWN40UjARLCBtwDQqxMEQRYjmUui', 'Женщина', 'Россия', 'Новосибирск', '55.0084&&82.9357', '2024-04-05', 'Творческая личность, работаю в сфере искусства. Люблю интересные знакомства и новые впечатления.', NOW() - INTERVAL '15 minutes', 'VIP', 'no_photo.jpg', 'Семейная пара(М+Ж)&&Несемейная пара(М+Ж)&&Мужчина', '28-45', 'У себя дома&&У вас дома&&В свинг-клубе&&В сауне', '+7-900-456-7890', '168', '58', 'Не курю', 'Не употребляю', '1987-12-03', 750, NULL, NULL, '{"privacy":{"anonymous_visits":false,"show_online_status":true,"show_last_seen":true,"allow_messages":true,"allow_gifts":true,"allow_ratings":true,"allow_comments":true},"notifications":{"new_matches":true,"messages":true,"likes":true,"gifts":true,"profile_visits":true}}', NOW() - INTERVAL '1 hour', 'fcm_token_anna', '{"can_view_guests":true,"can_anonymous_visits":true,"can_see_who_liked":true,"can_rewind_last_swipe":true,"can_send_superlikes":true,"can_see_read_receipts":false,"can_see_online_status":false}', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 minutes');

-- Пользователь 5: Семейная пара (вторая)
INSERT INTO users (id, login, email, password, status, country, city, geo, registration, info, online, viptype, images, search_status, search_age, location, mobile, height, weight, smoking, alko, date, balance, locked_images, images_password, privacy_settings, geo_updated_at, notification_token, premium_features, created_at, updated_at) VALUES
(5, 'vlad_elena_family', 'vlad.elena@example.com', '$2a$10$k7WQEhFAOwdFJ6o4wl/5ueKIQqWN40UjARLCBtwDQqxMEQRYjmUui', 'Семейная пара(М+Ж)', 'Россия', 'Казань', '55.8304&&49.0661', '2024-05-12', 'Семейная пара с детьми, ищем друзей для совместного отдыха и общения. Открыты для новых знакомств.', NOW() - INTERVAL '45 minutes', 'FREE', 'no_photo.jpg&&no_photo.jpg', 'Семейная пара(М+Ж)&&Несемейная пара(М+Ж)', '30-50', 'У себя дома&&У вас дома&&В свинг-клубе', '+7-900-567-8901', '182_167', '78_62', 'Не курю&&Не курю', 'Не употребляю&&Не употребляю', '1980-06-18_1983-10-14', 200, NULL, NULL, '{"privacy":{"anonymous_visits":false,"show_online_status":true,"show_last_seen":true,"allow_messages":true,"allow_gifts":true,"allow_ratings":true,"allow_comments":true},"notifications":{"new_matches":true,"messages":true,"likes":true,"gifts":true,"profile_visits":true}}', NOW() - INTERVAL '2 hours', 'fcm_token_vlad_elena', '{"can_view_guests":false,"can_anonymous_visits":false,"can_see_who_liked":false,"can_rewind_last_swipe":false,"can_send_superlikes":false,"can_see_read_receipts":false,"can_see_online_status":false}', NOW() - INTERVAL '10 days', NOW() - INTERVAL '45 minutes');

-- Пользователь 6: Администратор
INSERT INTO users (id, login, email, password, status, country, city, geo, registration, info, online, viptype, images, search_status, search_age, location, mobile, height, weight, smoking, alko, date, balance, locked_images, images_password, privacy_settings, geo_updated_at, notification_token, premium_features, created_at, updated_at) VALUES
(999, 'admin', 'admin@swingfox.com', '$2a$10$k7WQEhFAOwdFJ6o4wl/5ueKIQqWN40UjARLCBtwDQqxMEQRYjmUui', 'Мужчина', 'Россия', 'Москва', '55.7558&&37.6176', '2024-01-01', 'Администратор системы', NOW(), 'PREMIUM', 'no_photo.jpg', 'Семейная пара(М+Ж)&&Несемейная пара(М+Ж)&&Мужчина&&Женщина', '25-50', 'У себя дома&&У вас дома&&В свинг-клубе&&В сауне&&В гостинице', '+7-900-000-0000', '180', '75', 'Не курю', 'Не употребляю', '1980-01-01', 1000, NULL, NULL, '{"privacy":{"anonymous_visits":false,"show_online_status":true,"show_last_seen":true,"allow_messages":true,"allow_gifts":true,"allow_ratings":true,"allow_comments":true},"notifications":{"new_matches":true,"messages":true,"likes":true,"gifts":true,"profile_visits":true}}', NOW(), 'fcm_token_admin', '{"can_view_guests":true,"can_anonymous_visits":true,"can_see_who_liked":true,"can_rewind_last_swipe":true,"can_send_superlikes":true,"can_see_read_receipts":true,"can_see_online_status":true}', NOW() - INTERVAL '365 days', NOW());

-- ===========================================
-- СОБЫТИЯ (5 событий)
-- ===========================================

INSERT INTO events (id, title, description, organizer, event_date, location, city, max_participants, price, type, status, is_private, requirements, dress_code, contact_info, image, approved, approved_by, country, duration_hours, end_date, created_at, updated_at) VALUES
(1, 'Свинг-вечеринка "Ночные страсти"', 'Эксклюзивная вечеринка для взрослых в стильном клубе. Танцы, знакомства, новые впечатления. Строго 21+.', 'alex_maria_couple', NOW() + INTERVAL '7 days', 'Клуб "Элит", ул. Тверская, 15', 'Москва', 50, 2000.00, 'party', 'planned', false, 'Возраст 21+, приглашения только для пар и одиноких женщин', 'Вечерний наряд', 'alex.maria@example.com, +7-900-123-4567', 'no_photo.jpg', true, 'admin', 'Россия', 4, NOW() + INTERVAL '7 days' + INTERVAL '4 hours', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

(2, 'Романтический ужин для пар', 'Интимный ужин в ресторане с возможностью знакомства с другими парами. Изысканная кухня и приятная атмосфера.', 'dmitry_olga_pair', NOW() + INTERVAL '10 days', 'Ресторан "Вкус", Невский пр., 25', 'Санкт-Петербург', 20, 3500.00, 'meeting', 'planned', false, 'Только пары, возраст 25+', 'Деловой стиль', 'dmitry.olga@example.com, +7-900-234-5678', 'no_photo.jpg', true, 'admin', 'Россия', 3, NOW() + INTERVAL '10 days' + INTERVAL '3 hours', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours'),

(3, 'Встреча в сауне "Теплые объятия"', 'Расслабляющая встреча в частной сауне с джакузи. Идеально для знакомства в неформальной обстановке.', 'sergey_solo', NOW() + INTERVAL '14 days', 'Частная сауна "Рай", ул. Ленина, 100', 'Екатеринбург', 12, 1500.00, 'private', 'planned', true, 'Возраст 25+, предварительная регистрация обязательна', 'Купальники, полотенца', 'sergey@example.com, +7-900-345-6789', 'no_photo.jpg', true, 'admin', 'Россия', 2, NOW() + INTERVAL '14 days' + INTERVAL '2 hours', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 hour'),

(4, 'Арт-вечер "Искусство соблазна"', 'Творческая встреча с обсуждением искусства, вином и возможностью познакомиться с единомышленниками.', 'anna_beautiful', NOW() + INTERVAL '21 days', 'Галерея "Современность", ул. Красный пр., 50', 'Новосибирск', 30, 1000.00, 'other', 'planned', false, 'Возраст 21+, интерес к искусству приветствуется', 'Стильный casual', 'anna@example.com, +7-900-456-7890', 'no_photo.jpg', true, 'admin', 'Россия', 3, NOW() + INTERVAL '21 days' + INTERVAL '3 hours', NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 minutes'),

(5, 'Семейный пикник "На природе"', 'Семейная встреча на природе с играми, барбекю и возможностью познакомиться с другими семьями.', 'vlad_elena_family', NOW() + INTERVAL '28 days', 'Парк "Семейный", ул. Парковая, 1', 'Казань', 40, 500.00, 'meeting', 'planned', false, 'Семьи с детьми, возраст детей от 5 лет', 'Спортивная одежда', 'vlad.elena@example.com, +7-900-567-8901', 'no_photo.jpg', true, 'admin', 'Россия', 4, NOW() + INTERVAL '28 days' + INTERVAL '4 hours', NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 hour');

-- ===========================================
-- ОБЪЯВЛЕНИЯ (10 объявлений)
-- ===========================================

INSERT INTO ads (id, title, description, author, type, country, city, contact_info, image, status, approved_by, approved_at, expires_at, views_count, is_featured, viral_share_enabled, referral_bonus, social_proof_count, created_at, updated_at) VALUES
(1, 'Ищу пару для совместного отдыха', 'Активная семейная пара ищет единомышленников для совместного времяпрепровождения. Интересы: путешествия, спорт, культурные мероприятия.', 'alex_maria_couple', 'Знакомства', 'Россия', 'Москва', 'alex.maria@example.com, +7-900-123-4567', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 45, true, true, 0.00, 12, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

(2, 'Вечеринка в стиле 80-х', 'Организую тематическую вечеринку в стиле 80-х годов. Приглашаю всех желающих окунуться в атмосферу того времени.', 'dmitry_olga_pair', 'Вечеринки', 'Россия', 'Санкт-Петербург', 'dmitry.olga@example.com, +7-900-234-5678', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 32, false, true, 0.00, 8, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours'),

(3, 'Поиск партнера для занятий спортом', 'Ищу партнера для совместных тренировок в спортзале. Предпочтительно женщина 25-35 лет.', 'sergey_solo', 'Знакомства', 'Россия', 'Екатеринбург', 'sergey@example.com, +7-900-345-6789', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', 28, false, true, 0.00, 5, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 hour'),

(4, 'Мастер-класс по танцам', 'Провожу мастер-класс по латиноамериканским танцам для начинающих. Группы до 8 человек.', 'anna_beautiful', 'Мероприятия', 'Россия', 'Новосибирск', 'anna@example.com, +7-900-456-7890', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days', 67, true, true, 0.00, 23, NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 minutes'),

(5, 'Семейный отдых на даче', 'Приглашаем семью с детьми на совместный отдых на нашей даче. Бассейн, мангал, детская площадка.', 'vlad_elena_family', 'Встречи', 'Россия', 'Казань', 'vlad.elena@example.com, +7-900-567-8901', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 23, false, true, 0.00, 7, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 hour'),

(6, 'Кулинарные курсы для пар', 'Организую кулинарные курсы специально для пар. Учимся готовить вместе, общаемся, знакомимся.', 'alex_maria_couple', 'Мероприятия', 'Россия', 'Москва', 'alex.maria@example.com, +7-900-123-4567', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 41, false, true, 0.00, 15, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),

(7, 'Поиск напарника для путешествий', 'Ищу напарника для совместных путешествий по России. Планируем поездки на выходные и отпуск.', 'dmitry_olga_pair', 'Знакомства', 'Россия', 'Санкт-Петербург', 'dmitry.olga@example.com, +7-900-234-5678', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', 35, false, true, 0.00, 9, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours'),

(8, 'Йога для взрослых', 'Провожу занятия йогой для взрослых в небольших группах. Расслабление, медитация, новые знакомства.', 'anna_beautiful', 'Мероприятия', 'Россия', 'Новосибирск', 'anna@example.com, +7-900-456-7890', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 52, true, true, 0.00, 18, NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 minutes'),

(9, 'Ищу друзей для настольных игр', 'Собираю компанию для игры в настольные игры. Приветствуются пары и одинокие люди.', 'sergey_solo', 'Общение', 'Россия', 'Екатеринбург', 'sergey@example.com, +7-900-345-6789', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 19, false, true, 0.00, 3, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 hour'),

(10, 'Семейный клуб выходного дня', 'Создаю семейный клуб для совместного проведения выходных. Планируем различные активности для всей семьи.', 'vlad_elena_family', 'Встречи', 'Россия', 'Казань', 'vlad.elena@example.com, +7-900-567-8901', 'no_photo.jpg', 'approved', 'admin', NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 31, false, true, 0.00, 11, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 hour');

-- ===========================================
-- КОММЕНТАРИИ К ПРОФИЛЯМ (15 комментариев)
-- ===========================================

INSERT INTO profile_comments (id, from_user, to_user, comment_text, is_public, is_edited, edited_at, is_deleted, deleted_at, created_at, updated_at) VALUES
(1, 'dmitry_olga_pair', 'alex_maria_couple', 'Отличная пара! Очень приятные люди, с которыми легко общаться. Рекомендую!', true, false, NULL, false, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

(2, 'sergey_solo', 'alex_maria_couple', 'Прекрасная семья! Очень гостеприимные и интересные собеседники.', true, false, NULL, false, NULL, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

(3, 'anna_beautiful', 'alex_maria_couple', 'Замечательная пара! Очень позитивные и открытые люди. Было приятно познакомиться!', true, false, NULL, false, NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

(4, 'alex_maria_couple', 'dmitry_olga_pair', 'Молодая и энергичная пара! Очень понравилось общение с вами. Удачи!', true, false, NULL, false, NULL, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),

(5, 'sergey_solo', 'dmitry_olga_pair', 'Интересные люди! Очень приятно было пообщаться. Надеюсь на дальнейшее знакомство.', true, false, NULL, false, NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

(6, 'vlad_elena_family', 'dmitry_olga_pair', 'Хорошая пара! Молодые и перспективные. Удачи в отношениях!', true, false, NULL, false, NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

(7, 'alex_maria_couple', 'sergey_solo', 'Интересный собеседник! Очень приятно было познакомиться. Рекомендую!', true, false, NULL, false, NULL, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

(8, 'dmitry_olga_pair', 'sergey_solo', 'Отличный парень! Очень общительный и интересный. Удачи в поисках!', true, false, NULL, false, NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

(9, 'anna_beautiful', 'sergey_solo', 'Приятный мужчина! Очень интеллигентный и воспитанный. Рекомендую знакомство!', true, false, NULL, false, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

(10, 'alex_maria_couple', 'anna_beautiful', 'Прекрасная женщина! Очень творческая и интересная личность. Удачи!', true, false, NULL, false, NULL, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days'),

(11, 'dmitry_olga_pair', 'anna_beautiful', 'Замечательная девушка! Очень талантливая и обаятельная. Рекомендую!', true, false, NULL, false, NULL, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),

(12, 'sergey_solo', 'anna_beautiful', 'Очаровательная женщина! Очень интересная и разносторонняя личность.', true, false, NULL, false, NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

(13, 'alex_maria_couple', 'vlad_elena_family', 'Отличная семья! Очень дружелюбные и гостеприимные люди. Рекомендуем!', true, false, NULL, false, NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

(14, 'dmitry_olga_pair', 'vlad_elena_family', 'Прекрасная семья! Очень теплые и душевные люди. Удачи вам!', true, false, NULL, false, NULL, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

(15, 'anna_beautiful', 'vlad_elena_family', 'Замечательная семья! Очень дружелюбные и позитивные люди. Рекомендую знакомство!', true, false, NULL, false, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- ===========================================
-- ДОПОЛНИТЕЛЬНЫЕ КЛУБНЫЕ МЕРОПРИЯТИЯ (5 мероприятий)
-- ===========================================

INSERT INTO club_events (id, club_id, title, description, date, time, location, max_participants, current_participants, price, event_type, is_premium, auto_invite_enabled, avatar, images, duration_hours, end_date, created_at, updated_at) VALUES
(6, 1, 'Тематическая вечеринка "Ретро"', 'Ночная вечеринка в стиле 80-90х годов с живой музыкой и танцами. Дресс-код: ретро стиль.', NOW() + INTERVAL '12 days', '22:00:00', 'Клуб "Элит", танцпол', 60, 0, 2500.00, 'party', false, true, 'no_photo.jpg', '["no_photo.jpg"]', 5, NOW() + INTERVAL '12 days' + INTERVAL '5 hours', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

(7, 2, 'Гастрономический вечер', 'Дегустация блюд от шеф-повара с вином и живой музыкой. Идеально для романтического свидания.', NOW() + INTERVAL '15 days', '19:00:00', 'Ресторан "Вкус", VIP зал', 25, 0, 4500.00, 'dinner', true, true, 'no_photo.jpg', '["no_photo.jpg"]', 3, NOW() + INTERVAL '15 days' + INTERVAL '3 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours'),

(8, 3, 'Творческая встреча "Искусство"', 'Встреча с художниками и обсуждение современного искусства. Включает мастер-класс по живописи.', NOW() + INTERVAL '18 days', '18:00:00', 'Event Space "Пространство", зал 1', 35, 0, 1800.00, 'meeting', false, true, 'no_photo.jpg', '["no_photo.jpg"]', 4, NOW() + INTERVAL '18 days' + INTERVAL '4 hours', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 hour'),

(9, 1, 'Свинг-вечеринка "Страсть"', 'Эксклюзивная свинг-вечеринка для взрослых. Строго 21+. Предварительная регистрация обязательна.', NOW() + INTERVAL '25 days', '23:00:00', 'Клуб "Элит", приватный зал', 40, 0, 3000.00, 'party', true, false, 'no_photo.jpg', '["no_photo.jpg"]', 6, NOW() + INTERVAL '25 days' + INTERVAL '6 hours', NOW() - INTERVAL '5 days', NOW() - INTERVAL '30 minutes'),

(10, 2, 'Винный вечер', 'Дегустация редких вин с сырами и фруктами. Ведущий сомелье расскажет о каждом сорте.', NOW() + INTERVAL '30 days', '20:00:00', 'Ресторан "Вкус", винный погреб', 20, 0, 3500.00, 'dinner', false, true, 'no_photo.jpg', '["no_photo.jpg"]', 3, NOW() + INTERVAL '30 days' + INTERVAL '3 hours', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 hour');


-- ===========================================
-- ЗАВЕРШЕНИЕ
-- ===========================================

-- Обновляем статистику
UPDATE users SET online = NOW() WHERE id IN (1, 2, 4, 5);
UPDATE users SET online = NOW() - INTERVAL '1 hour' WHERE id = 3;

-- Выводим статистику
SELECT 'Заполнение базы данных завершено!' as status;
SELECT 'Пользователи: ' || COUNT(*) as users_count FROM users;
SELECT 'События: ' || COUNT(*) as events_count FROM events;
SELECT 'Объявления: ' || COUNT(*) as ads_count FROM ads;
SELECT 'Комментарии: ' || COUNT(*) as comments_count FROM profile_comments;
SELECT 'Клубные мероприятия: ' || COUNT(*) as club_events_count FROM club_events;