exports.DB_ADMIN_GET_USERS_JSON = 'SELECT row_to_json(users) AS "user" '
							 	  + 'FROM ( '
									 + 'SELECT manager.users.id, manager.users.name '
										  + ', manager.users.email, manager.users.fullname '
										  + ', manager.users.description, manager.users.active ' 
										  + ', manager.users.creation_date AS "signupDate", ( '
											   + 'SELECT array_to_json(array_agg(row_to_json(roles))) '
												 + 'FROM ( '
													  + 'SELECT manager.roles.id, manager.roles.name ' 
														   + ', manager.roles.description, manager.roles.active '
														+ 'FROM manager.roles '
														+ 'JOIN manager.users_roles '
														  + 'ON manager.roles.id = manager.users_roles.id_role '
													   + 'WHERE manager.users_roles.id_user = manager.users.id '
												 + ') roles '
									   + ') AS role, '
									   + '(SELECT manager.users_applications_permissions.access_key '
										+ 'FROM manager.users_applications_permissions '
										+ 'WHERE manager.users_applications_permissions.id_user = manager.users.id '
										+ ') AS apiKey '
								  	   + 'FROM manager.users '
									   + 'JOIN manager.users_roles '
										 + 'ON manager.users.id = manager.users_roles.id_user '
								  + ') users';

exports.DB_ADMIN_GET_USER_APP_PERMISSIONS = 'SELECT manager.users.id AS "userId", manager.users.name AS "userName" '
											   + ', manager.users_applications_permissions.access_key AS "accessKey"'
											   + ', manager.users_applications_permissions.id_application AS "applicationId"'
											+ 'FROM manager.users '
											+ 'JOIN manager.users_applications_permissions '
											  + 'ON manager.users_applications_permissions.id_user = manager.users.id '
											+ 'JOIN manager.applications '
											  + 'ON manager.users_applications_permissions.id_application = manager.applications.id '
										   + 'WHERE manager.users.id = $1 '
											 + 'AND manager.users.name = $2 '
											 + 'AND manager.users.active = true '
											 + 'AND manager.applications.appplication_name = $3 '
											 + 'AND manager.applications.active = true';

exports.DB_ADMIN_GET_USER_APIKEY_BY_USER_ID = 'SELECT manager.users_applications_permissions.access_key AS "accessKey" '
												+ 'FROM manager.users '
												+ 'JOIN manager.users_applications_permissions '
												+ 'ON manager.users_applications_permissions.id_user = manager.users.id '
												+ 'JOIN manager.applications '
												+ 'ON manager.users_applications_permissions.id_application = manager.applications.id '
												+ 'WHERE manager.users.id = $1 '
												+ 'AND manager.users.active = true '
												+ 'AND manager.applications.appplication_name = $2 '
												+ 'AND manager.applications.active = true';

exports.DB_ADMIN_INSERT_USER = 'INSERT INTO manager.users (name, password, email, active, description, fullname, creation_date, last_edition_date) '
								  + 'VALUES ($1, $2, $3, $4, $5, $6, now(), now()) '
							   + 'RETURNING manager.users.id';
												 
exports.DB_ADMIN_INSERT_USER_APP_PERMISSION = 'INSERT INTO manager.users_applications_permissions (id_user, id_application, access_key) '
											+ 'VALUES ($1,(SELECT  id FROM manager.applications apps WHERE apps.appplication_name = $2), $3) ' 
											+ 'RETURNING manager.users_applications_permissions.id_user';

exports.DB_ADMIN_INSERT_USERS_ROLES = 'INSERT INTO manager.users_roles (id_user, id_role) '
									+ 'VALUES ($1, $2) '
									+ 'RETURNING manager.users_roles.id_user';


exports.DB_ADMIN_DELETE_USERS_ROLES = 'DELETE FROM manager.users_roles usrrol WHERE usrrol.id_user = $1';
exports.DB_ADMIN_DELETE_USER_APP_PERMISSION = 'DELETE FROM manager.users_applications_permissions apusr WHERE apusr.id_user = $1';
exports.DB_ADMIN_DELETE_USER = 'DELETE FROM manager.users usr where usr.id = $1';

exports.DB_ADMIN_UPDATE_USER = 'UPDATE manager.users '
								+ 'SET  name = $1, fullname = $2, email = $3, description = $4, '
								+ 'active = $5 WHERE id = $6';

exports.DB_ADMIN_UPDATE_USER_ROLES = 'UPDATE manager.users_roles set id_role = $1 where id_user = $2';
													 
exports.DB_ADMIN_GET_ROLES = 'SELECT manager.roles.id, manager.roles.name ' 
								+ ', manager.roles.description, manager.roles.active '
							 + 'FROM manager.roles';

exports.DB_ADMIN_GET_ROLE = 'SELECT manager.roles.id, manager.roles.name ' 
    						   + ', manager.roles.description, manager.roles.active '
							+ 'FROM manager.roles '
					   + 'WHERE manager.roles.id = $1';

exports.DB_ADMIN_GETALL_LOGSTASH = 'SELECT manager.logstash_conf.id_logstash, manager.logstash_conf.portal_name, manager.logstash_conf.type'
								+ ', manager.logstash_conf.view, manager.logstash_conf.delay, manager.logstash_conf.status, manager.logstash_conf.url ' 
							+ 'FROM manager.logstash_conf ORDER BY manager.logstash_conf.portal_name ASC';

exports.DB_ADMIN_GETENABLED_LOGSTASH = 'SELECT manager.logstash_conf.id_logstash, manager.logstash_conf.portal_name, manager.logstash_conf.type'
							+ ', manager.logstash_conf.view, manager.logstash_conf.delay, manager.logstash_conf.status, manager.logstash_conf.url ' 
						+ 'FROM manager.logstash_conf WHERE manager.logstash_conf.status=\'1\' ORDER BY manager.logstash_conf.portal_name ASC';

exports.DB_ADMIN_GET_LOGSTASH = 'SELECT manager.logstash_conf.id_logstash, manager.logstash_conf.portal_name, manager.logstash_conf.type'
								+ ', manager.logstash_conf.view, manager.logstash_conf.delay, manager.logstash_conf.status, manager.logstash_conf.url ' 
							+ 'FROM manager.logstash_conf WHERE manager.logstash_conf.id_logstash=$1 ';

exports.DB_ADMIN_INSERT_LOGSTASH = 'INSERT INTO manager.logstash_conf('
								+'portal_name, type, view, delay, url)'
							+'VALUES ($1, $2, $3, $4, $5) '
							+ 'RETURNING manager.logstash_conf.id_logstash;';

exports.DB_ADMIN_UPDATE_LOGSTASH = 'UPDATE manager.logstash_conf '
								+ 'SET portal_name=$1, type=$2, view=$3, delay=$4, url=$5 '
							+ 'WHERE manager.logstash_conf.id_logstash=$6 ';

exports.DB_ADMIN_DELETE_LOGSTASH = 'DELETE FROM manager.logstash_conf '
								+ 'WHERE manager.logstash_conf.id_logstash=$1 ';

exports.DB_ADMIN_ENABLE_LOGSTASH = 'UPDATE manager.logstash_conf '
								+ 'SET status=\'1\' '
							+ 'WHERE manager.logstash_conf.id_logstash=$1 ';

exports.DB_ADMIN_DISABLE_LOGSTASH = 'UPDATE manager.logstash_conf '
							+ 'SET status=\'0\' '
						+ 'WHERE manager.logstash_conf.id_logstash=$1 ';

exports.DB_ADMIN_GET_CAMPUS_SITES = 'SELECT id, name FROM campus.sites';

exports.DB_ADMIN_GET_CAMPUS_SPEAKERS = 'SELECT id, name, description FROM campus.speakers';

exports.DB_ADMIN_GET_CAMPUS_TYPES = 'SELECT id, name FROM campus.types';

exports.DB_ADMIN_GET_CAMPUS_FORMATS = 'SELECT id, name FROM campus.formats';

exports.DB_ADMIN_GET_CAMPUS_PLATFORMS = 'SELECT id, name FROM campus.platforms';

exports.DB_ADMIN_GET_CAMPUS_TOPICS = 'SELECT id, name FROM campus.topics';

exports.DB_ADMIN_GET_CAMPUS_EVENTS = 'SELECT e.id, e.name, e.description, e.date, json_build_object(\'id\', s.id, \'name\', s.name) site FROM campus.events e, campus.sites s, campus.events_sites es' +
							' WHERE s.id = es.id_site AND e.id = es.id_event';

exports.DB_ADMIN_INSERT_CAMPUS_EVENTS = 'INSERT INTO campus.events (name, description, date) VALUES($1, $2, $3)'+ 
							'RETURNING campus.events.id';

exports.DB_ADMIN_UPDATE_CAMPUS_EVENTS = 'UPDATE campus.events SET name = COALESCE($1, name), ' +
							'description = COALESCE($2, description), date = COALESCE($3, date) WHERE id = $4';
		
exports.DB_ADMIN_UPDATE_CAMPUS_EVENTS_SITES = 'UPDATE campus.events_sites s SET id_site = COALESCE($1, id_site)' +
												' WHERE s.id_event = $2';

exports.DB_ADMIN_INSERT_CAMPUS_EVENTS_SITES  = 'INSERT INTO campus.events_sites ' +
		'(id_event, id_site) '+
		'VALUES($1, $2)';

exports.DB_ADMIN_INSERT_CAMPUS_SITES  = 'INSERT INTO campus.sites ' +
												'(name) '+
												'VALUES($1) RETURNING campus.sites.id';

exports.DB_ADMIN_GET_CAMPUS_ENTRY = 'SELECT c.id, c.title, c.description, c.url, encode(c.thumbnail, \'base64\') AS thumbnail, c.format, c.type, c.platform, c.event, ' +
		't.id AS topic_id, t.name AS topic_name, s.id AS speaker_id ' + 
		'from campus.contents c, campus.topics t, campus.speakers s, ' +
		'campus.contents_topics ct, campus.contents_speakers cs '+
		'WHERE c.id = $1 AND c.id = ct.id_content AND c.id = cs.id_content '+
		'AND ct.id_topic = t.id AND cs.id_speaker = s.id';

exports.DB_ADMIN_GET_CAMPUS_ENTRIES = 'SELECT c.id, c.title from campus.contents c';

exports.DB_ADMIN_GET_CAMPUS_ENTRIES_BY_EVENT = 'SELECT c.id, c.title from campus.contents c WHERE c.event = $1';

exports.DB_ADMIN_GET_CAMPUS_ENTRIES_BY_SPEAKER = 'SELECT c.id, c.title FROM campus.contents c, campus.contents_speakers cs WHERE c.id=cs.id_content AND cs.id_speaker = $1';

exports.DB_ADMIN_INSERT_CAMPUS_ENTRIES = 'INSERT INTO campus.contents ' +
									'(title, description, url, thumbnail, format, type, platform, event) '+
									'VALUES($1, $2, $3, decode($4, \'base64\'), $5, $6, $7, $8)' + 
									'RETURNING campus.contents.id';

exports.DB_ADMIN_INSERT_CAMPUS_CONTENTS_TOPICS  = 'INSERT INTO campus.contents_topics ' +
												'(id_content, id_topic) '+
												'VALUES ';

exports.DB_ADMIN_INSERT_CAMPUS_CONTENTS_SPEAKERS  = 'INSERT INTO campus.contents_speakers ' +
												'(id_content, id_speaker) '+
												'VALUES($1, $2)';

exports.DB_ADMIN_UPDATE_CAMPUS_ENTRIES = 'UPDATE campus.contents SET ' + 
										'title = COALESCE($1, title), ' +
										'description = COALESCE($2, description), ' +
										'url = COALESCE($3, url), ' +
										'thumbnail = COALESCE($4, thumbnail), ' +
										'format = COALESCE($5, format), ' +
										'type = COALESCE($6, type), ' +
										'platform = COALESCE($7, platform), ' +
										'event = COALESCE($8, event) ' +
										'WHERE id = $9';

exports.DB_ADMIN_DELETE_CAMPUS_ENTRIES_TOPICS = 'DELETE FROM campus.contents_topics WHERE id_content = $1 AND id_topic IN (';

exports.DB_ADMIN_UPDATE_CAMPUS_ENTRIES_SPEAKERS  = 'UPDATE campus.contents_speakers s SET id_speaker = COALESCE($1, id_speaker)' +
										' WHERE s.id_content = $2';

exports.DB_ADMIN_INSERT_CAMPUS_SPEAKERS =  'INSERT INTO campus.speakers ' +
										   '(name, description) '+
										   'VALUES($1, $2)' +
										   'RETURNING campus.speakers.id';

exports.DB_ADMIN_UPDATE_CAMPUS_SPEAKERS =  'UPDATE campus.speakers SET ' +
										   'name = COALESCE($1, name), ' +
										   'description = COALESCE($2, description) ' +
										   'WHERE id = $3';


exports.DB_FOCUS_GET_HISTORY_BY_ID = 'SELECT id, url, state, title, description, id_reference, main_category, secondary_categories, create_date, update_date, email, token FROM focus.histories WHERE id = $1';
exports.DB_FOCUS_GET_HISTORY_BY_URL = 'SELECT id, state, title, description, id_reference, main_category, secondary_categories, create_date, update_date, email, token FROM focus.histories WHERE url = $1';

exports.DB_FOCUS_GET_HISTORY_BY_TOKEN = 'SELECT id, state, title, description, id_reference, main_category, secondary_categories, create_date, update_date, token, email FROM focus.histories WHERE token = $1'; //mirar si queremos email o no. De momento no

exports.DB_FOCUS_GET_HISTORIES_USER_BY_STATE_AND_SEARCH = 'SELECT id, url, state, title, description, id_reference, main_category, secondary_categories, create_date, update_date FROM focus.histories WHERE state= $1 AND LOWER(title) LIKE $2';

exports.DB_FOCUS_UPDATE_MAIL_HISTORIES_USER = 'UPDATE focus.histories SET email=COALESCE($1, email) WHERE id = $2';

exports.DB_FOCUS_GET_MAIL_HISTORIES_USER = 'SELECT email  FROM focus.histories WHERE id = $1';

exports.DB_FOCUS_GET_HISTORIES_USER_BY_STATE_AND_SEARCH_AND_CATEGORY = 'SELECT id, url, state, title, description, id_reference, main_category, secondary_categories, create_date, update_date FROM focus.histories WHERE state= $1 AND LOWER(title) LIKE $2  AND (main_category= $3 OR $3=ANY(secondary_categories))';

exports.DB_FOCUS_GET_HISTORIES_ADMIN_PAGINATE = "SELECT id, url, state, title, description, email, id_reference, main_category, secondary_categories, create_date, update_date, token FROM focus.histories WHERE LOWER(title) LIKE $1 AND state != 5";

exports.DB_FOCUS_UPDATE_FOCUS_HISTORY_ID_VERSION = 'UPDATE focus.histories SET token=COALESCE($1, token) WHERE id = $2';

exports.DB_FOCUS_UPDATE_FOCUS_HISTORY_URL = 'UPDATE focus.histories SET url=COALESCE($1, url) WHERE id = $2';

exports.DB_FOCUS_EXIST_HISTORY_BY_TOKEN = 'SELECT id FROM focus.histories WHERE token = $1';

exports.DB_FOCUS_INSERT_FOCUS_HISTORY = 'INSERT INTO focus.histories (url, token, state, title, description, email, id_reference, main_category, secondary_categories, create_date, update_date) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING focus.histories.id'

exports.DB_FOCUS_INSERT_FOCUS_HISTORY_WITH_ID = 'INSERT INTO focus.histories (url, token, state, title, description, email, id_reference, main_category, secondary_categories, create_date, update_date, id) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING focus.histories.id'

exports.DB_ADMIN_DELETE_FOCUS_HISTORY = 'DELETE FROM focus.histories WHERE id = $1';

exports.DB_ADMIN_DELETE_FOCUS_CONTENT_BY_ID_HISTORY = 'DELETE FROM focus.contents_histories WHERE id_history = $1';

exports.DB_FOCUS_GET_STATE_HISTORY_BY_TOKEN = 'SELECT state FROM focus.histories WHERE token= $1';

exports.DB_FOCUS_GET_STATE_HISTORY_BY_ID = 'SELECT state FROM focus.histories WHERE id= $1';
exports.DB_FOCUS_GET_STATE_HISTORY_BY_URL = 'SELECT state FROM focus.histories WHERE url= $1';

exports.DB_FOCUS_UPDATE_FOCUS_STATE_HISTORY = 'UPDATE focus.histories SET state=COALESCE($1, state) WHERE id = $2';

exports.DB_FOCUS_INSERT_FOCUS_CONTENTS_HISTORY = 'INSERT INTO focus.contents_histories (title, description, type_content, visual_content, align, id_history, body_content, order_content) VALUES %L'

exports.DB_FOCUS_GET_HISTORIES_COUNT = 'SELECT count(*) FROM focus.histories WHERE LOWER(title) LIKE $1  AND state != 5';

exports.DB_FOCUS_GET_CONTENTS_HISTORIES_PARTICULAR_HISTORY = 'SELECT id, title, description, type_content, visual_content, align, id_history, body_content, order_content FROM focus.contents_histories WHERE id_history = $1 ORDER BY order_content ASC';

exports.DB_FOCUS_GET_IMAGE_BY_CATEGORY = 'SELECT category_id, route FROM focus.image_category WHERE category_id= $1';


/*
exports.DB_FOCUS_GET_HISTORIES = 'SELECT id, state, title, description, email, id_reference, main_category, secondary_categories, create_date, update_date FROM focus.histories';


exports.DB_FOCUS_GET_CONTENTS_HISTORIES = 'SELECT id, title, description, visual_content, type_content, id_history FROM focus.contents_histories';

exports.DB_FOCUS_UPDATE_FOCUS_HISTORY = 'UPDATE focus.histories SET state=COALESCE($1, state), title = COALESCE($2, title), ' +
							'description = COALESCE($3, description),  email = COALESCE($4, email),  id_reference = COALESCE($5, id_reference), main_category = COALESCE($6, main_category),  secondary_categories = COALESCE($7, secondary_categories) WHERE id = $8';



exports.DB_FOCUS_UPDATE_FOCUS_CONTENTS_HISTORY = 'UPDATE focus.contents_histories SET title = COALESCE($1, title), ' +
							'description = COALESCE($2, description), visual_content = COALESCE($3, visual_content),  id_history = COALESCE($4, id_history) WHERE id = $5';


exports.DB_ADMIN_DELETE_FOCUS_CONTENT = 'DELETE FROM focus.contents_histories WHERE id = $1';
*/



exports.DB_CKAN_TOTAL_RATING = 'SELECT package_id, count(package_id) AS total_votes FROM public.review ' + 
								'GROUP BY package_id ORDER BY total_votes DESC';
