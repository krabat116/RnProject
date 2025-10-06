-- Migration number: 0004 	 2024-09-02T01:32:27.069Z

INSERT INTO Users (id,email, phone, firstName, lastName, dateOfBirth, 
                    subscription, profileImage, country, state)
VALUES ('user1','alex@blackhole.com','0400123456','Alex','Amble','2000-01-01',
        'FREE','https://randomuser.me/api/portraits/men/67.jpg','Australia','VIC');

INSERT INTO Users (id,email, phone, firstName, lastName, dateOfBirth, 
                    subscription, profileImage, country, state)
VALUES ('user2','bailey@blackhole.com','0400123456','Bailey','Browne','2000-02-01',
        'FREE','https://randomuser.me/api/portraits/men/51.jpg','Australia','NSW');

INSERT INTO Users (id,email, phone, firstName, lastName, dateOfBirth, 
                    subscription, profileImage, country, state)
VALUES ('user3','Claire@blackhole.com','0400123456','Claire','Voyante','2000-03-01',
        'FREE','https://randomuser.me/api/portraits/women/7.jpg','Australia','VIC');


INSERT INTO Albums (id, owner, name, description, thumbnailUrl)
VALUES ('album1','user1','test album','a small album purely for testing','');

INSERT INTO Users (id,email, phone, firstName, lastName, dateOfBirth, 
                    subscription, profileImage, country, state)
VALUES ('user4','John@blackhole.com','0400123456','John','White','2002-03-01',
        'FREE','https://randomuser.me/api/portraits/women/8.jpg','Australia','VIC');

