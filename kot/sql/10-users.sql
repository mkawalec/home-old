CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uname varchar NOT NULL UNIQUE,
    passwd varchar,
    colour int REFERENCES colours(id),
    has_thumbnail boolean DEFAULT FALSE,
    avatar varchar UNIQUE,
    avatar_thumb varchar UNIQUE
);
