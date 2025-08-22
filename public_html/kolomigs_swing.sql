-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Авг 17 2025 г., 19:26
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
-- Структура таблицы `ads`
--
-- Создание: Янв 20 2025 г., 18:19
--

DROP TABLE IF EXISTS `ads`;
CREATE TABLE `ads` (
  `id` bigint(20) NOT NULL,
  `login` text NOT NULL,
  `type` text NOT NULL,
  `desc` text NOT NULL,
  `country` text NOT NULL,
  `city` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `ads`
--

INSERT INTO `ads` (`id`, `login`, `type`, `desc`, `country`, `city`) VALUES
(1736197456130, 'zxckotee', 'Встречи', 'Всем привет!', 'Россия', 'Санкт-Петербург'),
(1736197483401, 'zxckotee', 'Все', 'Еще раз привет', 'Россия', 'Санкт-Петербург'),
(1736197494594, 'zxckotee', 'Все', 'Еще раз привет!', 'Россия', 'Санкт-Петербург'),
(1739686750834, 'Infinum', 'Все', 'Привет. Давайте знакомится', 'Беларусь', 'Минск'),
(1739686800133, 'Infinum', 'Все', 'Привет. Даай знакомится', 'Беларусь', 'Минск'),
(1741871313833, 'Infinum', 'Все', 'Тестируем работу', 'Беларусь', 'Минск'),
(1750103923599, 'Infinum', 'Встречи', 'квып', 'Беларусь', 'Минск'),
(1750107029111, 'Infinum', 'Все', '1234', 'Беларусь', 'Минск'),
(1750107034320, 'Infinum', 'Встречи', 'пиавпр', 'Беларусь', 'Минск'),
(1750108531714, 'Infinum', 'Все', 'аяып', 'Беларусь', 'Минск');

-- --------------------------------------------------------

--
-- Структура таблицы `a_t_c_club`
--
-- Создание: Янв 10 2025 г., 20:55
--

DROP TABLE IF EXISTS `a_t_c_club`;
CREATE TABLE `a_t_c_club` (
  `id` bigint(20) NOT NULL,
  `date` date NOT NULL,
  `info` text NOT NULL,
  `resp` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `a_t_c_club`
--

INSERT INTO `a_t_c_club` (`id`, `date`, `info`, `resp`) VALUES
(1736624617700, '2025-01-11', 'Normix club&&Россия&&Санкт-Петербург&&Москва, ул.Пушкина 1А&&zxckotee&&&&vk.com&&123', 1),
(1741871454078, '2025-03-13', 'SwingFox&&Россия&&Москва&&Центр&&Infinium&&Infinium&&&&Будем рады видеть вас в нашем клубе.', 0);

-- --------------------------------------------------------

--
-- Структура таблицы `chat`
--
-- Создание: Мар 16 2025 г., 11:13
--

DROP TABLE IF EXISTS `chat`;
CREATE TABLE `chat` (
  `id` bigint(20) NOT NULL,
  `by` text NOT NULL,
  `to` text NOT NULL,
  `mess` text NOT NULL,
  `img` text NOT NULL,
  `date` datetime NOT NULL,
  `read` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `chat`
--

-- --------------------------------------------------------

--
-- Структура таблицы `clubs`
--
-- Создание: Янв 20 2025 г., 18:19
--

DROP TABLE IF EXISTS `clubs`;
CREATE TABLE `clubs` (
  `id` bigint(20) NOT NULL,
  `name` text NOT NULL,
  `country` text NOT NULL,
  `city` text NOT NULL,
  `address` text NOT NULL,
  `owner` text NOT NULL,
  `admins` text NOT NULL,
  `links` text NOT NULL,
  `desc` text NOT NULL,
  `ava` text NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `clubs`
--

INSERT INTO `clubs` (`id`, `name`, `country`, `city`, `address`, `owner`, `admins`, `links`, `desc`, `ava`, `date`) VALUES
(1736626477497, 'Normix club', 'Россия', 'Санкт-Петербург', 'Москва, ул.Пушкина 1А', 'zxckotee', 'zxckotee', 'vk.com', '123', 'no_photo.jpg', '2025-01-11');

-- --------------------------------------------------------

--
-- Структура таблицы `events`
--
-- Создание: Янв 27 2025 г., 19:09
--

DROP TABLE IF EXISTS `events`;
CREATE TABLE `events` (
  `id` bigint(20) NOT NULL,
  `owner` text NOT NULL,
  `name` text NOT NULL,
  `desc` text NOT NULL,
  `date` date NOT NULL,
  `country` text NOT NULL,
  `city` text NOT NULL,
  `applics` text NOT NULL,
  `img` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `events`
--

INSERT INTO `events` (`id`, `owner`, `name`, `desc`, `date`, `country`, `city`, `applics`, `img`) VALUES
(1738005672427, '1736626477497', 'Новое!!', '1 24312 4123 213 чся пра ав р\nъапв рапв \nапв р\nавп авп равпр авппа \n а вп р па   впа\n орпар о   рап \n           рорпорпо\n\nоопрао', '2025-04-15', 'Россия', 'Севастополь', 'zxckotee&&maksonDev&&foxy', '1738005614909.png');

-- --------------------------------------------------------

--
-- Структура таблицы `geo`
--
-- Создание: Янв 12 2025 г., 20:12
--

DROP TABLE IF EXISTS `geo`;
CREATE TABLE `geo` (
  `country` text NOT NULL,
  `region` text NOT NULL,
  `city` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `geo`
--

INSERT INTO `geo` (`country`, `region`, `city`) VALUES
('Австралия', 'Виктория', 'Балларат'),
('Австралия', 'Виктория', 'Бендиго'),
('Австралия', 'Виктория', 'Варрнамбул'),
('Австралия', 'Виктория', 'Водонга'),
('Австралия', 'Виктория', 'Гилонг'),
-- временно сократили

-- --------------------------------------------------------

--
-- Структура таблицы `gifts`
--
-- Создание: Ноя 30 2024 г., 14:45
--

DROP TABLE IF EXISTS `gifts`;
CREATE TABLE `gifts` (
  `id` bigint(20) NOT NULL,
  `owner` text NOT NULL,
  `from` text NOT NULL,
  `gifttype` text NOT NULL,
  `date` date NOT NULL,
  `valide` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `gifts`
--

INSERT INTO `gifts` (`id`, `owner`, `from`, `gifttype`, `date`, `valide`) VALUES
(1733061110259, 'maksonDev', 'zxckotee', '4', '2024-12-01', 1),
(1733083524227, 'maksonDev', 'zxckotee', '4', '2024-12-01', 1),
(1733517007165, 'maksonDev', 'zxckotee', '1', '2024-12-06', 1),
(1735160391676, 'zxckotee', 'maksonDev', '1', '2024-12-25', 1),
(1735160396864, 'zxckotee', 'maksonDev', '1', '2024-12-25', 1),
(1743193592905, 'foxy', 'maksonDev', '2', '2025-03-28', 1),
(1743193597364, 'foxy', 'maksonDev', '2', '2025-03-28', 1),
(1743193598585, 'foxy', 'maksonDev', '2', '2025-03-28', 1),
(1743193598078, 'foxy', 'maksonDev', '2', '2025-03-28', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `img_likes`
--
-- Создание: Мар 26 2025 г., 20:36
--

DROP TABLE IF EXISTS `img_likes`;
CREATE TABLE `img_likes` (
  `id` int(11) NOT NULL,
  `from` text NOT NULL,
  `img` text NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `img_likes`
--

INSERT INTO `img_likes` (`id`, `from`, `img`, `date`) VALUES
(13, 'Infinum', '1743002754395.png', '2025-03-28'),
(15, 'maksonDev', '1743002754395.png', '2025-03-28'),
(16, 'Infinum', '1750103878611.png', '2025-06-16');

-- --------------------------------------------------------

--
-- Структура таблицы `likes`
--
-- Создание: Ноя 29 2024 г., 20:53
--

DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `id` bigint(20) NOT NULL,
  `date` date NOT NULL,
  `lifrom` text NOT NULL,
  `lito` text NOT NULL,
  `recip` text NOT NULL,
  `super` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `likes`
--

INSERT INTO `likes` (`id`, `date`, `lifrom`, `lito`, `recip`, `super`) VALUES
(1733061105440, '2024-12-01', 'zxckotee', 'maksonDev', 'no', 'Привет'),
(1733061116534, '2024-12-01', 'zxckotee', 'maksonDev', 'no', '0'),
(1733067338599, '2024-12-01', 'zxckotee', 'maksonDev', 'no', '0'),
(1733073244113, '2024-12-01', 'zxckotee', 'maksonDev', 'no', '123'),
(1733252610867, '2024-12-03', 'zxckotee', 'maksonDev', 'no', '0'),
(1735160131089, '2024-12-25', 'zxckotee', 'maksonDev', 'no', '123'),
(1735160385257, '2024-12-25', 'maksonDev', 'zxckotee', 'yes', '123'),
(1739686036486, '2025-02-16', 'Infinum', 'maksonDev', 'empty', '0'),
(1739686041386, '2025-02-16', 'Infinum', 'maksonDev', 'empty', '0'),
(1739686055880, '2025-02-16', 'Infinum', 'zxckotee', 'no', '0'),
(1739686060001, '2025-02-16', 'Infinum', 'maksonDev', 'empty', '0'),
(1739686066201, '2025-02-16', 'Infinum', 'zxckotee', 'no', '0'),
(1739686144544, '2025-02-16', 'Infinum', 'Parochka', 'yes', '0'),
(1739686148912, '2025-02-16', 'Infinum', 'Parochka', 'yes', '0'),
(1739686177942, '2025-02-16', 'Infinum', 'Parochka', 'yes', '0'),
(1739686194635, '2025-02-16', 'Infinum', 'Parochka', 'yes', 'Привет\n'),
(1739686439584, '2025-02-16', 'Parochka', 'zxckotee', 'no', 'Привет\n'),
(1739686442051, '2025-02-16', 'Parochka', 'zxckotee', 'no', '0'),
(1739686457862, '2025-02-16', 'Parochka', 'zxckotee', 'no', '0'),
(1741147997339, '2025-03-05', 'foxy', 'zxckotee', 'no', '0'),
(1741148019850, '2025-03-05', 'foxy', 'zxckotee', 'no', 'тестируем лайк'),
(1741148081662, '2025-03-05', 'foxy', 'zxckotee', 'no', '0'),
(1741148082030, '2025-03-05', 'foxy', 'zxckotee', 'no', '0'),
(1741148092418, '2025-03-05', 'foxy', 'zxckotee', 'no', 'тест\n'),
(1741793745003, '2025-03-12', 'Infinum', 'maksonDev', 'empty', '12354'),
(1741793750369, '2025-03-12', 'Infinum', 'maksonDev', 'empty', 'hgyfj'),
(1741873402691, '2025-03-13', 'Parochka', 'maksonDev', 'empty', '0'),
(1741873404906, '2025-03-13', 'Parochka', 'zxckotee', 'no', '0'),
(1741873405803, '2025-03-13', 'Parochka', 'maksonDev', 'empty', '0'),
(1741873407545, '2025-03-13', 'Parochka', 'zxckotee', 'no', '0'),
(1743193586408, '2025-03-28', 'maksonDev', 'foxy', 'empty', '0'),
(1743193587942, '2025-03-28', 'maksonDev', 'foxy', 'empty', '0');

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

--
-- Дамп данных таблицы `mails`
--

INSERT INTO `mails` (`id`, `email`, `mess`, `subject`) VALUES
(1738675940312, 'info@oncasting.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Не кому не сообщайте код из письма!&&787167', 'Подтверждение кода из письма'),
(1738697864807, 'kwantoriuma@yandex.', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&285027', 'Подтверждение кода из письма'),
(1738698328474, 'nikinika@yandex.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&850930', 'Подтверждение кода из письма'),
(1738698517274, 'zxckotee@yandex.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&658995', 'Подтверждение кода из письма'),
(1738698708281, 'zxckotee@yandex.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&302743', 'Подтверждение кода из письма'),
(1738761333598, 'sofia@oncasting.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&574042', 'Подтверждение кода из письма'),
(1738765411131, 'nikinika@yandex.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&412528', 'Подтверждение кода из письма'),
(1738765555094, 'nikinika@yandex.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&078354', 'Подтверждение кода из письма'),
(1738765746901, 'skreeperboy@gmail.com', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&235495', 'Подтверждение кода из письма'),
(1738765897980, 'skreeperboy@gmail.com', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&924142', 'Подтверждение кода из письма'),
(1738765900423, 'skreeperboy@gmail.com', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&446325', 'Подтверждение кода из письма'),
(1738766003285, 'skreeperboy@gmail.com', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&049738', 'Подтверждение кода из письма'),
(1738766139937, 'zxckotee@yandex.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&036957', 'Подтверждение кода из письма'),
(1738766469741, 'skreeperboy@gmail.com', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&396155', 'Подтверждение кода из письма'),
(1738766620088, 'skreeperboy@gmail.com', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&392972', 'Подтверждение кода из письма'),
(1738766741494, 'skreeperboy@gmail.com', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&271086', 'Подтверждение кода из письма'),
(1738846784067, 'sofia@oncasting.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&279406', 'Подтверждение кода из письма'),
(1738847127769, 'sofia@oncasting.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&881601', 'Подтверждение кода из письма'),
(1739685558073, 'infinum@oncasting.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&535906', 'Подтверждение кода из письма'),
(1741147455875, 'infinum@oncasting.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&215069', 'Подтверждение кода из письма'),
(1741147708664, 'foxy@oncasting.ru', 'Кто-то пытается использовать вашу почту на сайте swingfox.ru. Код необходим для подтверждения почты на сайте. Никому не сообщайте код из письма!&&260170', 'Подтверждение кода из письма');

-- --------------------------------------------------------

--
-- Структура таблицы `moders`
--
-- Создание: Янв 10 2025 г., 20:25
--

DROP TABLE IF EXISTS `moders`;
CREATE TABLE `moders` (
  `id` bigint(20) NOT NULL,
  `login` text NOT NULL,
  `password` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `moders`
--

INSERT INTO `moders` (`id`, `login`, `password`) VALUES
(123, 'zxckotee', '44445555');

-- --------------------------------------------------------

--
-- Структура таблицы `notifs`
--
-- Создание: Дек 25 2024 г., 20:31
--

DROP TABLE IF EXISTS `notifs`;
CREATE TABLE `notifs` (
  `id` bigint(20) NOT NULL,
  `by` text NOT NULL,
  `to` text NOT NULL,
  `type` text NOT NULL,
  `mess` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `notifs`
--

INSERT INTO `notifs` (`id`, `by`, `to`, `type`, `mess`) VALUES
(1735160131089, 'zxckotee', 'superlike', 'maksonDev', '0'),
(1735160385257, 'maksonDev', 'zxckotee', 'superlike', '123'),
(1735246036248, 'zxckotee', 'maksonDev', 'like', '0'),
(1739686036486, 'Infinum', 'maksonDev', 'like', '0'),
(1739686041386, 'Infinum', 'maksonDev', 'like', '0'),
(1739686055880, 'Infinum', 'zxckotee', 'like', '0'),
(1739686060001, 'Infinum', 'maksonDev', 'like', '0'),
(1739686066201, 'Infinum', 'zxckotee', 'like', '0'),
(1739686144544, 'Infinum', 'Parochka', 'like', '0'),
(1739686148912, 'Infinum', 'Parochka', 'like', '0'),
(1739686177942, 'Infinum', 'Parochka', 'like', '0'),
(1739686194635, 'Infinum', 'Parochka', 'superlike', 'Привет\n'),
(1739686439584, 'Parochka', 'zxckotee', 'superlike', 'Привет\n'),
(1739686442051, 'Parochka', 'zxckotee', 'like', '0'),
(1739686457862, 'Parochka', 'zxckotee', 'like', '0'),
(1739686484879, 'Parochka', 'Infinum', 'like', '0'),
(1741147997339, 'foxy', 'zxckotee', 'like', '0'),
(1741148019850, 'foxy', 'zxckotee', 'superlike', 'тестируем лайк'),
(1741148081662, 'foxy', 'zxckotee', 'like', '0'),
(1741148082030, 'foxy', 'zxckotee', 'like', '0'),
(1741148092418, 'foxy', 'zxckotee', 'superlike', 'тест\n'),
(1741793745003, 'Infinum', 'maksonDev', 'superlike', '12354'),
(1741793750369, 'Infinum', 'maksonDev', 'superlike', 'hgyfj'),
(1741873402691, 'Parochka', 'maksonDev', 'like', '0'),
(1741873404906, 'Parochka', 'zxckotee', 'like', '0'),
(1741873405803, 'Parochka', 'maksonDev', 'like', '0'),
(1741873407545, 'Parochka', 'zxckotee', 'like', '0'),
(1743193586408, 'maksonDev', 'foxy', 'like', '0'),
(1743193587942, 'maksonDev', 'foxy', 'like', '0');

-- --------------------------------------------------------

--
-- Структура таблицы `rating`
--
-- Создание: Мар 12 2025 г., 21:14
--

DROP TABLE IF EXISTS `rating`;
CREATE TABLE `rating` (
  `id` int(11) NOT NULL,
  `from` text NOT NULL,
  `to` text NOT NULL,
  `value` int(11) NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `rating`
--

INSERT INTO `rating` (`id`, `from`, `to`, `value`, `date`) VALUES
(2, 'maksonDev', 'zxckotee', 1, '2025-03-13'),
(3, 'Infinum', 'Parochka', -1, '2025-03-28'),
(4, 'Infinum', 'maksonDev', 1, '2025-03-28'),
(5, 'maksonDev', 'Parochka', -1, '2025-03-26'),
(6, 'maksonDev', 'foxy', 1, '2025-03-26'),
(7, 'Infinum', 'foxy', 1, '2025-03-28'),
(8, 'maksonDev', 'Infinum', 1, '2025-03-27'),
(9, 'maksonDev', 'maksonDev', 1, '2025-04-12');

-- --------------------------------------------------------

--
-- Структура таблицы `reactions`
--
-- Создание: Мар 03 2025 г., 19:40
--

DROP TABLE IF EXISTS `reactions`;
CREATE TABLE `reactions` (
  `id` int(11) NOT NULL,
  `login` text NOT NULL,
  `img` text NOT NULL,
  `value` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `status`
--
-- Создание: Янв 04 2025 г., 19:27
--

DROP TABLE IF EXISTS `status`;
CREATE TABLE `status` (
  `time` bigint(20) NOT NULL,
  `login` text NOT NULL,
  `type` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `status`
--
-- сократили

-- --------------------------------------------------------

--
-- Структура таблицы `subs`
--
-- Создание: Ноя 30 2024 г., 13:41
--

DROP TABLE IF EXISTS `subs`;
CREATE TABLE `subs` (
  `id` bigint(20) NOT NULL,
  `login` text NOT NULL,
  `viptype` text NOT NULL,
  `date` date NOT NULL,
  `auto` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `subs`
--

INSERT INTO `subs` (`id`, `login`, `viptype`, `date`, `auto`) VALUES
(123, 'zxckotee', 'PREMIUM', '2025-07-05', 0),
(1234, 'maksonDev', 'PREMIUM', '2025-05-05', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--
-- Создание: Фев 05 2025 г., 14:46
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `login` text NOT NULL,
  `email` text NOT NULL,
  `password` text NOT NULL,
  `ava` text NOT NULL,
  `status` text NOT NULL,
  `country` text NOT NULL,
  `city` text NOT NULL,
  `geo` text NOT NULL,
  `registration` date NOT NULL,
  `info` text NOT NULL,
  `online` text NOT NULL,
  `viptype` text NOT NULL,
  `images` text NOT NULL,
  `search_status` text NOT NULL,
  `search_age` text NOT NULL,
  `location` text NOT NULL,
  `mobile` text NOT NULL,
  `height` text NOT NULL,
  `weight` text NOT NULL,
  `smoking` text NOT NULL,
  `alko` text NOT NULL,
  `date` text NOT NULL,
  `balance` int(11) NOT NULL,
  `locked_images` text NOT NULL,
  `images_password` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `login`, `email`, `password`, `ava`, `status`, `country`, `city`, `geo`, `registration`, `info`, `online`, `viptype`, `images`, `search_status`, `search_age`, `location`, `mobile`, `height`, `weight`, `smoking`, `alko`, `date`, `balance`, `locked_images`, `images_password`) VALUES
(1732564004362, 'zxckotee', 'zxckotee@yandex.ru', '44445555', '1734719996254.png', 'Семейная пара(М+Ж)', 'Россия', 'Севастополь', '44.6089&&33.53', '2025-02-06', '123', '2024-11-25 22:46', 'FREE', '', 'Семейная пара(М+Ж)', 'Возраст значения не имеет', 'У себя дома (пригласим к себе)', 'Не выезжаем(жаю) для встречи в другие города', '141_141', '40_40', 'Не курю и не переношу табачного дыма_Не курю и не переношу табачного дыма', 'Не употребляю вообще_Не употребляю вообще', '2002-11-12_2001-11-12', 10578, '', ''),
(1716381109, 'maksonDev', 'skreeperboy@yandex.ru', '44445555', 'no_photo.jpg', 'Женщина', 'Россия', 'Санкт-Петербург', '14.3089&&52.52', '2025-02-06', '123', '2024-11-25 22:46', 'PREMIUM', '1743002754395.png', 'Семейная пара(М+Ж)', 'Возраст значения не имеет', 'У себя дома (пригласим к себе)', 'Не выезжаем(жаю) для встречи в другие города', '169', '62', 'Не курю и не переношу табачного дыма', 'Не употребляю вообще', '2002-10-12', 11940, '', '123'),
(1738847262884, 'Parochka', 'sofia@oncasting.ru', 'Bumer8182!.!', '1738847446812.png', 'Семейная пара(М+Ж)', 'Россия', 'Новосибирск', '55.0386&&82.9425', '2025-02-06', 'Тестируем данный сайт', '2025-02-06 16:07', 'VIP', '1738848267968.png&&1738848275581.png&&1738848281188.png&&1738848289699.png&&1738848298269.png', 'Семейная пара(М+Ж)&&Несемейная пара(М+Ж)&&Женщина', 'С ровестниками или с разницей +/- 5 лет', 'У себя дома (пригласим к себе)&&У вас дома (примем приглашение)&&В свинг-клубе или на закрытой вечеринке&&В сауне&&В гостинице или на съемной квартире', 'Приезд возможен, если расстояние не превышает 100км.', '180_160', '100_50', 'Курю, но могу обойтись какое-то время без сигарет_Курю, но могу обойтись какое-то время без сигарет', 'Умеренно, до легкого опьянения, контролирую свое поведение_Умеренно, до легкого опьянения, контролирую свое поведение', '1990-12-14_1993-06-04', 0, '1738851667605.png&&1738851676646.png&&1738851687594.png&&1738851726036.png&&1738851744782.png', '1234'),
(1739685726077, 'Infinum', 'infinum@oncasting.ru', 'Bumer8182!.!', '1739685768507.png', 'Семейная пара(М+Ж)', 'Беларусь', 'Минск', '55.0386&&82.9425', '2025-02-16', 'Тестируем сайт.', '2025-02-16 09:02', 'VIP', '1739685751616.png&&1739685780472.png&&1739685791918.png&&1739685801131.png&&1739685810791.png&&1750103878611.png', 'Семейная пара(М+Ж)&&Несемейная пара(М+Ж)&&Мужчина&&Женщина', 'С ровестниками или с разницей +/- 5 лет', 'У себя дома (пригласим к себе)&&У вас дома (примем приглашение)&&В свинг-клубе или на закрытой вечеринке&&В сауне&&В гостинице или на съемной квартире', 'Приезд возможен, если расстояние не превышает 100км.', '190_167', '107_55', 'Не курю, но терпимо отношусь к табачному дыму_Не курю, но терпимо отношусь к табачному дыму', 'В незначительных дозах, количество выпитого не отражается на моем поведении_Умеренно, до легкого опьянения, контролирую свое поведение', '1984-10-04_1998-02-15', 0, '1739685834867.png&&1739685842435.png&&1739685852388.png&&1739685863105.png&&1739685871684.png', '1234'),
(1741147755923, 'foxy', 'foxy@oncasting.ru', 'Bumer8182!.!', '1741147850752.png', 'Семейная пара(М+Ж)', 'Россия', 'Ростов-на-Дону', '55.0386&&82.9425', '2025-03-05', ' Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу Тестируем страницу', '2025-03-05 07:09', 'VIP', '1741147787664.png&&1741147798218.png&&1741147808837.png&&1741147818702.png&&1741147831344.png', 'Семейная пара(М+Ж)&&Несемейная пара(М+Ж)&&Мужчина&&Женщина', 'С ровестниками', 'У себя дома (пригласим к себе)&&У вас дома (примем приглашение)&&В свинг-клубе или на закрытой вечеринке&&В сауне&&В гостинице или на съемной квартире', 'Расстояние не помеха', '184_163', '83_52', 'Не курю, но терпимо отношусь к табачному дыму_Курю, но могу обойтись какое-то время без сигарет', 'В незначительных дозах, количество выпитого не отражается на моем поведении_Умеренно, до легкого опьянения, контролирую свое поведение', '1990-10-07_1991-09-03', 0, '1741147953347.png&&1741147961384.png&&1741147970514.png&&1741147979332.png', '1234');

-- --------------------------------------------------------

--
-- Структура таблицы `visits`
--
-- Создание: Фев 02 2025 г., 19:51
--

DROP TABLE IF EXISTS `visits`;
CREATE TABLE `visits` (
  `id` bigint(20) NOT NULL,
  `who` text NOT NULL,
  `whom` text NOT NULL,
  `date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `visits`
--

INSERT INTO `visits` (`id`, `who`, `whom`, `date`) VALUES
(1741897986612, 'zxckotee', 'maksonDev', '2025-03-13 23:33:06');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `img_likes`
--
ALTER TABLE `img_likes`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `rating`
--
ALTER TABLE `rating`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `reactions`
--
ALTER TABLE `reactions`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `visits`
--
ALTER TABLE `visits`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `img_likes`
--
ALTER TABLE `img_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT для таблицы `rating`
--
ALTER TABLE `rating`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT для таблицы `reactions`
--
ALTER TABLE `reactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
