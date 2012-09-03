CREATE TABLE blog_post (
    id SERIAL PRIMARY KEY,
    author int REFERENCES users(id),
    timestamp timestamp DEFAULT now(),
    edition_timestamp timestamp DEFAULT now(),
    title varchar,
    contents varchar
);
