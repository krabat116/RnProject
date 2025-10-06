-- Migration number: 0001 	 2024-08-23T01:42:34.801Z
CREATE TABLE Users (
    id text PRIMARY KEY NOT NULL,
    firstName text NOT NULL,
    lastName text NOT NULL,
    createdAt datetime default CURRENT_TIMESTAMP
);