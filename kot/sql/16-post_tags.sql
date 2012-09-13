CREATE TABLE post_tags (
    id SERIAL PRIMARY KEY,
    post int REFERENCES blog_post(id),
    tag varchar NOT NULL
);
