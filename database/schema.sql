-- ==============================================================================
-- College Complaint Management System
-- Database Schema & Initial Seed Data
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS college_complaint_management;
USE college_complaint_management;

-- Disable foreign key checks during schema creation/migration
SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================================================
-- 1. ROLES TABLE
-- ==============================================================================
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
  role_id INT NOT NULL AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id),
  UNIQUE KEY uq_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==============================================================================
-- 2. USERS TABLE
-- ==============================================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  user_id INT NOT NULL AUTO_INCREMENT,
  role_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT '1',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_email (email),
  KEY idx_users_role (role_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (role_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==============================================================================
-- 3. CATEGORIES TABLE
-- ==============================================================================
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
  category_id INT NOT NULL AUTO_INCREMENT,
  category_name VARCHAR(100) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  is_active TINYINT(1) DEFAULT '1',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_category_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==============================================================================
-- 4. COMPLAINTS TABLE
-- ==============================================================================
DROP TABLE IF EXISTS complaints;
CREATE TABLE complaints (
  complaint_id INT NOT NULL AUTO_INCREMENT,
  complaint_code VARCHAR(30) NOT NULL,
  student_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('LOW','MEDIUM','HIGH','URGENT') DEFAULT 'MEDIUM',
  status ENUM('SUBMITTED','UNDER_REVIEW','ASSIGNED','IN_PROGRESS','AWAITING_RESPONSE','RESOLVED','CLOSED','REJECTED') DEFAULT 'SUBMITTED',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  closed_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (complaint_id),
  UNIQUE KEY uq_complaint_code (complaint_code),
  KEY idx_complaints_student (student_id),
  KEY idx_complaints_category (category_id),
  KEY idx_complaints_status (status),
  CONSTRAINT fk_complaints_category FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_complaints_student FOREIGN KEY (student_id) REFERENCES users (user_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==============================================================================
-- 5. COMPLAINT STATUS HISTORY TABLE
-- ==============================================================================
DROP TABLE IF EXISTS complaint_status_history;
CREATE TABLE complaint_status_history (
  history_id INT NOT NULL AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  old_status VARCHAR(50) DEFAULT NULL,
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NOT NULL,
  remarks TEXT,
  changed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (history_id),
  KEY idx_history_complaint (complaint_id),
  KEY fk_history_user (changed_by),
  CONSTRAINT fk_history_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user FOREIGN KEY (changed_by) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==============================================================================
-- 6. COMPLAINT ASSIGNMENTS TABLE
-- ==============================================================================
DROP TABLE IF EXISTS complaint_assignments;
CREATE TABLE complaint_assignments (
  assignment_id INT NOT NULL AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  staff_id INT NOT NULL,
  assigned_by INT NOT NULL,
  assigned_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  unassigned_at TIMESTAMP NULL DEFAULT NULL,
  is_current TINYINT(1) DEFAULT '1',
  PRIMARY KEY (assignment_id),
  KEY idx_assignments_complaint (complaint_id),
  KEY idx_assignments_staff (staff_id),
  KEY fk_assignment_admin (assigned_by),
  CONSTRAINT fk_assignment_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_staff FOREIGN KEY (staff_id) REFERENCES users (user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_assignment_admin FOREIGN KEY (assigned_by) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ==============================================================================
-- 7. COMMENTS TABLE
-- ==============================================================================
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
  comment_id INT NOT NULL AUTO_INCREMENT,
  complaint_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id),
  KEY idx_comments_complaint (complaint_id),
  KEY fk_comments_user (user_id),
  CONSTRAINT fk_comments_complaint FOREIGN KEY (complaint_id) REFERENCES complaints (complaint_id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;


-- ==============================================================================
-- SEED INITIAL DATA
-- ==============================================================================

-- 1. Roles
INSERT INTO roles (role_id, role_name) VALUES
  (1, 'STUDENT'),
  (2, 'STAFF'),
  (3, 'ADMIN')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- 2. Categories
INSERT INTO categories (category_id, category_name, description, is_active) VALUES
  (1, 'Academic', 'Academic issues, classroom scheduling, course material, examinations', 1),
  (2, 'Infrastructure', 'Classrooms, benches, fans, lighting, projectors, water supply', 1),
  (3, 'Hostel', 'Hostel rooms, cleanliness, mess food, electricity and plumbing', 1),
  (4, 'Transport', 'College bus timings, routes, driver conduct, seat allocation', 1),
  (5, 'Library', 'Book availability, digital library access, study room atmosphere', 1),
  (6, 'Laboratory', 'Lab equipment, chemical availability, computer hardware/software', 1),
  (7, 'Faculty', 'Faculty availability, guidance, mentorship issues', 1),
  (8, 'Examination', 'Admit cards, exam dates, marks evaluation, result queries', 1),
  (9, 'Fees', 'Fee receipts, scholarship disbursement, fine queries', 1),
  (10, 'IT/Technical', 'Campus Wi-Fi, portal login, email credentials, lab network', 1),
  (11, 'Other', 'General campus grievances and other issues', 1)
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name), description = VALUES(description);

-- 3. Demo Users (Passwords hashed with bcrypt 10 rounds)
-- Student: student@college.com / Student@123
-- Staff:   staff@college.com   / Staff@123
-- Admin:   admin@college.com   / Admin@123
INSERT INTO users (user_id, role_id, full_name, email, password_hash, phone, is_active) VALUES
  (1, 1, 'Demo Student', 'student@college.com', '$2b$10$FsVUFQC1te5Db7xMOy4yiej2JjSzf.rnbk8AxXZJoVQ0iCK0IgcYa', '9876543210', 1),
  (2, 2, 'Demo Staff',   'staff@college.com',   '$2b$10$7Z2vJp9l.06kRkHqC0Q7b.07D4QhL17xG1fLg1N2s0R2E7vK1t0C.', '9876543211', 1),
  (3, 3, 'Demo Admin',   'admin@college.com',   '$2b$10$wO8h0zBqNqg5mRkQv8A7j.a2WqK9tH6u8e7Y0t4s1D5f3G2h1J0K.', '9876543212', 1)
ON DUPLICATE KEY UPDATE 
  full_name = VALUES(full_name),
  password_hash = VALUES(password_hash),
  role_id = VALUES(role_id);

-- 4. Sample Demo Complaints
INSERT INTO complaints (complaint_id, complaint_code, student_id, category_id, title, description, priority, status) VALUES
  (1, 'CMP-DEMO-001', 1, 2, 'Projector in Room 204 not working', 'The ceiling projector flickers continuously and fails to connect with HDMI in Room 204.', 'MEDIUM', 'SUBMITTED'),
  (2, 'CMP-DEMO-002', 1, 10, 'Hostel Wi-Fi down on 2nd Floor', 'The wireless access point in Block B 2nd floor has been offline since yesterday morning.', 'HIGH', 'IN_PROGRESS'),
  (3, 'CMP-DEMO-003', 1, 5, 'Reference books missing for Data Structures', 'Required textbook by Tanenbaum is missing in the central library reference section.', 'LOW', 'RESOLVED')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  priority = VALUES(priority),
  status = VALUES(status);