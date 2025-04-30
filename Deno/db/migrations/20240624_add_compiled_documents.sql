-- Create the compiled_documents table
CREATE TABLE IF NOT EXISTS compiled_documents (
    id SERIAL PRIMARY KEY,
    start_year INT,
    end_year INT,
    volume INT,
    issue_number INT,
    department VARCHAR(255),
    category VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create the compiled_document_items table for linking documents to compilations
CREATE TABLE IF NOT EXISTS compiled_document_items (
    id SERIAL PRIMARY KEY,
    compiled_document_id INT,
    document_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT compiled_document_items_unique UNIQUE (compiled_document_id, document_id),
    FOREIGN KEY (compiled_document_id) REFERENCES compiled_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_compiled_document_items_compiled_id ON compiled_document_items(compiled_document_id);
CREATE INDEX IF NOT EXISTS idx_compiled_document_items_document_id ON compiled_document_items(document_id); 