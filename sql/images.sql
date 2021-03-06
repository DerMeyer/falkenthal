DROP TABLE IF EXISTS images;

CREATE TABLE images(
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    position INTEGER,
    folder_id INTEGER NOT NULL,
    url VARCHAR(511) NOT NULL,
    description TEXT
);
