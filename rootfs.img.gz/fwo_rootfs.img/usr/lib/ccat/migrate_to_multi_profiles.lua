
-- migrate_to_multi_profiles.lua
--
-- Copyright (c) 2014 Amazon.com, Inc. or its affiliates.  All rights reserved.
--
-- PROPRIETARY/CONFIDENTIAL
--
-- Use is subject to license terms.

require 'sqlite3'
require 'llog'
package.path = package.path .. ";/usr/lib/ccat/?.lua"
require 'cc_db_util'
require 'sql_functions'
require 'cc_string_util'

local DCM_DB_PATH="/var/local/dcm.db"
-- The value of orgin type shared is 12. This corresponds to the books whitelisted to kid's from parent.
local ORIGIN_TYPE_SHARED = 12
-- Key for string type
local STRING_TYPE_KEY = "string"

local SQLS_PATH = {
		DCM = "/usr/share/cc/dcm.sqls",
		MIGRATE_TO_DCM = "/usr/share/cc/migrate_dcm.sqls"
		}

local MASTER_PROFILE_JSON_PATH="/var/local/java/prefs/MasterProfile.json"

local LOG_MODULE="Migrating DCM"
local DCM = {
	db = assert(cc_db_util.package_for_assert(sqlite3.open(DCM_DB_PATH)))
	
}

-- Creates the DCM db by consuming the queries inside dcm.sqls 
local function create_dcm_db()
	llog.info(LOG_MODULE, "create_dcm_db", "creating new dcm db", "")
	DCM.sqls = io.lines(SQLS_PATH.DCM)
	local ok, msg = pcall(function()
		return cc_db_util.upgrade_db(DCM.db, DCM, 1, false)
	 end)

	assert(ok,msg)
end

-- Updates the DCM db by consuming the queries inside migrate_dcm.sqls 
local function populate_dcm_entries()
	llog.info(LOG_MODULE, "populate_dcm_entries", "populating dcm entries from cc db", "")
	DCM.sqls = io.lines(SQLS_PATH.MIGRATE_TO_DCM)
	local ok, msg = pcall(function()
		return cc_db_util.upgrade_db(DCM.db, DCM, 1, false)
	end)
	assert(ok,msg)
end

-- Returns the list of profile IDs and the active Profile Id by reading
-- the MasterProfile.json.
local function get_profile_ids_info()
	llog.info(LOG_MODULE, "get_profile_ids_info", "Retrieving profile IDs befor migration", "")
    local prefs_file = assert(io.open(MASTER_PROFILE_JSON_PATH, "r"))
	local profile_prefs = prefs_file:read "*a"
	prefs_file:close()

    local ok, prefs_table = pcall(
		function()
			return json.decode(profile_prefs)
		end)
	if not ok then
		local err_msg = json_encode_err_msg(prefs_table)
		assert(false, err_msg)
	end
	
	local directedIds = {}
	if prefs_table.children then 
		for _,child in pairs(prefs_table.children) do
			if child and child.directedId then
				directedIds[#directedIds + 1] = child.directedId
			end
		end
	end
	
	
	llog.debug4(LOG_MODULE, "get_profile_ids_info", " Available profiles :: %s", "", tostring(cc_string_util.dump(directedIds)))
	return prefs_table.activeProfileId , directedIds
end

-- This method updates the CC db and DCM db during migration 
-- for individual profiles.
local function update_profile_and_dcm_db(profileId)
	llog.info(LOG_MODULE, "update_profile_and_dcm_db", "Updating databases for profile: %s ", "", profileId)
	-- Making a copy of the cc db in the profileId inside /var/local/cc/
	if os.execute("cp /var/local/cc.db /var/local/cc/" .. profileId .. ".cc.db") ~= 0 then
		llog.info(LOG_MODULE, "update_profile_and_dcm_db", "Copy Failed!! profile: %s ", "", profileId)
		os.execute("rm -f /var/local/cc/" .. profileId .. ".cc.db")
		return
	end
	local sql = ""
	local profile_db = assert(cc_db_util.package_for_assert(sqlite3.open("/var/local/cc/" .. profileId .. ".cc.db")))
	install_icu_collator(profile_db)

	-- Deletes all the entries from the copied CC db expect the ones whitelisted for this profile. 
	sql = "DELETE FROM Entries WHERE p_cdeKey NOT IN (SELECT p_cdeKey from ProfileCatalog where p_profileId = '" .. profileId .. "') OR p_cdeKey IS NULL"
	llog.debug4(LOG_MODULE, "update_profile_and_dcm_db", "Executing query, sql = %s", "", tostring(sql))
	assert(cc_db_util.package_for_assert(profile_db:exec(sql)))

	-- Updates the lastAccess time for the entries inside CC DB from the ProfileCatalog table.
	sql = "UPDATE Entries SET p_lastAccess = (SELECT p_lastAccess from ProfileCatalog where p_profileId = '" .. profileId .. "' AND Entries.p_cdeKey = ProfileCatalog.p_cdeKey)"
	llog.debug4(LOG_MODULE, "update_profile_and_dcm_db", "Executing query, sql = %s", "", tostring(sql))
	assert(cc_db_util.package_for_assert(profile_db:exec(sql)))
	
	-- Updates the display tags for the entries inside CC DB from the ProfileCatalog table.
	sql = "UPDATE Entries SET j_displayTags = (SELECT j_displayTags from ProfileCatalog where p_profileId = '" .. profileId .. "' AND Entries.p_cdeKey = ProfileCatalog.p_cdeKey)"
	llog.debug4(LOG_MODULE, "update_profile_and_dcm_db", "Executing query, sql = %s", "", tostring(sql))
	assert(cc_db_util.package_for_assert(profile_db:exec(sql)))
	
	-- Updates the percentFinished for the entries inside CC DB from the ProfileCatalog table.
	sql = "UPDATE Entries SET p_percentFinished = (SELECT p_percentFinished from ProfileCatalog where p_profileId = '" .. profileId .. "' AND Entries.p_cdeKey = ProfileCatalog.p_cdeKey) WHERE p_isArchived = 0"
	llog.debug4(LOG_MODULE, "update_profile_and_dcm_db", "Executing query, sql = %s", "", tostring(sql))
	assert(cc_db_util.package_for_assert(profile_db:exec(sql)))
	
	 
        -- Updates the originType for the entries inside CC DB from the ProfileCatalog table.
        sql = "UPDATE Entries SET p_originType = " .. ORIGIN_TYPE_SHARED .. " WHERE p_cdeKey IN (SELECT p_cdeKey from ProfileCatalog where p_profileId = '" .. profileId .. "')"
        llog.debug4(LOG_MODULE, "update_profile_and_dcm_db", "Executing query, sql = %s", "", tostring(sql))
        assert(cc_db_util.package_for_assert(profile_db:exec(sql)))

	-- Runs VACUUM to rebuild the database because of fragmentation due to 
	-- updates/inserts and also the free the database pages after deletes	
	assert(cc_db_util.package_for_assert(profile_db:exec("VACUUM")))
	profile_db:close()

	-- Attaches the current profile db to DCM db before updating entries inside DCM
	sql = "ATTACH DATABASE \"/var/local/cc/" .. profileId .. ".cc.db\" AS cc"
	llog.debug4(LOG_MODULE, "update_profile_and_dcm_db", "Executing query, sql = %s", "", tostring(sql))
	assert(cc_db_util.package_for_assert(DCM.db:exec(sql)))

	-- Updates the reference count of contents inside DeviceContentEntry which are whitelisted for the current profile Id
	sql = "UPDATE DeviceContentEntry set p_referenceCount = p_referenceCount + 1 WHERE p_cdeKey IN (SELECT p_cdeKey from cc.Entries where p_location NOT NULL)"
	llog.debug4(LOG_MODULE, "update_profile_and_dcm_db", "Executing query, sql = %s", "", tostring(sql))
	assert(cc_db_util.package_for_assert(DCM.db:exec(sql)))

	-- Updates the EntryUserAssociation table in DCM by inserting the uuid->profileId association
	sql = "INSERT into EntryUserAssociation (p_uuid, p_profileId) SELECT Entries.p_uuid, '" .. profileId .."' from cc.Entries where Entries.p_location NOT NULL"
	llog.debug4(LOG_MODULE, "update_profile_and_dcm_db", "Executing query, sql = %s", "", tostring(sql))
	assert(cc_db_util.package_for_assert(DCM.db:exec(sql)))

	-- Detach the DB once we are done with migration as mentioned in the above steps.
	sql = "DETACH DATABASE cc"
	llog.debug4(LOG_MODULE, "update_profile_and_dcm_db", "Executing query, sql = %s", "", tostring(sql))
	assert(cc_db_util.package_for_assert(DCM.db:exec(sql)))
	
end

-- The method is the starting point for migrating the CC db for
-- multiple profiles model.
local function migrate_cc_db_for_profiles()
	local activeDirectedId, directedIds = get_profile_ids_info()
	for _,directedId in pairs(directedIds) do
		if directedId then
			update_profile_and_dcm_db(directedId)
		end
	end
	if activeDirectedId and tostring(type(activeDirectedId)) == STRING_TYPE_KEY then
	    llog.info(LOG_MODULE, "migrate_cc_db_for_profiles", "Updating databases for active profile: %s ", "", activeDirectedId)	
	    os.execute("mv /var/local/cc.db /var/local/cc/default.cc.db")
	    os.execute("mv /var/local/cc/" .. activeDirectedId .. ".cc.db /var/local/cc.db")
	end
end

create_dcm_db()
populate_dcm_entries()
migrate_cc_db_for_profiles()
DCM.db:close()
