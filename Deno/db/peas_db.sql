-- Create roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

-- Create credentials table
CREATE TABLE credentials (
    school_id VARCHAR(50) PRIMARY KEY,
    password TEXT NOT NULL,
    role INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE
);

-- Create departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    cbit BOOLEAN DEFAULT false,
    cons BOOLEAN DEFAULT false,
    casee BOOLEAN DEFAULT false,
    baed BOOLEAN DEFAULT false,
    faculty BOOLEAN DEFAULT false,
    staff BOOLEAN DEFAULT false,
    grad_school BOOLEAN DEFAULT false
);

-- Create admins table
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    school_id VARCHAR(50) UNIQUE NOT NULL REFERENCES credentials(school_id),
    department_id INT REFERENCES departments(id) ON DELETE SET NULL
);

-- Create authors table
CREATE TABLE Authors (
    author_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    affiliation VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    year_of_graduation INT NULL,
    email VARCHAR(255) NULL,
    linkedin VARCHAR(255) NULL,
    orcid_id VARCHAR(255) NULL,
    bio TEXT NULL,
    profile_picture VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON Authors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

-- Create topics table
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    topic_name VARCHAR(100) NOT NULL
);

-- Create documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255),
    author VARCHAR(255),
    category VARCHAR(100),
    pages INT,
    publication_date DATE,
    location_path TEXT,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL
);

-- Create document_topics table
CREATE TABLE document_topics (
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    topic_id INT REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, topic_id)
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    school_id VARCHAR(50) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    saved_documents TEXT[],
    history TEXT[],
    first_name VARCHAR(50),
    middle_name VARCHAR(50),
    last_name VARCHAR(50)
);

-- Create saved_documents table
CREATE TABLE saved_documents (
    id SERIAL PRIMARY KEY,
    school_id VARCHAR(50) REFERENCES users(school_id) ON DELETE CASCADE,
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    date_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tokens table
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    user_id VARCHAR(50) REFERENCES users(school_id) ON DELETE CASCADE,
    user_role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_permissions table
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    document_id INT REFERENCES documents(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false
);

-- Insert roles
INSERT INTO public.roles (id, role_name) VALUES (1, 'Isadmin');
INSERT INTO public.roles (id, role_name) VALUES (2, 'Isregistered');

-- Insert categories
INSERT INTO public.categories (id, category_name) VALUES (1, 'Thesis');
INSERT INTO public.categories (id, category_name) VALUES (2, 'Dissertation');
INSERT INTO public.categories (id, category_name) VALUES (3, 'Research Paper');

-- Insert departments
INSERT INTO public.departments (id, cbit, cons, casee, baed, faculty, staff, grad_school) VALUES (1, true, false, false, false, true, false, false);
INSERT INTO public.departments (id, cbit, cons, casee, baed, faculty, staff, grad_school) VALUES (2, false, true, false, false, false, true, false);

-- Insert topics
INSERT INTO public.topics (id, topic_name) VALUES (1, 'Artificial Intelligence');
INSERT INTO public.topics (id, topic_name) VALUES (2, 'Quantum Computing');

-- Insert documents
INSERT INTO public.documents (id, title, topic, author, category, pages, publication_date, location_path, category_id) 
VALUES (1, 'AI in Education', 'Artificial Intelligence', 'Alice Cooper', 'Thesis', 120, '2024-01-10', 'docs/ai_edu.pdf', 1);
INSERT INTO public.documents (id, title, topic, author, category, pages, publication_date, location_path, category_id) 
VALUES (2, 'Quantum Computing Basics', 'Quantum Science', 'Bob Marley', 'Research Paper', 80, '2023-12-05', 'docs/quantum.pdf', 3);

-- Insert document_topics
INSERT INTO public.document_topics (document_id, topic_id) VALUES (1, 1);
INSERT INTO public.document_topics (document_id, topic_id) VALUES (2, 2);

-- Insert users
INSERT INTO public.users (school_id, department_id, saved_documents, history, first_name, middle_name, last_name) 
VALUES ('USER-001', 1, '{Doc1,Doc2}', '{DocA}', 'John', 'Doe', 'Smith');
INSERT INTO public.users (school_id, department_id, saved_documents, history, first_name, middle_name, last_name) 
VALUES ('USER-002', 2, '{Doc3}', '{DocB,DocC}', 'Jane', 'Ann', 'Doe');

-- Insert admin user into users table
INSERT INTO public.users (school_id, department_id, saved_documents, history, first_name, middle_name, last_name) 
VALUES ('ADMIN-001', 1, '{}', '{}', 'Admin', 'User', 'One');

-- Insert saved_documents
INSERT INTO public.saved_documents (school_id, document_id, date_saved) 
VALUES ('USER-001', 1, '2025-03-16 02:10:08.816254');
INSERT INTO public.saved_documents (school_id, document_id, date_saved) 
VALUES ('USER-002', 2, '2025-03-16 02:10:08.816254');

-- Insert tokens (ensure user exists in the users table first)
INSERT INTO public.tokens (token, user_id, user_role, created_at) 
VALUES ('abc123', 'USER-001', 'Isregistered', '2025-03-16 02:10:08.816254');
INSERT INTO public.tokens (token, user_id, user_role, created_at) 
VALUES ('xyz789', 'ADMIN-001', 'Isadmin', '2025-03-16 02:10:08.816254');

-- Insert user_permissions
INSERT INTO public.user_permissions (role_id, document_id, can_read, can_write, can_edit, can_delete) 
VALUES (2, 1, true, false, false, false);
INSERT INTO public.user_permissions (role_id, document_id, can_read, can_write, can_edit, can_delete) 
VALUES (1, 2, true, true, true, true);

-- Insert credentials (for admin and users)
INSERT INTO public.credentials (school_id, password, role) 
VALUES ('ADMIN-001', 'adminpassword123', 1); -- For admin user
INSERT INTO public.credentials (school_id, password, role) 
VALUES ('USER-001', 'userpassword123', 2); -- For regular user
INSERT INTO public.credentials (school_id, password, role) 
VALUES ('USER-002', 'userpassword456', 2); -- For another regular user

-- Insert admins
INSERT INTO public.admins (school_id, department_id) 
VALUES ('ADMIN-001', 1); -- Admin's department

--Insert authors
INSERT INTO Authors (
    author_id, full_name, affiliation, department, year_of_graduation, 
    email, linkedin, orcid_id, bio, profile_picture, created_at, updated_at
) VALUES
    (gen_random_uuid(), 'Alice Johnson', 'Harvard University', 'Computer Science', 2018, 
     'alice.johnson@email.com', 'https://linkedin.com/in/alicejohnson', '0000-0001-2345-6789', 
     'Alice is a researcher in AI and Machine Learning.', '/uploads/alice.jpg', 
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'Bob Smith', 'MIT', 'Physics', 2020, 
     'bob.smith@email.com', 'https://linkedin.com/in/bobsmith', '0000-0002-3456-7890', 
     'Bob specializes in quantum computing and theoretical physics.', '/uploads/bob.jpg', 
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'Charlie Evans', 'Stanford University', 'Biotechnology', NULL, 
     NULL, 'https://linkedin.com/in/charlieevans', NULL, 
     'Charlie is focused on genetic engineering and CRISPR research.', '/uploads/charlie.jpg', 
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'Diana Lopez', 'Oxford University', 'Philosophy', 2015, 
     'diana.lopez@email.com', NULL, '0000-0003-4567-8901', 
     'Diana studies ethics in artificial intelligence.', NULL, 
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'Ethan Wright', 'Cambridge University', 'Mathematics', 2019, 
     'ethan.wright@email.com', 'https://linkedin.com/in/ethanwright', NULL, 
     'Ethan is passionate about topology and abstract algebra.', '/uploads/ethan.jpg', 
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);