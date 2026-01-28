-------------------------------------
-- AOD MANAGER DATABASE DEFINITION --
-------------------------------------

-- TABLE CREATIONS -- 
-------------------
-- TABLE LANGUAGES
CREATE TABLE manager.LANGUAGES (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					VARCHAR(20)		NOT NULL,
	locale					VARCHAR(10)		NOT NULL
);
COMMENT ON TABLE manager.LANGUAGES IS 'Stores the available translation languages for the web content stored on the database.';
COMMENT ON COLUMN manager.LANGUAGES.id IS 'Unique identifier of the languages table rows.';
COMMENT ON COLUMN manager.LANGUAGES.name IS 'Language name.';
COMMENT ON COLUMN manager.LANGUAGES.locale IS 'Language locale code.';

-- TABLE LICENSES
CREATE TABLE manager.LICENSES (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					VARCHAR(100)	NOT NULL,
	description				TEXT			NULL
);
COMMENT ON TABLE manager.LICENSES IS 'Stores the available licenses for applying to the web resources.';
COMMENT ON COLUMN manager.LICENSES.id IS 'Unique identifier of the licenses table rows.';
COMMENT ON COLUMN manager.LICENSES.name IS 'License name.';
COMMENT ON COLUMN manager.LICENSES.description IS 'License description with the most relevant information about itself.';

-- TABLE ROLES
CREATE TABLE manager.ROLES (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					VARCHAR(20)		NOT NULL,
	description				TEXT			NULL,
	active 					BOOLEAN			NOT NULL 	DEFAULT TRUE
);
COMMENT ON TABLE manager.ROLES IS 'Stores the available user roles on the web.';
COMMENT ON COLUMN manager.ROLES.id IS 'Unique identifier of the roles table rows.';
COMMENT ON COLUMN manager.ROLES.name IS 'Role name.';
COMMENT ON COLUMN manager.ROLES.description IS 'Role description with the most relevant information about itself.';
COMMENT ON COLUMN manager.ROLES.active IS 'Flag which activates or deactivates the role.';

-- TABLE USERS
CREATE TABLE manager.USERS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	name					VARCHAR(100)	NOT NULL,
	fullname				TEXT			NULL,
	password				TEXT			NOT NULL,
	email					VARCHAR(80)		NOT NULL,
	description				TEXT			NULL,
	active 					BOOLEAN			NOT NULL 	DEFAULT TRUE,
	creation_date			TIMESTAMP		NOT NULL	DEFAULT NOW(),
	last_edition_date		TIMESTAMP		NOT NULL	DEFAULT NOW(),
	token_restore			VARCHAR(50)		NULL,
	token_expiration_date	TIMESTAMP		NULL
);
COMMENT ON TABLE manager.USERS IS 'Stores the information of the available users on the web.';
COMMENT ON COLUMN manager.USERS.id IS 'Unique identifier of the users table rows.';
COMMENT ON COLUMN manager.USERS.name IS 'User name.';
COMMENT ON COLUMN manager.USERS.fullname IS 'User full name.';
COMMENT ON COLUMN manager.USERS.password IS 'User password in encrypted format.';
COMMENT ON COLUMN manager.USERS.email IS 'User email.';
COMMENT ON COLUMN manager.USERS.description IS 'User description.';
COMMENT ON COLUMN manager.USERS.active IS 'Flag which activates or deactivates the user.';
COMMENT ON COLUMN manager.USERS.creation_date IS 'User sign up date.';
COMMENT ON COLUMN manager.USERS.last_edition_date IS 'User last edition date.';
COMMENT ON COLUMN manager.USERS.token_restore IS 'Token to restore the user password. If the token expires (marked by the token expiration date field, the user will must request a new token.';
COMMENT ON COLUMN manager.USERS.token_expiration_date IS 'Password token expiration date.';

-- TABLE APPLICATIONS
CREATE TABLE manager.APPLICATIONS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	appplication_name		VARCHAR(100)	NOT NULL,
	description				TEXT			NULL,
	active 					BOOLEAN			NOT NULL 	DEFAULT TRUE
);
COMMENT ON TABLE manager.APPLICATIONS IS 'Stores the information of the available applications on the Open Data system.';
COMMENT ON COLUMN manager.APPLICATIONS.id IS 'Unique identifier of the applications table rows.';
COMMENT ON COLUMN manager.APPLICATIONS.appplication_name IS 'Application name.';
COMMENT ON COLUMN manager.APPLICATIONS.description IS 'Application description.';
COMMENT ON COLUMN manager.APPLICATIONS.active IS 'Flag which activates or deactivates the application. If the application is deactivated, nobody will be able to acces to this application';

-- TABLE SECTIONS
CREATE TABLE manager.SECTIONS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	title					TEXT			NOT NULL,
	subtitle				TEXT			NULL,
	description				TEXT			NULL
);
COMMENT ON TABLE manager.SECTIONS IS 'Stores the information of the available static sections on the Open Data web.';
COMMENT ON COLUMN manager.SECTIONS.id IS 'Unique identifier of the sections table rows.';
COMMENT ON COLUMN manager.SECTIONS.title IS 'Section title.';
COMMENT ON COLUMN manager.SECTIONS.subtitle IS 'Section subtitle.';
COMMENT ON COLUMN manager.SECTIONS.description IS 'Section description.';

-- TABLE STATIC_CONTENTS
CREATE TABLE manager.STATIC_CONTENTS (
	id 						SERIAL			NOT NULL 	PRIMARY KEY,
	id_section				INTEGER			NOT NULL 	REFERENCES manager.SECTIONS(id),
	title					TEXT			NULL,
	content					TEXT			NULL,
	content_order			INTEGER			NOT NULL,
	target_url				TEXT			NULL,
	visible					BOOLEAN			NOT NULL	DEFAULT TRUE
);
COMMENT ON TABLE manager.STATIC_CONTENTS IS 'Stores the information of the available contents of the static sections on the Open Data web.';
COMMENT ON COLUMN manager.STATIC_CONTENTS.id IS 'Unique identifier of the contents table rows.';
COMMENT ON COLUMN manager.STATIC_CONTENTS.id_section IS 'Identifier of the section which the content belongs to.';
COMMENT ON COLUMN manager.STATIC_CONTENTS.title IS 'Content title.';
COMMENT ON COLUMN manager.STATIC_CONTENTS.content IS 'Content information.';
COMMENT ON COLUMN manager.STATIC_CONTENTS.content_order IS 'Order in which the content will be displayed in the section.';
COMMENT ON COLUMN manager.STATIC_CONTENTS.target_url IS 'URL target in which the content will be referenced in the web.';
COMMENT ON COLUMN manager.STATIC_CONTENTS.visible IS 'Flag which activates or deactivates the visibility of the content in the section. Util for logical delete.';

-- TABLE USERS_ROLES
CREATE TABLE manager.USERS_ROLES (
	id_user					INTEGER			NOT NULL	REFERENCES manager.USERS(id),
	id_role					INTEGER			NOT NULL	REFERENCES manager.ROLES(id),
	UNIQUE (id_user, id_role)
);
COMMENT ON TABLE manager.USERS_ROLES IS 'Stores the information of the relations between users and roles. This relation could be configured by a foreign keys, but this way it would allows configure the users with more than one role in the future.';
COMMENT ON COLUMN manager.USERS_ROLES.id_user IS 'Identifier of the user.';
COMMENT ON COLUMN manager.USERS_ROLES.id_role IS 'Identifier of the role.';

-- TABLE USERS_APPLICATIONS_PERMISSIONS
CREATE TABLE manager.USERS_APPLICATIONS_PERMISSIONS (
	id_user					INTEGER			NOT NULL	REFERENCES manager.USERS(id),
	id_application			INTEGER			NOT NULL	REFERENCES manager.APPLICATIONS(id),
	access_key				TEXT			NOT NULL,
	UNIQUE (id_user, id_application)
);
COMMENT ON TABLE manager.USERS_APPLICATIONS_PERMISSIONS IS 'Stores the information of the applications access permissions to the users on the Open Data System.';
COMMENT ON COLUMN manager.USERS_APPLICATIONS_PERMISSIONS.id_user IS 'Identifier of the user.';
COMMENT ON COLUMN manager.USERS_APPLICATIONS_PERMISSIONS.id_application IS 'Identifier of the application.';
COMMENT ON COLUMN manager.USERS_APPLICATIONS_PERMISSIONS.access_key IS 'Mandatory user key to access to the applicacion.';

-- TABLE SECTIONS_TRANSLATIONS
CREATE TABLE manager.SECTIONS_TRANSLATIONS (
	id_section				INTEGER			NOT NULL 	REFERENCES manager.SECTIONS(id),
	id_language				INTEGER			NOT NULL 	REFERENCES manager.LANGUAGES(id),
	title					TEXT			NULL,
	subtitle				TEXT			NULL,
	description				TEXT			NULL,
	UNIQUE (id_section, id_language)
);
COMMENT ON TABLE manager.SECTIONS_TRANSLATIONS IS 'Stores the translations of the available static sections on the Open Data web.';
COMMENT ON COLUMN manager.SECTIONS_TRANSLATIONS.id_section IS 'Identifier of the section to translate.';
COMMENT ON COLUMN manager.SECTIONS_TRANSLATIONS.id_language IS 'Identifier of the language in which the section will be translated.';
COMMENT ON COLUMN manager.SECTIONS_TRANSLATIONS.title IS 'Translated section title.';
COMMENT ON COLUMN manager.SECTIONS_TRANSLATIONS.subtitle IS 'Translated section subtitle.';
COMMENT ON COLUMN manager.SECTIONS_TRANSLATIONS.description IS 'Translated section description.';

-- TABLE STATIC_CONTENTS_TRANSLATIONS
CREATE TABLE manager.STATIC_CONTENTS_TRANSLATIONS (
	id_static_content		INTEGER			NOT NULL 	REFERENCES manager.STATIC_CONTENTS(id),
	id_language				INTEGER			NOT NULL 	REFERENCES manager.LANGUAGES(id),
	title					TEXT			NULL,
	content					TEXT			NULL,
	target_url				TEXT			NULL,
	UNIQUE (id_static_content, id_language)
);
COMMENT ON TABLE manager.STATIC_CONTENTS_TRANSLATIONS IS 'Stores the translations of the available contents of the static sections on the Open Data web.';
COMMENT ON COLUMN manager.STATIC_CONTENTS_TRANSLATIONS.id_static_content IS 'Identifier of the static content to translate.';
COMMENT ON COLUMN manager.STATIC_CONTENTS_TRANSLATIONS.id_language IS 'Identifier of the language in which the content will be translated.';
COMMENT ON COLUMN manager.STATIC_CONTENTS_TRANSLATIONS.title IS 'Translated content title.';
COMMENT ON COLUMN manager.STATIC_CONTENTS_TRANSLATIONS.content IS 'Translated content information.';
COMMENT ON COLUMN manager.STATIC_CONTENTS_TRANSLATIONS.target_url IS 'Translated URL target in which the content will be referenced in the web.';