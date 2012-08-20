CREATE TABLE pile_descs (
    id SERIAL PRIMARY KEY,
    timestamp timestamp DEFAULT now(),
    description varchar,
    name varchar NOT NULL,
    owner int REFERENCES users(id)
);
