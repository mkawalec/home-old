CREATE TABLE blog_post (
    id SERIAL PRIMARY KEY,
    commit_id varchar NOT NULL
    author int REFERENCES users(id),
    timestamp timestamp DEFAULT now(),
    edit_timestamp timestamp DEFAULT now(),
    title varchar,
    contents varchar,
);
