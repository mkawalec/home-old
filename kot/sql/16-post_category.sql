CREATE TABLE post_category (
    id SERIAL PRIMARY KEY,
    name varchar,
    post int references blog_post(id)
);
