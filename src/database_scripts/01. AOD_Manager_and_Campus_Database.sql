----------------------------------------------
-- AOD MANAGER AND CAMPUS SCHEMA DEFINITION --
----------------------------------------------

-- 1. Login with postgres user into psql console
psql -h localhost -U postgres

-- 1.1. Launch commands
-- USER CREATION
CREATE USER aod_admin PASSWORD 'SET_YOUR_PASS';
ALTER ROLE aod_admin WITH SUPERUSER;
-- DATABASE CREATION
CREATE DATABASE aod WITH OWNER = aod_admin ENCODING = 'UTF8';
COMMENT ON DATABASE aod IS 'AOD database to manage all the Open Data infrastructure schemas';

-- 2. Exit from psql console and login with the new user
-- 2.1. Exit current connection in psql console
\q 

-- 2.2. Login with the new user
psql -h localhost -U aod_admin -d aod

-- 2.3. Launch commands
-- MANAGER SCHEMA CREATION
CREATE SCHEMA manager AUTHORIZATION aod_admin;
COMMENT ON SCHEMA manager IS 'Schema for the AOD applications global administration';
-- MANAGER GRANTS
GRANT ALL ON SCHEMA manager TO aod_admin;
-- CAMPUS SCHEMA CREATION
CREATE SCHEMA campus AUTHORIZATION aod_admin;
COMMENT ON SCHEMA campus IS 'Schema for the AOD campus data storage';
-- CAMPUS GRANTS
GRANT ALL ON SCHEMA campus TO aod_admin;