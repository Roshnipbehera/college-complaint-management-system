USE college_complaint_management;

-- Show all tables
SHOW TABLES;


-- Show users
SELECT * FROM users;


-- Show categories
SELECT * FROM categories;


-- Insert demo complaint
INSERT INTO complaints
(
    student_id,
    category_id,
    title,
    description,
    status
)

VALUES
(
    1,
    2,
    'Projector not working',
    'The projector in Room 204 is not functioning.',
    'Pending'
);


-- Show complaints
SELECT * FROM complaints;