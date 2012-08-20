CREATE TABLE attendees (
    id SERIAL PRIMARY KEY,
    person int REFERENCES users(id),
    event int REFERENCES events(id)
);

ALTER TABLE attendees ADD timestamp timestamp DEFAULT now();

