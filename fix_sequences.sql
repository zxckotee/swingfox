-- Скрипт для исправления последовательностей (sequences) в PostgreSQL
-- Выполните этот скрипт, если возникают ошибки уникального ограничения при создании записей

-- Сбрасываем последовательности для всех таблиц с автоинкрементными полями
-- Это устанавливает следующее значение последовательности равным максимальному ID + 1

-- Для таблицы users
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 0) + 1, false);

-- Для таблицы events  
SELECT setval('events_id_seq', COALESCE((SELECT MAX(id) FROM events), 0) + 1, false);

-- Для таблицы ads
SELECT setval('ads_id_seq', COALESCE((SELECT MAX(id) FROM ads), 0) + 1, false);

-- Для таблицы profile_comments
SELECT setval('profile_comments_id_seq', COALESCE((SELECT MAX(id) FROM profile_comments), 0) + 1, false);

-- Для таблицы club_events
SELECT setval('club_events_id_seq', COALESCE((SELECT MAX(id) FROM club_events), 0) + 1, false);

-- Для таблицы clubs (если есть)
SELECT setval('clubs_id_seq', COALESCE((SELECT MAX(id) FROM clubs), 0) + 1, false);

-- Проверяем текущие значения последовательностей
SELECT 'users_id_seq' as sequence_name, last_value FROM users_id_seq
UNION ALL
SELECT 'events_id_seq' as sequence_name, last_value FROM events_id_seq  
UNION ALL
SELECT 'ads_id_seq' as sequence_name, last_value FROM ads_id_seq
UNION ALL
SELECT 'profile_comments_id_seq' as sequence_name, last_value FROM profile_comments_id_seq
UNION ALL
SELECT 'club_events_id_seq' as sequence_name, last_value FROM club_events_id_seq
UNION ALL
SELECT 'clubs_id_seq' as sequence_name, last_value FROM clubs_id_seq;

-- Выводим максимальные ID в таблицах для сравнения
SELECT 'users' as table_name, MAX(id) as max_id FROM users
UNION ALL
SELECT 'events' as table_name, MAX(id) as max_id FROM events
UNION ALL  
SELECT 'ads' as table_name, MAX(id) as max_id FROM ads
UNION ALL
SELECT 'profile_comments' as table_name, MAX(id) as max_id FROM profile_comments
UNION ALL
SELECT 'club_events' as table_name, MAX(id) as max_id FROM club_events
UNION ALL
SELECT 'clubs' as table_name, MAX(id) as max_id FROM clubs;
