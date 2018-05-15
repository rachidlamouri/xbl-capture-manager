CREATE TABLE IF NOT EXISTS `Clips` (
	`Id`	TEXT NOT NULL,
	`GameId`	INTEGER,
	`GameName`	TEXT,
	`DateTaken`	TEXT,
	`DatePublished`	TEXT,
	`LastModified`	TEXT,
	`XUID`	INTEGER,
	`Gamertag`	TEXT,
	`ClipName`	TEXT,
	`Duration`	REAL,
	`Caption`	TEXT,
	`Type`	TEXT,
	`SavedByUser`	INTEGER,
	`DeviceType`	TEXT,
	`Locale`	TEXT,
	`AchievementId`	TEXT,
	`GreatestMomentId`	TEXT,
	`SCID`	TEXT,
	`GameData`	TEXT,
	`SystemProps`	TEXT,
	`ContentAttributes`	TEXT,
	`OriginalUri`	TEXT,
	`FileSize`	INTEGER,
	`UriExpiryDate`	TEXT,
	`LastDocumented`	TEXT,
	`LastArchived`	TEXT,
	`IsArchived`	INTEGER NOT NULL,
	PRIMARY KEY(`Id`)
);

CREATE TABLE IF NOT EXISTS `Screenshots` (
	`Id`	TEXT NOT NULL,
	`GameId`	INTEGER,
	`GameName`	TEXT,
	`DateTaken`	TEXT,
	`DatePublished`	TEXT,
	`LastModified`	TEXT,
	`XUID`	INTEGER,
	`Gamertag`	TEXT,
	`ScreenshotName`	TEXT,
	`ResolutionWidth`	INTEGER,
	`ResolutionHeight`	INTEGER,
	`Caption`	TEXT,
	`Type`	TEXT,
	`SavedByUser`	INTEGER,
	`DeviceType`	TEXT,
	`Locale`	TEXT,
	`AchievementId`	TEXT,
	`GreatestMomentId`	TEXT,
	`SCID`	TEXT,
	`GameData`	TEXT,
	`SystemProps`	TEXT,
	`ContentAttributes`	TEXT,
	`OriginalUri`	TEXT,
	`FileSize`	INTEGER,
	`UriExpiryDate`	TEXT,
	`LastDocumented`	TEXT,
	`LastArchived`	TEXT,
	`IsArchived`	INTEGER NOT NULL,
	PRIMARY KEY(`Id`)
);
