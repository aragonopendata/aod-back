const express = require('express');
const router = express.Router();
const constants = require('../../util/constants');

const DatasetController = require("../../controllers/web/dataset");


const controller = new DatasetController();
/** GET DATASETS PAGINATED */
router.get(constants.API_URL_DATASETS, controller.getDatasetsPaginated);

/** GET DATASETS BY AUTOCOMPLETE */
router.get(constants.API_URL_DATASETS_AUTOCOMPLETE, controller.getDetesetsAutocomplete);

/** GET DATASETS BY TAGS */
router.get(constants.API_URL_DATASETS_TAGS, controller.getDatasetsTags);

/** GET NEWEST DATASETS */
router.get(constants.API_URL_DATASETS_NEWEST, controller.getDatasetsNewest);

/** GET MOST DOWNLOADED DATASETS */
router.get(constants.API_URL_DATASETS_DOWNLOADED, controller.getDatasetsDownloaded);

/** GET NUMBER OF DATASETS AND RESOURCES */
router.get(constants.API_URL_DATASETS_COUNT, controller.getDatasetsCount);

router.get(constants.API_URL_RESOURCES_COUNT, controller.getResourcesCount);

router.get(constants.API_URL_DATASETS_VOTES_COUNT, controller.getDatasetsVotesCount);

/** GET DATASETS BY TOPIC */
router.get(constants.API_URL_DATASETS_TOPIC + '/:topicName', controller.getDatasetsByTopic);

/** GET DATASETS BY ORGANIZATION */
router.get(constants.API_URL_DATASETS_ORGANIZATION + '/:organizationName', controller.getDatasetsByOrganization);

/** GET DATASET BY NAME */
router.get(constants.API_URL_DATASETS + '/:datasetName', controller.getDatasetsByName);

/** GET DATASET HOMER */
router.get(constants.API_URL_DATASETS_HOMER, controller.getDatasetHomer);

/** GET DATASET HOMER BY PACKAGEID */
router.get(constants.API_URL_DATASETS_HOMER + '/:datasetHomerName', controller.getDatasetHomerByPackageid);

/** GET RDF FILE OF DATASET */
router.get(constants.API_URL_DATASETS_RDF + '/:datasetName', controller.getDatasetRDF);

/** GET DATASETS BY STATS SEARCH  */
router.get(constants.API_URL_DATASETS_STATS_SEARCH + '/:groupName', controller.getDatasetsByStatsSearch);


/** GET DATASETS BY ORGS AND TOPIC  */
router.get(constants.API_URL_DATASETS_SIU, controller.getDatasetsSIU);

/** GET DATASETS RESOURCE_VIEW */
router.get(constants.API_URL_DATASETS_RESOURCE_VIEW, controller.getDatasetResourceView);

/** DOWNLOAD CSV FILE FROM PX */
router.get(constants.API_URL_DATASETS + '/:datasetName' + constants.API_URL_RESOURCE_CSV + '/:resourceName',
    controller.getCsvFileFromPx);


/** UPDATE TRACKING OF DATASET */
router.post(constants.API_URL_DATASETS_TRACKING, controller.updateDatasetTracking);


//RATING
router.get(constants.API_URL_DATASETS + "/:datasetName/:rating", controller.addDatasetRating);

module.exports = router;