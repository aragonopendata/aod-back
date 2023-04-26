------------------------------------
-- AOD CAMPUS DATABASE DEFINITION --
------------------------------------

-- TABLE CREATES -- 
-------------------
-- TABLE TOPICS
CREATE TABLE campus.TOPICS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					TEXT			NULL
);
COMMENT ON TABLE campus.TOPICS IS 'Stores the available content topics.';
COMMENT ON COLUMN campus.TOPICS.id IS 'Unique identifier of the topics table rows.';
COMMENT ON COLUMN campus.TOPICS.name IS 'Topic name.';

-- TABLE TYPES
CREATE TABLE campus.TYPES (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					TEXT			NULL
);
COMMENT ON TABLE campus.TYPES IS 'Stores the available content types.';
COMMENT ON COLUMN campus.TYPES.id IS 'Unique identifier of the types table rows.';
COMMENT ON COLUMN campus.TYPES.name IS 'Type name.';

-- TABLE PLATFORMS
CREATE TABLE campus.PLATFORMS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					TEXT			NULL
);
COMMENT ON TABLE campus.PLATFORMS IS 'Stores the available content platforms.';
COMMENT ON COLUMN campus.PLATFORMS.id IS 'Unique identifier of the platforms table rows.';
COMMENT ON COLUMN campus.PLATFORMS.name IS 'Platform name.';

-- TABLE FORMATS
CREATE TABLE campus.FORMATS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					TEXT			NULL
);
COMMENT ON TABLE campus.FORMATS IS 'Stores the available content formats.';
COMMENT ON COLUMN campus.FORMATS.id IS 'Unique identifier of the formats table rows.';
COMMENT ON COLUMN campus.FORMATS.name IS 'Format name.';

-- TABLE SITES
CREATE TABLE campus.SITES (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					TEXT			NULL
);
COMMENT ON TABLE campus.SITES IS 'Stores the available event sites.';
COMMENT ON COLUMN campus.SITES.id IS 'Unique identifier of the sites table rows.';
COMMENT ON COLUMN campus.SITES.name IS 'Site name.';

-- TABLE EVENTS
CREATE TABLE campus.EVENTS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					TEXT			NULL,
	description				TEXT			NULL,
	date					DATE			NULL
);
COMMENT ON TABLE campus.EVENTS IS 'Stores the available events.';
COMMENT ON COLUMN campus.EVENTS.id IS 'Unique identifier of the events table rows.';
COMMENT ON COLUMN campus.EVENTS.name IS 'Event name.';
COMMENT ON COLUMN campus.EVENTS.description IS 'Event description.';
COMMENT ON COLUMN campus.EVENTS.date IS 'Event date.';

-- TABLE SPEAKERS
CREATE TABLE campus.SPEAKERS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					TEXT			NULL,
	description				TEXT			NULL
);
COMMENT ON TABLE campus.SPEAKERS IS 'Stores the available content speakers.';
COMMENT ON COLUMN campus.SPEAKERS.id IS 'Unique identifier of the speakers table rows.';
COMMENT ON COLUMN campus.SPEAKERS.name IS 'Speaker name.';
COMMENT ON COLUMN campus.SPEAKERS.description IS 'Speaker description.';

-- TABLE CONTENTS
CREATE TABLE campus.CONTENTS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	title					TEXT			NULL,
	description				TEXT			NULL,
	url						TEXT			NULL,
	thumbnail				BYTEA			NULL,
	format 					INTEGER			NOT NULL	REFERENCES campus.FORMATS(id),
	type 					INTEGER			NOT NULL	REFERENCES campus.TYPES(id),
	platform				INTEGER			NOT NULL	REFERENCES campus.PLATFORMS(id),
	event 					INTEGER 		NOT NULL	REFERENCES campus.EVENTS(id)
);
COMMENT ON TABLE campus.CONTENTS IS 'Stores the available events contents.';
COMMENT ON COLUMN campus.CONTENTS.id IS 'Unique identifier of the contents table rows.';
COMMENT ON COLUMN campus.CONTENTS.title IS 'Content title.';
COMMENT ON COLUMN campus.CONTENTS.description IS 'Content description.';
COMMENT ON COLUMN campus.CONTENTS.url IS 'Content URL.';
COMMENT ON COLUMN campus.CONTENTS.thumbnail IS 'Content Previsualization image.';
COMMENT ON COLUMN campus.CONTENTS.format IS 'Content format.';
COMMENT ON COLUMN campus.CONTENTS.type IS 'Content type.';
COMMENT ON COLUMN campus.CONTENTS.platform IS 'Content platform.';
COMMENT ON COLUMN campus.CONTENTS.event IS 'Content event.';

-- TABLE CONTENTS_TOPICS
CREATE TABLE campus.CONTENTS_TOPICS (
	id_content				INTEGER			NOT NULL	REFERENCES campus.CONTENTS(id),
	id_topic				INTEGER			NOT NULL	REFERENCES campus.TOPICS(id),
	UNIQUE (id_content, id_topic)
);
COMMENT ON TABLE campus.CONTENTS_TOPICS IS 'Stores the relationships between topics and contents.';
COMMENT ON COLUMN campus.CONTENTS_TOPICS.id_content IS 'Identifier of the content.';
COMMENT ON COLUMN campus.CONTENTS_TOPICS.id_topic IS 'Identifier of the topic.';

-- TABLE CONTENTS_SPEAKERS
CREATE TABLE campus.CONTENTS_SPEAKERS (
	id_content				INTEGER			NOT NULL	REFERENCES campus.CONTENTS(id),
	id_speaker				INTEGER			NOT NULL	REFERENCES campus.SPEAKERS(id),
	UNIQUE (id_content, id_speaker)
);
COMMENT ON TABLE campus.CONTENTS_SPEAKERS IS 'Stores the relationships between speakers and contents.';
COMMENT ON COLUMN campus.CONTENTS_SPEAKERS.id_content IS 'Identifier of the content.';
COMMENT ON COLUMN campus.CONTENTS_SPEAKERS.id_speaker IS 'Identifier of the speaker.';

-- TABLE EVENTS_SITES
CREATE TABLE campus.EVENTS_SITES (
	id_event				INTEGER			NOT NULL	REFERENCES campus.EVENTS(id),
	id_site					INTEGER			NOT NULL	REFERENCES campus.SITES(id),
	UNIQUE (id_event, id_site)
);
COMMENT ON TABLE campus.EVENTS_SITES IS 'Stores the relationships between events and sites.';
COMMENT ON COLUMN campus.EVENTS_SITES.id_event IS 'Identifier of the event.';
COMMENT ON COLUMN campus.EVENTS_SITES.id_site IS 'Identifier of the site.';