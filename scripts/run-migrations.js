const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Запуск миграций для SwingFox...');

const migrations = [
  '20250102000001-complete-clubs-model.js',
  '20250102000002-add-event-link-to-ads.js',
  '20250102000003-create-event-participants.js',
  '20250102000004-fix-clubs-id-auto-increment.js',
  '20250102000005-add-club-id-to-events.js'
];

try {
  for (const migration of migrations) {
    console.log(`📋 Выполняем миграцию для ${migration}...`);
    execSync(`npx sequelize-cli db:migrate --to ${migration}`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  }

  console.log('✅ Все миграции выполнены успешно!');
  console.log('💡 Теперь можно запускать сервер.');

} catch (error) {
  console.error('❌ Ошибка при выполнении миграций:', error.message);
  process.exit(1);
}
