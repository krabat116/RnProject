-- Migration number: 0009 	 2024-10-18T12:12:07.794Z
-- 1. Create a new temporary table with the composite primary key
CREATE TABLE AlbumSharedGroups_temp (
    AlbumId TEXT NOT NULL,
    GroupId TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (AlbumId, GroupId),
    FOREIGN KEY (AlbumId) REFERENCES Albums(id),
    FOREIGN KEY (GroupId) REFERENCES Groups(id)
);

-- 2. Copy data from the old table to the new table
INSERT INTO AlbumSharedGroups_temp (AlbumId, GroupId, createdAt)
SELECT AlbumId, GroupId, createdAt
FROM AlbumSharedGroups;

-- 3. Drop the old table
DROP TABLE AlbumSharedGroups;

-- 4. Rename the new table to the original table name
ALTER TABLE AlbumSharedGroups_temp RENAME TO AlbumSharedGroups;