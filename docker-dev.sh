#!/bin/bash

# SwingFox Docker Development Environment Manager
# Скрипт для удобного управления Docker окружением

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверка зависимостей
check_dependencies() {
    print_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен. Установите Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose не установлен. Установите Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_success "Все зависимости установлены"
}

# Проверка занятых портов
check_ports() {
    print_info "Проверка портов..."
    local ports=(80 443 3001 5432 8025 9229)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            occupied_ports+=($port)
        fi
    done
    
    if [ ${#occupied_ports[@]} -gt 0 ]; then
        print_warning "Следующие порты заняты: ${occupied_ports[*]}"
        print_info "Для продолжения остановите процессы или измените порты в docker-compose.dev.yml"
        read -p "Продолжить? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "Все необходимые порты свободны"
    fi
}

# Сборка образов
build() {
    print_info "Сборка Docker образов..."
    docker-compose -f docker-compose.dev.yml build "$@"
    print_success "Сборка завершена"
}

# Запуск сервисов
start() {
    print_info "Запуск SwingFox development окружения..."
    
    # Создаем .env файл из .env.docker.dev если его нет
    if [ ! -f .env ]; then
        print_info "Создание .env файла из .env.docker.dev..."
        cp .env.docker.dev .env
    fi
    
    # Запускаем сервисы
    docker-compose up -d
    
    print_info "Ожидание готовности сервисов..."
    sleep 10
    
    # Проверяем статус
    if docker-compose ps | grep -q "Up"; then
        print_success "Сервисы запущены успешно!"
        print_info "URL для доступа:"
        echo "  🏠 Приложение: http://localhost"
        echo "  🔧 API: http://localhost/api"
        echo "  ⚛️  Frontend: https://localhost:443"
        echo "  🗄️  Backend: http://localhost:3001"
        echo "  📧 MailHog: http://localhost:8025"
        echo "  🐛 Debug: localhost:9229"
    else
        print_error "Ошибка при запуске сервисов"
        logs
        exit 1
    fi
}

# Остановка сервисов
stop() {
    print_info "Остановка сервисов..."
    docker-compose down
    print_success "Сервисы остановлены"
}

# Перезапуск сервисов
restart() {
    print_info "Перезапуск сервисов..."
    stop
    start
}

# Просмотр логов
logs() {
    if [ -z "$1" ]; then
        docker-compose logs -f
    else
        docker-compose logs -f "$1"
    fi
}

# Статус сервисов
status() {
    print_info "Статус сервисов:"
    docker-compose ps
}

# Выполнение миграций
migrate() {
    print_info "Выполнение миграций базы данных..."
    docker-compose exec backend npm run migrate
    print_success "Миграции выполнены"
}

# Подключение к контейнеру
shell() {
    local service=${1:-backend}
    print_info "Подключение к контейнеру $service..."
    docker-compose exec "$service" sh
}

# Установка пакетов
install() {
    local service=$1
    local package=$2
    
    if [ -z "$service" ] || [ -z "$package" ]; then
        print_error "Использование: $0 install <backend|frontend> <package-name>"
        exit 1
    fi
    
    print_info "Установка пакета $package в $service..."
    docker-compose exec "$service" npm install "$package"
    print_success "Пакет установлен"
}

# Очистка Docker
clean() {
    print_warning "Это удалит все остановленные контейнеры, неиспользуемые сети и образы"
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Очистка Docker..."
        docker system prune -f
        print_success "Очистка завершена"
    fi
}

# Помощь
help() {
    echo "SwingFox Docker Development Environment Manager"
    echo ""
    echo "Использование: $0 <команда> [аргументы]"
    echo ""
    echo "Команды:"
    echo "  check      - Проверка зависимостей и портов"
    echo "  build      - Сборка Docker образов"
    echo "  start      - Запуск всех сервисов"
    echo "  stop       - Остановка всех сервисов"
    echo "  restart    - Перезапуск всех сервисов"
    echo "  logs [service] - Просмотр логов (без аргумента - все сервисы)"
    echo "  status     - Статус сервисов"
    echo "  migrate    - Выполнение миграций БД"
    echo "  shell [service] - Подключение к контейнеру (по умолчанию backend)"
    echo "  install <service> <package> - Установка npm пакета"
    echo "  clean      - Очистка Docker (осторожно!)"
    echo "  help       - Эта справка"
    echo ""
    echo "Примеры:"
    echo "  $0 start                    # Запуск всего окружения"
    echo "  $0 logs backend             # Логи backend сервиса"
    echo "  $0 shell frontend           # Подключение к frontend контейнеру"
    echo "  $0 install backend express  # Установка express в backend"
}

# Основная логика
case "$1" in
    check)
        check_dependencies
        check_ports
        ;;
    build)
        check_dependencies
        docker-compose build "${@:2}"
        ;;
    start)
        check_dependencies
        check_ports
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs "$2"
        ;;
    status)
        status
        ;;
    migrate)
        migrate
        ;;
    shell)
        shell "$2"
        ;;
    install)
        install "$2" "$3"
        ;;
    clean)
        clean
        ;;
    help|--help|-h)
        help
        ;;
    "")
        print_error "Не указана команда"
        help
        exit 1
        ;;
    *)
        print_error "Неизвестная команда: $1"
        help
        exit 1
        ;;
esac