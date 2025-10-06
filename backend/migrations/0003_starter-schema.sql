-- Enable foreign key support
PRAGMA foreign_keys = ON;

DROP TABLE Users;

CREATE TABLE Users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    dateOfBirth TEXT NOT NULL,
    subscription TEXT NOT NULL,
    profileImage TEXT,
    country TEXT NOT NULL,
    state TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE Albums (
    id TEXT PRIMARY KEY NOT NULL,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    dateCreated TEXT NOT NULL DEFAULT (date('now')),
    lastUpdated TEXT NOT NULL DEFAULT (datetime('now')),
    numImages INTEGER DEFAULT (0),
    thumbnailUrl TEXT NOT NULL,
    FOREIGN KEY (owner) REFERENCES Users(id)
);

CREATE TABLE AlbumPublicLinks (
    Albumid TEXT PRIMARY KEY NOT NULL,
    publicLink TEXT NOT NULL,
    enabled INTEGER CHECK (enabled IN (0, 1)),
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (AlbumId) REFERENCES Albums(id)
);

CREATE TABLE AlbumComments (
    id TEXT PRIMARY KEY NOT NULL,
    owner TEXT NOT NULL,
    albumid TEXT NOT NULL,
    content TEXT NOT NULL,
    dateCreated TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner) REFERENCES Users(id),
    FOREIGN KEY (albumid) REFERENCES Albums(id)
);

CREATE TABLE Images (
    id TEXT PRIMARY KEY NOT NULL,
    owner TEXT NOT NULL,
    albumid TEXT NOT NULL,
    description TEXT DEFAULT NULL,
    "order" INTEGER NOT NULL,
    thumbnailUrl TEXT NOT NULL,
    imageUrl TEXT NOT NULL,
    widthpx INTEGER NOT NULL,
    heightpx INTEGER NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner) REFERENCES Users(id),
    FOREIGN KEY (albumid) REFERENCES Albums(id)
);

CREATE TABLE Groups (
    id TEXT PRIMARY KEY NOT NULL,
    owner TEXT NOT NULL,
    emojiThumbnail TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    dateCreated TEXT NOT NULL DEFAULT (datetime('now')),
    lastUpdated TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner) REFERENCES Users(id)
);

CREATE TABLE AlbumMembers (
    AlbumId TEXT NOT NULL,
    userId TEXT NOT NULL,
    Role TEXT NOT NULL,
    dateAdded TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (AlbumId, userId),
    FOREIGN KEY (AlbumId) REFERENCES Albums(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

CREATE TABLE GroupMembers (
    GroupId TEXT NOT NULL,
    userId TEXT NOT NULL,
    Role TEXT NOT NULL,
    dateAdded TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (GroupId, userId),
    FOREIGN KEY (GroupId) REFERENCES Groups(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

CREATE TABLE GroupInvite (
    GroupId TEXT NOT NULL,
    invitedPhoneNum TEXT NOT NULL,
    Role TEXT NOT NULL,
    dateInvited TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (GroupId, invitedPhoneNum),
    FOREIGN KEY (GroupId) REFERENCES Groups(id)
);

CREATE TABLE AlbumSharedGroups (
    AlbumId TEXT NOT NULL,
    GroupId TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (AlbumId),
    FOREIGN KEY (AlbumId) REFERENCES Albums(id),
    FOREIGN KEY (GroupId) REFERENCES Groups(id)
);
