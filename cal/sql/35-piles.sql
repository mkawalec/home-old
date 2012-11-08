CREATE TABLE piles (
    id SERIAL PRIMARY KEY,
    timestamp timestamp default now(),
    owner int REFERENCES users(id),
    member int REFERENCES users(id),
    pile_num int REFERENCES pile_descs(id),
    x real DEFAULT 0.5,
    y real DEFAULT 0.5
);

