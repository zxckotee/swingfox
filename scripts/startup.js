#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Цвета для консоли
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Функция для ожидания базы данных
const waitForDatabase = async () => {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5432';
  const dbUser = process.env.DB_USER || 'postgres';
  
  log('yellow', '⏳ Ожидание готовности базы данных...');
  
  let connected = false;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (!connected && attempts < maxAttempts) {
    try {
      execSync(`pg_isready -h ${dbHost} -p ${dbPort} -U ${dbUser}`, { 
        stdio: 'pipe',
        timeout: 5000 
      });
      connected = true;
      log('green', '✅ База данных готова!');
    } catch (error) {
      attempts++;
      log('yellow', `   📡 Подключение к базе данных ${dbHost}:${dbPort}... (попытка ${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!connected) {
    log('red', '❌ Не удалось подключиться к базе данных!');
    process.exit(1);
  }
};

// Функция для запуска миграций
const runMigrations = () => {
  log('blue', '📋 Запуск миграций...');
  
  try {
    execSync('npm run migrate', { stdio: 'pipe' });
    log('green', '✅ Миграции выполнены успешно!');
    return true;
  } catch (error) {
    const errorOutput = error.stderr ? error.stderr.toString() : error.message;
    
    // Проверяем, не является ли ошибка связанной с уже существующими объектами
    if (errorOutput.includes('already exists') ||
        errorOutput.includes('already exist') ||
        errorOutput.includes('relation') && errorOutput.includes('already exists')) {
      log('yellow', '⚠️  Некоторые объекты базы данных уже существуют - продолжаем работу');
      log('green', '✅ Миграции завершены (с предупреждениями)');
      return true;
    } else {
      log('red', '❌ Критическая ошибка миграций!');
      console.error(errorOutput);
      return false;
    }
  }
};

// Функция для инициализации geo данных
const initializeGeoData = () => {
  log('blue', '🌍 Инициализация географических данных...');
  
  try {
    execSync('node scripts/init-geo.js', { stdio: 'inherit' });
    log('green', '✅ Географические данные инициализированы!');
  } catch (error) {
    log('yellow', '⚠️  Предупреждение: Ошибка инициализации geo данных');
    console.warn(error.message);
  }
};

// Функция для запуска остальных seeders
const runSeeders = () => {
  log('blue', '🌱 Запуск остальных seeders...');
  
  try {
    execSync('npm run seed', { stdio: 'pipe' });
    log('green', '✅ Seeders выполнены успешно!');
  } catch (error) {
    log('yellow', '⚠️  Предупреждение: Некоторые seeders могли не выполниться (возможно, данные уже существуют)');
  }
};

// Функция для запуска основного приложения
const startApplication = () => {
  log('blue', '🎯 Запуск основного приложения...');
  
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    log('green', '🏭 Production режим');
    spawn('npm', ['start'], { stdio: 'inherit' });
  } else {
    log('yellow', '🔧 Development режим');
    spawn('nodemon', ['--inspect=0.0.0.0:9229', 'server.js'], { stdio: 'inherit' });
  }
};

// Основная функция
const main = async () => {
  try {
    log('blue', '🚀 SwingFox Backend Starting...');
    
    // Информация о среде
    log('blue', '📊 Информация о среде:');
    console.log(`   🏠 NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   🗄️  DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   🔌 DB_PORT: ${process.env.DB_PORT || '5432'}`);
    console.log(`   👤 DB_USER: ${process.env.DB_USER || 'postgres'}`);
    console.log(`   📦 DB_NAME: ${process.env.DB_NAME || 'swingfox'}`);
    console.log('');
    
    // Ожидание базы данных
    await waitForDatabase();
    
    // Запуск миграций
    const migrationsOk = runMigrations();
    
    // Инициализация географических данных (независимо от результата миграций)
    initializeGeoData();
    
    // Запуск остальных seeders
    runSeeders();
    
    if (!migrationsOk) {
      log('yellow', '⚠️  Миграции выполнены с ошибками, но приложение запускается');
    }
    
    log('green', '🎉 Инициализация завершена!');
    console.log('');
    
    // Запуск основного приложения
    startApplication();
    
  } catch (error) {
    log('red', `❌ Ошибка инициализации: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

// Обработка сигналов завершения
process.on('SIGINT', () => {
  log('yellow', '\n🛑 Получен сигнал SIGINT, завершение работы...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('yellow', '\n🛑 Получен сигнал SIGTERM, завершение работы...');
  process.exit(0);
});

// Запуск основной функции
main().catch(error => {
  log('red', `❌ Критическая ошибка: ${error.message}`);
  console.error(error);
  process.exit(1);
});