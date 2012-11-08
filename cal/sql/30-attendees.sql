CREATE TABLE attendees (
    id SERIAL PRIMARY KEY,
    person int REFERENCES users(id),
    event int REFERENCES events(id),
    timestamp timestamp DEFAULT now()
);
