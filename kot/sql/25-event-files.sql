CREATE TABLE event_files (
    id SERIAL PRIMARY KEY,
    timestamp timestamp DEFAULT now(),
    event int REFERENCES events(id),
    file varchar,
    filename varchar,
    uploaded_by int REFERENCES users(id),
    mimetype varchar,
    size int8
);
