CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

CREATE TABLE credentials (
    school_id VARCHAR(50) PRIMARY KEY,
    password TEXT NOT NULL,
    role INT NOT NULL REFERENCES roles(id)
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    cbit BOOLEAN,
    cons BOOLEAN,
    casee BOOLEAN,
    baed BOOLEAN,
    faculty BOOLEAN,
    staff BOOLEAN,
    grad_school BOOLEAN
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    school_id VARCHAR(50) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(id)
);

CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,
    authorpfp TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL
);

CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    topic_name VARCHAR(100) NOT NULL
);

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255),
    author VARCHAR(255),
    category VARCHAR(100),
    pages INT,
    publication_date DATE,
    location_path TEXT,
    category_id INT REFERENCES categories(id)
);

CREATE TABLE document_topics (
    document_id INT REFERENCES documents(id),
    topic_id INT REFERENCES topics(id),
    PRIMARY KEY (document_id, topic_id)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    school_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    saved_documents TEXT[],
    history TEXT[],
    department_id INT REFERENCES departments(id),
    first_name VARCHAR(50),
    middle_name VARCHAR(50),
    last_name VARCHAR(50)
);

CREATE TABLE saved_documents (
    id SERIAL PRIMARY KEY,
    school_id VARCHAR(50) REFERENCES users(school_id),
    document_id INT REFERENCES documents(id),
    date_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    user_id VARCHAR(50) REFERENCES users(school_id),
    user_role VARCHAR(50) REFERENCES roles(role_name),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id),
    document_id INT REFERENCES documents(id),
    can_read BOOLEAN DEFAULT false,
    can_write BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false
);
