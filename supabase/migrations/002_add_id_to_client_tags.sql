-- Add id column to client_tags table to satisfy audit log trigger requirements
ALTER TABLE client_tags 
ADD COLUMN id UUID DEFAULT uuid_generate_v4() NOT NULL;

-- Make it unique (though (client_id, tag_id) is already PK, having a unique ID is fine)
ALTER TABLE client_tags ADD CONSTRAINT client_tags_id_key UNIQUE (id);

