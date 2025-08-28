'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Обновляем существующие статусы на русские названия
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET status = CASE 
        WHEN status = 'single_man' THEN 'Мужчина'
        WHEN status = 'single_woman' THEN 'Женщина'
        WHEN status = 'couple_mf' THEN 'Семейная пара(М+Ж)'
        WHEN status = 'couple_mm' THEN 'Мужчина'
        WHEN status = 'couple_ff' THEN 'Женщина'
        WHEN status = 'open_relationship' THEN 'Несемейная пара(М+Ж)'
        ELSE status
      END
      WHERE status IN ('single_man', 'single_woman', 'couple_mf', 'open_relationship')
        AND status NOT IN ('couple_mm', 'couple_ff')
    `);

    // Обновляем search_status на русские названия
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET search_status = CASE 
        WHEN search_status LIKE '%single_man%' THEN REPLACE(search_status, 'single_man', 'Мужчина')
        WHEN search_status LIKE '%single_woman%' THEN REPLACE(search_status, 'single_woman', 'Женщина')
        WHEN search_status LIKE '%couple_mf%' THEN REPLACE(search_status, 'couple_mf', 'Семейная пара(М+Ж)')
        WHEN search_status LIKE '%open_relationship%' THEN REPLACE(search_status, 'open_relationship', 'Несемейная пара(М+Ж)')
        ELSE search_status
      END
      WHERE search_status IS NOT NULL
        AND search_status NOT LIKE '%couple_mm%'
        AND search_status NOT LIKE '%couple_ff%'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Возвращаем английские названия
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET status = CASE 
        WHEN status = 'Мужчина' THEN 'single_man'
        WHEN status = 'Женщина' THEN 'single_woman'
        WHEN status = 'Семейная пара(М+Ж)' THEN 'couple_mf'
        WHEN status = 'Несемейная пара(М+Ж)' THEN 'open_relationship'
        ELSE status
      END
      WHERE status IN ('Мужчина', 'Женщина', 'Семейная пара(М+Ж)', 'Несемейная пара(М+Ж)')
    `);

    await queryInterface.sequelize.query(`
      UPDATE users 
      SET search_status = CASE 
        WHEN search_status LIKE '%Мужчина%' THEN REPLACE(search_status, 'Мужчина', 'single_man')
        WHEN search_status LIKE '%Женщина%' THEN REPLACE(search_status, 'Женщина', 'single_woman')
        WHEN search_status LIKE '%Семейная пара(М+Ж)%' THEN REPLACE(search_status, 'Семейная пара(М+Ж)', 'couple_mf')
        WHEN search_status LIKE '%Несемейная пара(М+Ж)%' THEN REPLACE(search_status, 'Несемейная пара(М+Ж)', 'open_relationship')
        ELSE search_status
      END
      WHERE search_status IS NOT NULL
        AND search_status NOT LIKE '%couple_mm%'
        AND search_status NOT LIKE '%couple_ff%'
    `);
  }
};
