ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_name VARCHAR(50);

UPDATE categories SET group_name = 'Health'    WHERE name IN ('Nutrition','Hydration','Sleep');
UPDATE categories SET group_name = 'Fitness'   WHERE name IN ('Workout','Recovery');
UPDATE categories SET group_name = 'Mindset'   WHERE name IN ('Mood','Motivation','Discipline');
UPDATE categories SET group_name = 'Learning'  WHERE name IN ('Reading','Learning');
UPDATE categories SET group_name = 'Productivity' WHERE name IN ('Focus','Deep Work');
