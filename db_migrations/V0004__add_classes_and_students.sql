CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  teacher_id INTEGER NOT NULL,
  school_year VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS class_students (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE homework ADD COLUMN IF NOT EXISTS class_id INTEGER;
ALTER TABLE homework ADD COLUMN IF NOT EXISTS teacher_id INTEGER;

ALTER TABLE grades ADD COLUMN IF NOT EXISTS class_id INTEGER;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS teacher_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_class ON homework(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_class ON grades(class_id);