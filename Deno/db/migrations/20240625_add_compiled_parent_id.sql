-- Add compiled_parent_id column to documents table
-- This is used to track which compiled document a regular document belongs to
-- without having to create the compiled document as a document first

-- Add the column
ALTER TABLE documents 
ADD COLUMN compiled_parent_id INTEGER;

-- Add a foreign key constraint to the compiled_documents table
ALTER TABLE documents 
ADD CONSTRAINT fk_compiled_parent
FOREIGN KEY (compiled_parent_id) 
REFERENCES compiled_documents(id) 
ON DELETE SET NULL;

-- Add an index for faster lookups
CREATE INDEX idx_documents_compiled_parent_id ON documents(compiled_parent_id);

-- Update existing documents that have entries in compiled_document_items
UPDATE documents d
SET compiled_parent_id = cdi.compiled_document_id
FROM compiled_document_items cdi
WHERE d.id = cdi.document_id;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added compiled_parent_id column to documents table';
END $$; 