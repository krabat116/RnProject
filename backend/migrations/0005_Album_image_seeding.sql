
DELETE FROM Images;


INSERT INTO Images (id, owner, albumid, description, "order", thumbnailUrl, imageUrl, widthpx, heightpx, createdAt) 
VALUES ('f1', 'user1', 'album1', 'LAFAYETTE', 1, 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f1.jpg', 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f1.jpg', 500, 500, CURRENT_TIMESTAMP);

INSERT INTO Images (id, owner, albumid, description, "order", thumbnailUrl, imageUrl, widthpx, heightpx, createdAt) 
VALUES ('f2', 'user1', 'album1', 'EFFEL TOWER', 1, 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f2.jpg', 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f2.jpg', 500, 500, CURRENT_TIMESTAMP);

INSERT INTO Images (id, owner, albumid, description, "order", thumbnailUrl, imageUrl, widthpx, heightpx, createdAt) 
VALUES ('f3', 'user1', 'album1', 'Cafes', 1, 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f3.jpg', 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f3.jpg', 500, 500, CURRENT_TIMESTAMP);

INSERT INTO Images (id, owner, albumid, description, "order", thumbnailUrl, imageUrl, widthpx, heightpx, createdAt) 
VALUES ('f4', 'user1', 'album1', 'Triomphe', 1, 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f4.jpg', 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f4.jpg', 500, 500, CURRENT_TIMESTAMP);

INSERT INTO Images (id, owner, albumid, description, "order", thumbnailUrl, imageUrl, widthpx, heightpx, createdAt) 
VALUES ('f5', 'user1', 'album1', 'La Seine', 1, 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f5.jpg', 'https://pub-0769b00e6b7d4e589436b840caa26dc9.r2.dev/f5.jpg', 500, 500, CURRENT_TIMESTAMP);

UPDATE Albums 
SET name = 'French Architecture', 
    description = 'Photos from our tour of the city of Paris & outer France! Beginning in Paris, through to Lyon & ending at Nice!' ,
    numImages = 5
WHERE id = 'album1';
