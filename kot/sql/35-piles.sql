CREATE TABLE piles (
    id SERIAL PRIMARY KEY,
    timestamp timestamp default now(),
    owner int REFERENCES users(id),
    member int REFERENCES users(id),
    pile_num int REFERENCES pile_descs(id)
);

ALTER TABLE piles ADD x real DEFAULT 0.5;
ALTER TABLE piles ADD y real DEFAULT 0.5
