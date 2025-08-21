#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' 

echo -e "${BLUE}🚀 SwingFox Backend Starting...${NC}"

wait_for_db() {
    echo -e "${YELLOW}⏳ Ожидание готовности базы данных...${NC}"
    
    until pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} > /dev/null 2>&1; do
        echo -e "${YELLOW}   📡 Подключение к базе данных ${DB_HOST:-localhost}:${DB_PORT:-5432}...${NC}"
        sleep 2
    done
    
    echo -e "${GREEN}✅ База данных готова!${NC}"
}

run_migrations() {
    echo -e "${BLUE}📋 Запуск миграций...${NC}"
    
    if npm run migrate; then
        echo -e "${GREEN}✅ Миграции выполнены успешно!${NC}"
    else
        echo -e "${RED}❌ Ошибка выполнения миграций!${NC}"
        exit 1
    fi
}


run_seeders() {
    echo -e "${BLUE}🌱 Запуск seeders...${NC}"
    
    if npm run seed; then
        echo -e "${GREEN}✅ Seeders выполнены успешно!${NC}"
    else
        echo -e "${YELLOW}⚠️  Предупреждение: Некоторые seeders могли не выполниться (возможно, данные уже существуют)${NC}"
    fi
}

start_app() {
    echo -e "${BLUE}🎯 Запуск основного приложения...${NC}"
    
    if [ "$NODE_ENV" = "production" ]; then
        echo -e "${GREEN}🏭 Production режим${NC}"
        npm start
    else
        echo -e "${YELLOW}🔧 Development режим${NC}"
        npm run dev:backend
    fi
}


main() {
    echo -e "${BLUE}📊 Информация о среде:${NC}"
    echo -e "   🏠 NODE_ENV: ${NODE_ENV:-development}"
    echo -e "   🗄️  DB_HOST: ${DB_HOST:-localhost}"
    echo -e "   🔌 DB_PORT: ${DB_PORT:-5432}"
    echo -e "   👤 DB_USER: ${DB_USER:-postgres}"
    echo -e "   📦 DB_NAME: ${DB_NAME:-swingfox}"
    echo ""
    

    wait_for_db
    
    run_migrations
    
    run_seeders
    
    echo -e "${GREEN}🎉 Инициализация завершена!${NC}"
    echo ""
    
    start_app
}

main "$@"