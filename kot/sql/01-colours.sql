CREATE TABLE colours (
    id SERIAL PRIMARY KEY,
    timestamp timestamp DEFAULT now(),
    border varchar NOT NULL,
    colour varchar NOT NULL UNIQUE
);
