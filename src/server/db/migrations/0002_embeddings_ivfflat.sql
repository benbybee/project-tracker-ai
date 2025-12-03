-- Create ivfflat index for embeddings
CREATE INDEX IF NOT EXISTS embeddings_ivfflat
ON embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
