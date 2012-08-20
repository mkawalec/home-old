CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    timestamp timestamp DEFAULT now(),
    date timestamp,
    location varchar,
    duration smallint,
    name varchar,
    description varchar,
    owner int REFERENCES users(id)
);
    
