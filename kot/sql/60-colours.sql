CREATE TABLE colours (
    id SERIAL PRIMARY KEY,
    timestamp timestamp DEFAULT now(),
    owner int REFERENCES users(id),
    border varchar NOT NULL,
    colour varchar NOT NULL UNIQUE
);
