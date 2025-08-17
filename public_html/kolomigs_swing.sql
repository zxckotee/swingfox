-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Ноя 25 2024 г., 22:56
-- Версия сервера: 5.7.21-20-beget-5.7.21-20-1-log
-- Версия PHP: 5.6.40

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `kolomigs_swing`
--

-- --------------------------------------------------------

--
-- Структура таблицы `likes`
--
-- Создание: Ноя 25 2024 г., 19:44
--

DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `id` bigint(20) NOT NULL,
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lifrom` text NOT NULL,
  `lito` text NOT NULL,
  `recip` text NOT NULL,
  `super` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `mails`
--
-- Создание: Ноя 25 2024 г., 19:44
--

DROP TABLE IF EXISTS `mails`;
CREATE TABLE `mails` (
  `id` bigint(20) NOT NULL,
  `email` text NOT NULL,
  `mess` text NOT NULL,
  `subject` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `subs`
--
-- Создание: Ноя 25 2024 г., 19:44
--

DROP TABLE IF EXISTS `subs`;
CREATE TABLE `subs` (
  `id` bigint(20) NOT NULL,
  `login` text NOT NULL,
  `level` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--
-- Создание: Ноя 25 2024 г., 19:53
-- Последнее обновление: Ноя 25 2024 г., 19:56
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `login` text NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `ava` text NOT NULL,
  `status` text NOT NULL,
  `city` text NOT NULL,
  `geo` text NOT NULL,
  `registration` text NOT NULL,
  `info` text NOT NULL,
  `online` text NOT NULL,
  `viptype` text NOT NULL,
  `images` text NOT NULL,
  `search_status` text NOT NULL,
  `search_age` text NOT NULL,
  `location` text NOT NULL,
  `mobile` text NOT NULL,
  `height` int(11) NOT NULL,
  `weight` int(11) NOT NULL,
  `smoking` text NOT NULL,
  `alko` text NOT NULL,
  `date` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `login`, `email`, `password`, `ava`, `status`, `city`, `geo`, `registration`, `info`, `online`, `viptype`, `images`, `search_status`, `search_age`, `location`, `mobile`, `height`, `weight`, `smoking`, `alko`, `date`) VALUES
(1732564004362, 'zxckotee', 'zxckotee@yandex.ru', '44445555', 'no_photo.jpg', 'Мужчина', 'Санкт-Петербург', '44.6089&&33.53', '1732564004', '123', '2024-11-25 22:46', 'free', '0', 'Семейная пара(М+Ж)', 'Возраст значения не имеет', 'У себя дома (пригласим к себе)', 'Не выезжаем(жаю) для встречи в другие города', 189, 93, 'Не курю и не переношу табачного дыма', 'Не употребляю вообще', '2002-10-12'),
(1716381109, 'maksonDev', 'skreeperboy@yandex.ru', '44445555', 'no_photo.jpg', 'Женщина', 'Санкт-Петербург', '44.6089&&33.53', '1732564004', '123', '2024-11-25 22:46', 'free', '0', 'Семейная пара(М+Ж)', 'Возраст значения не имеет', 'У себя дома (пригласим к себе)', 'Не выезжаем(жаю) для встречи в другие города', 169, 62, 'Не курю и не переношу табачного дыма', 'Не употребляю вообще', '2002-10-12');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
