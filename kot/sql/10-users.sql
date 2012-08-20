CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uname varchar NOT NULL UNIQUE,
    passwd varchar,
    colour int REFERENCES colours(id)
);
