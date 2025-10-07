CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS schedule (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  time_slot VARCHAR(20) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  teacher VARCHAR(255),
  classroom VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS homework (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  subject VARCHAR(255) NOT NULL,
  grade INTEGER NOT NULL,
  grade_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_user ON schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_homework_user ON homework(user_id);
CREATE INDEX IF NOT EXISTS idx_grades_user ON grades(user_id);