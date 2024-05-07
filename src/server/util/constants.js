// Configure Env variables
const dotenv = require('dotenv');
dotenv.config();

/* **************** */
/* COMMON CONSTANTS */
exports.EXPRESS_NODE_REDIRECT_ROUTING_URL = process.env.EXPRESS_NODE_REDIRECT_ROUTING_URL;
exports.EXPRESS_NODE_STARTING_PORT = 4200;
exports.REQUEST_REQUEST_OK = 200;
exports.REQUEST_ERROR_INTERNAL_ERROR = 500;
exports.REQUEST_ERROR_BAD_DATA = 400;
exports.REQUEST_ERROR_CONFLICT = 409;
exports.REQUEST_ERROR_FORBIDDEN = 403;
exports.REQUEST_NOT_FOUND = 404;
exports.REQUEST_ERROR_FORBIDDEN_MESSAGE = 'Not authorized';
/* CORS */
exports.CORS_HEADERS_ALLOW_ORIGIN_HEADER = 'Access-Control-Allow-Origin';
exports.CORS_HEADERS_ALLOW_ORIGIN_VALUE = '*';
exports.CORS_HEADERS_ALLOW_HEADERS_HEADER = 'Access-Control-Allow-Headers';
exports.CORS_HEADERS_ALLOW_HEADERS_VALUE = 'Access-Control-Allow-Headers, Access-Control-Allow-Methods, Access-Control-Allow-Origin, Content-Type, Origin, X-Forwarded-For, X-Requested-With, Accept, Authorization, responsetype';
exports.CORS_HEADERS_ALLOW_METHODS_HEADER = 'Access-Control-Allow-Methods';
exports.CORS_HEADERS_ALLOW_METHODS_VALUE = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
exports.HTTP_REQUEST_METHOD_POST = 'POST';
exports.HTTP_REQUEST_METHOD_GET = 'GET';
exports.HTTP_REQUEST_HEADER_CONTENT_TYPE_FORM_URLENCODED = 'application/x-www-form-urlencoded';
exports.HTTP_REQUEST_HEADER_CONTENT_TYPE_MULTIPART_FORM_DATA = 'multipart/form-data';
exports.HTTP_REQUEST_HEADER_CONTENT_TYPE_JSON = 'application/json';
exports.HTTP_REQUEST_HEADER_USER_AGENT_NODE_SERVER_REQUEST = 'Node.js Server Request';
exports.HTTP_RESPONSE_DATA_ENCODING = 'utf8';

/* API URLS AND CONSTANTS */
exports.API_BASE_URL_WEB = '/aod/services/web';
exports.API_BASE_URL_ADMIN = '/aod/services/admin';
exports.API_BASE_URL_SECURITY = '/aod/services/security';
exports.API_URL_DATASETS = '/datasets';
exports.API_URL_DATASETS_HOMER = '/homer';
exports.API_URL_DATASETS_AUTOCOMPLETE = '/datasets/autocomplete';
exports.API_URL_DATASETS_TAGS = '/datasets/tags';
exports.API_URL_DATASETS_NEWEST = '/datasets/newest';
exports.API_URL_DATASETS_DOWNLOADED = '/datasets/downloaded';
exports.API_URL_DATASETS_COUNT = '/datasets/countDatasets';
exports.API_URL_DATASETS_VOTES_COUNT = '/datasets/countRating';
exports.API_URL_RESOURCES_COUNT = '/datasets/countResources';
exports.API_URL_DATASETS_TOPIC = '/datasets/topic';
exports.API_URL_DATASETS_ORGANIZATION = '/datasets/organization';
exports.API_URL_DATASETS_SIU = '/datasets-siu';
exports.API_URL_DATASETS_STATS_SEARCH = '/datasets/stats';
exports.API_URL_DATASETS_RESOURCE_VIEW = '/resourceView';
exports.API_URL_DATASETS_RDF = '/datasets/rdf';
exports.API_URL_DATASETS_RESOURCE_CSV = '/datasets/datasetName/resourceCSV';
exports.API_URL_RESOURCE_CSV = '/resourceCSV';
exports.API_URL_ORGANIZATIONS = '/organizations';
exports.API_URL_TOPICS = '/topics';
exports.API_URL_TAGS = '/tags';
exports.API_URL_GA_OD_CORE = '/core';
exports.API_URL_GA_OD_CORE_VIEWS = '/views';
exports.API_URL_DATASETS_TRACKING = '/tracking';
exports.API_URL_STATIC_CONTENT_INFO_OPEN_DATA = '/static-content/info/open-data';
exports.API_URL_STATIC_CONTENT_INFO_CONOCIMIENTO = '/static-content/info/conocimiento';
exports.API_URL_STATIC_CONTENT_INFO_APPS = '/static-content/info/applications';
exports.API_URL_STATIC_CONTENT_INFO_EVENTS = '/static-content/info/events';
exports.API_URL_STATIC_CONTENT_INFO_COLLABORATION = '/static-content/info/collaboration';
exports.API_URL_STATIC_CONTENT_TOOLS_DEVELOPERS = '/static-content/tools/developers';
exports.API_URL_STATIC_CONTENT_TOOLS_APIS = '/static-content/tools/apis';
exports.API_URL_AUTHENTICATE = '/authenticate';
exports.API_URL_ADMIN_DATASET = '/dataset';
exports.API_URL_ADMIN_RESOURCE = '/resource';
exports.API_URL_ADMIN_CREATE_FILE = '/uploadfile';
exports.SERVER_API_DOWNLOAD_FILE = '/downloadfile';
exports.API_URL_ADMIN_ORGANIZATION = '/organization';
exports.API_URL_IAEST_PX_FILES = 'http://servicios3.aragon.es/iaeaxi_docs/';
exports.API_URL_ADMIN_STATIC_CONTENT_INFO = '/static-content-admin/info';
exports.API_URL_ADMIN_STATIC_CONTENT_TOOLS = '/static-content-admin/tools';
exports.API_URL_DATASETS_UPLOAD_XLSM = '/resourcexlsm';

/* STATIC CONTENT DATABASE SECTION TITLES */
exports.API_URL_CAMPUS_EVENTS = '/campus/events';
exports.API_URL_CAMPUS_EVENT = '/campus/event';
exports.API_URL_CAMPUS_CONTENTS_OF_EVENT = '/campus/contents';
exports.API_URL_CAMPUS_CONTENT = '/campus/content';
exports.API_URL_CAMPUS_SPEAKERS = '/campus/speakers';
exports.API_URL_CAMPUS_TOPICS = '/campus/topics';
exports.API_URL_CAMPUS_TYPES = '/campus/types';
exports.API_URL_ADMIN_CAMPUS_SITES = '/campus-admin/sites';
exports.API_URL_ADMIN_CAMPUS_SPEAKERS = '/campus-admin/speakers';
exports.API_URL_ADMIN_CAMPUS_TYPES = '/campus-admin/types';
exports.API_URL_ADMIN_CAMPUS_PLATFORMS = '/campus-admin/platforms';
exports.API_URL_ADMIN_CAMPUS_FORMATS = '/campus-admin/formats';
exports.API_URL_ADMIN_CAMPUS_ENTRIES_BY_SPEAKER = '/campus-admin/speakers/entries';
exports.API_URL_ADMIN_CAMPUS_TOPICS = '/campus-admin/topics';
exports.API_URL_ADMIN_CAMPUS_EVENTS = '/campus-admin/events';
exports.API_URL_ADMIN_CAMPUS_ENTRIES_BY_EVENT = '/campus-admin/event/entries';
exports.API_URL_ADMIN_CAMPUS_ENTRIES = '/campus-admin/entries';
exports.STATIC_CONTENT_SECTION_TITLE_INFO = 'INFORMACIÓN';
exports.STATIC_CONTENT_SECTION_TITLE_TOOLS = 'HERRAMIENTAS';
exports.STATIC_CONTENT_SECTION_TITLE_CONOCIMIENTO = 'CONOCIMIENTO';
exports.STATIC_CONTENT_SUBSECTION_TITLE_OPEN_DATA = 'OPEN DATA';
exports.STATIC_CONTENT_CONTENT_TITLE_TERM = 'TÉRMINOS DE USO Y LICENCIAS';
exports.STATIC_CONTENT_SUBSECTION_TITLE_APPS = 'APLICACIONES';
exports.STATIC_CONTENT_SUBSECTION_TITLE_EVENTS = 'EVENTOS';
exports.STATIC_CONTENT_SUBSECTION_TITLE_COLLABORATION = 'COLABORA';
exports.STATIC_CONTENT_SUBSECTION_TITLE_DEVELOPERS = 'DESARROLLADORES';
exports.STATIC_CONTENT_SUBSECTION_TITLE_APIS = 'APIS';
exports.STATIC_CONTENT_SUBSECTION_TITLE_SPARQL = 'SPARQL';
exports.STATIC_CONTENT_SUBSECTION_TITLE_ONTOLOGIA = 'ONTOLOGIAS Y DATOS ENLAZADOS';
/* ADMIN CONSTANTS */
exports.APPLICATION_NAME_CKAN = 'CKAN';
/* SQL CONSTANTS */
exports.SQL_RESULSET_FORMAT_JSON = 'json';
exports.XLSM_PATH = '/data/assets/public/documentos/ei2aRelated/';
//exports.XLMS_PATH = '/tmp/';

/* *************** */
/* CKAN PROPERTIES */
exports.CKAN_API_BASE_URL = process.env.CKAN_API_BASE_URL;
exports.CKAN_BASE_URL = process.env.CKAN_BASE_URL;
exports.CKAN_BASE_PORT = process.env.CKAN_BASE_PORT;
/* DATASETS ACCESS TRACKING REGISTRY */
exports.CKAN_URL_PATH_TRACKING_DATASET = '/dataset';
exports.CKAN_URL_PATH_TRACKING = '/_tracking';
exports.CKAN_TRACKING_TYPE_PARAM_PAGE = 'page';
/* CKAN ADMIN - USERS */
exports.CKAN_URL_PATH_USER_CREATE = 'user_create';
exports.CKAN_URL_PATH_USER_UPDATE = 'user_update';
exports.CKAN_URL_PATH_USER_DELETE = 'user_delete';
exports.CKAN_URL_PATH_USER_SHOW = 'user_show';

exports.CKAN_URL_PATH_GROUP_LIST = 'group_list';
exports.CKAN_URL_PATH_GROUP_MEMBER_CREATE = 'group_member_create';

/* CKAN ADMIN - DATASETS */
exports.CKAN_URL_PATH_DATASET_CREATE = 'package_create';
exports.CKAN_URL_PATH_DATASET_UPDATE = 'package_update';
exports.CKAN_URL_PATH_DATASET_DELETE = 'package_delete';
exports.CKAN_URL_PATH_DATASET_PURGE = 'dataset_purge';
exports.CKAN_URL_PATH_RESOURCE_CREATE = 'resource_create';
exports.CKAN_URL_PATH_RESOURCE_UPDATE = 'resource_update';
exports.CKAN_URL_PATH_RESOURCE_DELETE = 'resource_delete';
exports.CKAN_URL_PATH_RATING_DATASET = "/ckan/rating"

/* CKAN ADMIN - ORGANIZATIONS */
exports.CKAN_URL_PATH_ORGANIZATION_CREATE = 'organization_create';
exports.CKAN_URL_PATH_ORGANIZATION_DELETE = 'organization_delete';
exports.CKAN_URL_PATH_ORGANIZATION_UPDATE = 'organization_update';
exports.CKAN_URL_PATH_ORGANIZATION_PURGE = 'organization_purge';
exports.CKAN_URL_PATH_ORGANIZATION_LIST_OF_USER = 'organization_list_for_user';
exports.CKAN_URL_PATH_ORGANIZATION_MEMBER_CREATE = 'organization_member_create';
exports.CKAN_URL_PATH_ORGANIZATION_MEMBER_DELETE = 'organization_member_delete';

/* DATASETS */
//Results per page in lists
exports.DATASETS_SEARCH_ROWS_PER_PAGE = 20;
//Results in autocomplete
exports.DATASETS_AUTOCOMPLETE_LIMIT = 8;
//Search datasets
exports.DATASETS_SEARCH = 'package_search';
//Search number of datasets
exports.DATASETS_SEARCH_COUNT = 'package_search?rows=0&start=0';
//Get newest datasets
exports.DATASETS_SEARCH_NEWEST = 'package_search?sort=metadata_modified desc&start=0';
//Results per newest datasets
exports.DATASETS_SEARCH_NEWEST_ROWS_LIMIT = 3;
//Get most downloaded datasets
exports.DATASETS_SEARCH_MOST_DOWNLOADED = 'package_search?sort=views_recent desc&start=0';
//Results per most downloaded datasets
exports.DATASETS_SEARCH_MOST_DOWNLOADED_ROWS_LIMIT = 3;
//Get datasets by title
exports.DATASETS_SEARCH_AUTOCOMPLETE = 'package_autocomplete';
//Get dataset by name
exports.DATASET_SHOW = 'package_show';
//Get dataset rdf by name
exports.DATASET_RDF_DATASET = '/dataset';
exports.DATASET_RDF_EXTENSION = '.rdf';
//Get resource view id by resource id
exports.DATASETS_RESOURCE_VIEW = 'resource_view_list'

/* TOPICS */
//List all topics
exports.TOPICS_LIST = 'group_list';
//Get topic by name
exports.TOPIC_SHOW = 'group_show';
/* ORGANIZATIONS */
//List all organizations
exports.ORGANIZATIONS_LIST = 'organization_list';
//List all organizations
exports.ORGANIZATIONS_LIST_FOR_USER = 'organization_list_for_user';
//Show organization detail
exports.ORGANIZATION_DETAIL = 'organization_show';
/* TAGS */
//List all tags
exports.TAGS_LIST = 'tag_list';
/* RESOURCES */
//List all resources
exports.RESOURCES_SEARCH_COUNT = 'resource_search?query=hash:&limit=0';
/* GA OD CORE VIEWS */
exports.GA_OD_CORE_BASE_URL = process.env.GA_OD_CORE_BASE_URL;
//List all views
exports.GA_OD_CORE_VIEWS_LIST = '/views';
/* HOMER PROPERTIES */
exports.HOMER_API_BASE_URL = 'http://opendata-federation.csi.it/fed-homer/documents/select';
//Results per page in lists
exports.DATASETS_HOMER_SEARCH_ROWS_PER_PAGE = 20;

/* RATING */
//Service Name
exports.RATING_SERVICE_NAME = 'rating';

exports.SERVER_API_LINK_PARAM_SORT = 'sort';
exports.SERVER_API_LINK_DEFAULT_SORT = 'relevance asc,metadata_modified desc';
exports.SERVER_API_LINK_DEFAULT_SORT_HOMER = 'field asc';
exports.SERVER_API_LINK_PARAM_START = 'start';
exports.SERVER_API_LINK_PARAM_ROWS = 'rows';
exports.SERVER_API_LINK_PARAM_TYPE = 'type';
exports.SERVER_API_LINK_PARAM_TAGS = 'tags';
exports.SERVER_API_LINK_PARAM_TEXT = 'text';
exports.SERVER_API_LINK_PARAM_LANG = 'lang';
exports.SERVER_API_LINK_PARAM_LIMIT = 'limit';
exports.SERVER_API_LINK_PARAM_ORGANIZATION = 'organization';
exports.SERVER_API_LINK_PARAM_HOMER_RESPONSE_FORMAT = '&wt=json';
exports.SERVER_API_LINK_PARAM_RESOURCE_ID = 'resId';

exports.SERVER_API_SORT_DESC = 'desc';
exports.SERVER_API_SORT_ASC = 'asc';

exports.SERVER_API_LINK_PARAM_TYPE_CALENDAR = 'calendario';
exports.SERVER_API_LINK_PARAM_TYPE_PHOTO = 'fotos';
exports.SERVER_API_LINK_PARAM_TYPE_SPREADSHEET = 'hojas-de-calculo';
exports.SERVER_API_LINK_PARAM_TYPE_MAPS = 'mapas';
exports.SERVER_API_LINK_PARAM_TYPE_EDUCATION_RESOURCES = 'recursos-educativos';
exports.SERVER_API_LINK_PARAM_TYPE_WEB_RESOURCES = 'recursos-web';
exports.SERVER_API_LINK_PARAM_TYPE_RSS = 'rss';
exports.SERVER_API_LINK_PARAM_TYPE_PLAIN_TEXT = 'texto-plano';

exports.SERVER_API_LINK_PARAM_TYPE_CALENDAR_QUERY = '&q=(res_format:(ics OR ICS)) AND dataset_type:dataset AND entity_type:package AND state:active AND capacity:public';
exports.SERVER_API_LINK_PARAM_TYPE_PHOTO_QUERY = '&q=(res_format:(jpeg OR JPEG OR jpg OR JPG OR png OR PNG OR gif OR GIF))AND dataset_type:dataset AND entity_type:package AND state:active AND capacity:public';
exports.SERVER_API_LINK_PARAM_TYPE_SPREADSHEET_QUERY = '&q=(res_format:(XLS OR xls OR ods OR ODS OR xlsx OR XLSX))AND dataset_type:dataset AND entity_type:package AND state:active AND capacity:public';
exports.SERVER_API_LINK_PARAM_TYPE_MAPS_QUERY = '&q=(res_format:(dxf OR DXF OR gml OR GML OR geojson OR GEOJSON OR kmz OR KMZ OR shp OR SHP OR dgn OR DGN OR dwg OR DWG))AND dataset_type:dataset AND entity_type:package AND state:active AND capacity:public';
exports.SERVER_API_LINK_PARAM_TYPE_EDUCATION_RESOURCES_QUERY = '&q=(name:(recurso-educativo*))AND dataset_type:dataset AND entity_type:package AND state:active AND capacity:public';
exports.SERVER_API_LINK_PARAM_TYPE_WEB_RESOURCES_QUERY = '&q=(res_format:(html OR HTML OR url OR URL))AND dataset_type:dataset AND entity_type:package AND state:active AND capacity:public';
exports.SERVER_API_LINK_PARAM_TYPE_RSS_QUERY = '&q=(res_format:(rss OR RSS))AND dataset_type:dataset AND entity_type:package AND state:active AND capacity:public';
exports.SERVER_API_LINK_PARAM_TYPE_PLAIN_TEXT_QUERY = '&q=(((res_format:XLS OR res_format:xls ) AND (res_url:http*.xls )) OR res_format:json OR res_format:JSON OR res_format:xml OR res_format:XML OR res_format:csv OR res_format:CSV OR res_format:px OR res_format:PX OR res_format:url OR res_format:URL) AND dataset_type:dataset AND entity_type:package AND state:active AND capacity:public';

//Results per page in campus
exports.CAMPUS_EVENTS_PER_PAGE = 10;

/*  SPARQL */
exports.SPARQL_API_BASE_URL = process.env.SPARQL_API_BASE_URL;
exports.SPARQL_API_QUERY_URL_ALL_GRAPHS = '?query=SELECT  DISTINCT ?g WHERE  { GRAPH ?g {?s ?p ?o} } ORDER BY ?g &format=json';
exports.SPARQL_API_LINK_PARAM_GRAPH = '?default-graph-uri=';
exports.SPARQL_API_LINK_PARAM_QUERY = '&query=';
exports.SPARQL_API_LINK_PARAM_FORMAT = '&format=';
exports.SPARQL_API_LINK_PARAM_TIMEOUT = '&timeout=';
exports.SPARQL_API_LINK_PARAM_DEBUG = '&debug=';

/* ******************* */
/* DATABASE PROPERTIES */
exports.DB_HOST = process.env.DB_HOST;
exports.DB_NAME = process.env.DB_NAME;
exports.DB_PORT = process.env.DB_PORT;
exports.DB_USER = process.env.DB_USER;
exports.DB_PASSWORD = process.env.DB_PASSWORD;
exports.DB_MAX_CONNECTIONS = process.env.DB_MAX_CONNECTIONS; //default 10
exports.DB_IDLE_TIMEOUT_MILLIS = process.env.DB_IDLE_TIMEOUT_MILLIS; // default 10000 (10 seconds)
exports.DB_CONNECTION_TIMEOUT_MILLIS = process.env.DB_CONNECTION_TIMEOUT_MILLIS;

/* ******************* */
/* CKAN DATABASE PROPERTIES */
exports.DB_CKAN_HOST = process.env.DB_CKAN_HOST;
exports.DB_CKAN_NAME = process.env.DB_CKAN_NAME;
exports.DB_CKAN_PORT = process.env.DB_CKAN_PORT;
exports.DB_CKAN_USER = process.env.DB_CKAN_USER;
exports.DB_CKAN_PASSWORD = process.env.DB_CKAN_PASSWORD;

/* **************** */
/* PROXY PROPERTIES */
exports.REQUESTS_NEED_PROXY = process.env.REQUESTS_NEED_PROXY;
exports.PROXY_USER = process.env.PROXY_USER;
exports.PROXY_PASS = process.env.PROXY_PASS;
exports.PROXY_URL = process.env.PROXY_URL;
exports.PROXY_PORT = process.env.PROXY_PORT;

/* **************** */
/* SMTP PROPERTIES */
exports.SMTP_USER = process.env.SMTP_USER;
exports.SMTP_PASSWORD = process.env.SMTP_PASSWORD;
exports.SMTP_HOST = process.env.SMTP_HOST;
exports.SMTP_PORT = process.env.SMTP_PORT;

/* ELASTIC PROPERTIES */
exports.ELASTIC_USER= process.env.ELASTIC_USER
exports.ELASTIC_PASS= process.env.ELASTIC_PASS


/* ******************* */
/* ANALYTICS CONF */
exports.ANALYTICS_LOGSTASH_PATH = '/data/apps/LogStash'
exports.ANALYTICS_ELASTIC_URL = 'http://' + process.env.ELASTIC_HOST + ':9200'

/* ******************* */
/* SPIDER LOG FILE */
exports.SPIDER_LOG_PATH = '/data/logs/spider/spider.log';
exports.SPIDER_EMAIL_REVISION_PATH = '/data/scripts/procesos/spider/emailRevision.json';



/* ******************* */
/* FOCUS */

exports.API_URL_FOCUS_HISTORY_DELETE = '/focus/history/delete';
exports.API_URL_FOCUS_HISTORY_BORRRADOR = '/focus/history/borrador';
exports.API_URL_FOCUS_HISTORY = '/focus/history';
exports.API_URL_FOCUS_HISTORY_URL = '/focus/history/url';
exports.API_URL_FOCUS_HISTORY_TOKEN = '/focus/history/token';
exports.API_URL_FOCUS_HISTORY_MAIL = '/focus/history/mail';
exports.API_URL_FOCUS_STATE_HISTORY_TOKEN = '/focus/history/token/state';
exports.API_URL_FOCUS_IMAGE_CATEGORY = '/focus/imageCategory';

exports.API_URL_FOCUS_HISTORIES = '/focus/histories';


/* *********************** */
/* GAPI4 */

exports.GAPI4_HOST = process.env.GAPI4_HOST;
exports.GAPI4_PORT = process.env.GAPI4_PORT;


exports.statesEnum = {
    sinDefinir:0,
    borrador : 1 ,
    revision : 2,
    publicada : 3,
    desactivada : 4,
    versionada : 5
}







