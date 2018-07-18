DROP TABLE IF EXISTS folders;

CREATE TABLE folders (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    position INTEGER,
    title_image_url VARCHAR(511),
    name VARCHAR(255),
    description TEXT
);
