CREATE DATABASE IF NOT EXISTS college_complaint_management;

USE college_complaint_management;


-- ==========================================
-- USERS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS users (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role ENUM('student', 'staff', 'admin')
        DEFAULT 'student',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- CATEGORIES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS categories (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


-- ==========================================
-- COMPLAINTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS complaints (

    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    category_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,

    description TEXT NOT NULL,

    status ENUM(
        'Pending',
        'Assigned',
        'In Progress',
        'Resolved',
        'Rejected'
    ) DEFAULT 'Pending',

    assigned_to INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    -- Student relationship
    CONSTRAINT fk_complaint_student

        FOREIGN KEY (student_id)

        REFERENCES users(id)

        ON DELETE CASCADE,


    -- Category relationship
    CONSTRAINT fk_complaint_category

        FOREIGN KEY (category_id)

        REFERENCES categories(id)

        ON DELETE RESTRICT,


    -- Staff relationship
    CONSTRAINT fk_complaint_staff

        FOREIGN KEY (assigned_to)

        REFERENCES users(id)

        ON DELETE SET NULL

);


-- ==========================================
-- INSERT CATEGORIES
-- ==========================================

INSERT IGNORE INTO categories
(name, description)

VALUES

(
    'Academic',
    'Issues related to classes, faculty and academics'
),

(
    'Infrastructure',
    'Issues related to classrooms, labs and campus facilities'
),

(
    'Hostel',
    'Issues related to hostel facilities'
),

(
    'Transport',
    'Issues related to college transportation'
),

(
    'Other',
    'Other college-related complaints'
);


-- ==========================================
-- INSERT DEMO USERS
-- ==========================================

INSERT IGNORE INTO users
(name, email, password, role)

VALUES

(
    'Demo Student',
    'student@college.com',
    'demo123',
    'student'
),

(
    'Demo Staff',
    'staff@college.com',
    'demo123',
    'staff'
),

(
    'Demo Admin',
    'admin@college.com',
    'demo123',
    'admin'
);