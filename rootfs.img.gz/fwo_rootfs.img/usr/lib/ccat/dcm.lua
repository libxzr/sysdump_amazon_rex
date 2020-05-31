-- Copyright (c) 2014-2015 Amazon.com, Inc. or its affiliates. All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.
-- DCM denotes Device Content Manager and this file holds the business 
-- logic forDCM DB changes
local modname = ...
local dcm = {}
_G[modname] = dcm

require 'llog'
require 'cc_db_util'

-- Default user Profile Value
local default_user_value = "DEFAULT_USER"
-- Create Binder
local make_binder = cc_db_util.make_binder
-- DB pointer
local db
-- List of indexing commands to be issued after ending db transaction.
local index_work_list = {}
-- In an update to an indexedState column this will decrement by 1
-- to indicate an indexing attempt
local indexed_state_attempted = -1
-- In an update to an indexedState column this will increment by 1
-- to add another retry. Not using '1' because that means indexing 
-- has completed successfully.
local indexed_state_revert  =  1000
-- This is the Java Integer.MAX_VALUE.  It is used
-- as a sentinel for indicating that a CC item will
-- not be indexed etc.
local integer_max_value = 2147483647

-- "enum" values
-- (Using tables for values so that == compares by reference.)
local change_type_names = { insert = { "insert" }, update = { "update" } }

-- Set db (DCM db)
function dcm.set_db(db_)
    db = db_
end

-- Begin Transaction on DCM
function dcm.begin()
    assert(cc_db_util.begin(db))
end

-- ROLLBACK Transaction on DCM
function dcm.rollBack()
    db:exec[[ROLLBACK]]
end

-- Commit Transaction on DCM
 function dcm.commit()
     assert(cc_db_util.commit(db))
 end

-- Generic factory for scalar field change functions.
local function scalar_field(field_name)
    local function update_field(obj, binder, change_type)
        return { ["p_" .. field_name] = binder:bind(obj[field_name]) }, { }
    end

    return update_field
end

-- Changing an indexed state column. A value of -1 indicates a failure and will decrement
-- the column's present value by 1.
local function indexed_state(field_name)
    local function update_field(obj, binder, change_type)
        local p_fieldName = "p_" .. field_name
        --If an update occurs and the value is < 0 we will decrement the value by 1.
        if change_type == change_type_names.update then
            local function getSQL(p_fieldName, uuid, indexedStateModifier)
                    return "UPDATE  DeviceContentEntry SET " ..p_fieldName.. " = " ..p_fieldName..indexedStateModifier.." where p_uuid = \"" .. uuid .. "\""
            end
            --check for special values which modify existing indexed state
            if obj[field_name] == indexed_state_attempted then 
                --increase retry count by decrementing the indexed state by one
                return { }, {{sql= getSQL(p_fieldName, obj.uuid, "- 1")}}
            elseif  obj[field_name] == indexed_state_revert then
                --decrease retry count by inrementing the indexed state by one
                return { }, {{sql= getSQL(p_fieldName, obj.uuid, "+ 1")}} 
            end                
        end
        return { [p_fieldName] = binder:bind(obj[field_name]) }, { }
    end

    return update_field
end

-- DCM Columns
local column_specs =
{
    uuid                  = scalar_field("uuid"),
    location              = scalar_field("location"),
    thumbnail             = scalar_field("thumbnail"),
    cdeKey                = scalar_field("cdeKey"),
    cdeType               = scalar_field("cdeType"),
    modificationTime      = scalar_field("modificationTime"),
    isVisibleInHome       = scalar_field("isVisibleInHome"),
    diskUsage             = scalar_field("diskUsage"),
    contentIndexedState   = indexed_state("contentIndexedState"),
    referenceCount        = scalar_field("referenceCount"),
    profileId             = scalar_field("profileId"),
    version               = scalar_field("version"),
    guid                  = scalar_field("guid"),
    contentSize           = scalar_field("contentSize"),
    ownershipType         = scalar_field("ownershipType"),
    mimeType              = scalar_field("mimeType"),
    type                  = scalar_field("type")
}

-- Check if the Item is white listed
-- This check happens only when in Kids mode
-- @param pcm_db
--         Active Profile CC db
-- @param uuid
--         UUID to be matched
-- @param cde_key
--         cdeKey to be matched
-- @param cde_type
--         cdeType to be matched
-- @return uuid
--         uuid in Profile CC DB
local function check_item_whitelisted_for_profile( pcm_db, uuid, cde_key, cde_type )
    llog.debug4("check_item_whitelisted_for_profile", "enter", "cdeType=%s,cdeKey=%s,uuid=%s", "", tostring(cde_type), tostring(cde_key), tostring(uuid))
    
    local binder = make_binder()
    local stmt = nil
    local sql = "SELECT p_uuid AS uuid FROM Entries WHERE "
    if cde_type and cde_key then
        sql = sql .. [[ p_cdeType = ]] .. binder:bind(cde_type) .. [[ AND p_cdeKey = ]] .. binder:bind(cde_key) .. [[ AND p_isArchived = 1 LIMIT 1 ]]
    elseif uuid then
        sql = sql .. [[ p_uuid = ]] .. binder:bind(uuid) .. [[ LIMIT 1 ]]
    else
        return nil
    end

    llog.debug4("dcm", "sql", "sql=%s", "", tostring(sql))
    return cc_db_util.select_first_row (pcm_db, sql, binder.bind_vars)
end

-- Checks if the item exits in DCM for given location
-- @param location
--            Item location
-- @param uuid
--            Item uuid
local function check_item_exists_in_dcm(location, uuid)
    local sql = "SELECT p_uuid AS uuid, p_referenceCount as referenceCount, p_contentIndexedState as contentIndexedState, p_location as location, p_guid as guid, p_version as version FROM DeviceContentEntry WHERE "
    local bind_var
    if location then
        sql = sql .. [[ p_location = ? ]]
        bind_var = location
    elseif uuid then
        sql = sql .. [[ p_uuid = ? ]]
        bind_var = uuid
    end
    sql = sql .. [[ LIMIT 1 ]]

    llog.debug4("dcm", "check_item_exists_in_dcm", "sql=%s", "", tostring(sql))

    return cc_db_util.select_first_row(db, sql, bind_var)
end

-- Insert New item to DeviceContentEntry Table in DCM
-- @param bind_variables
--            binding variables
-- @param is_whitelisted
--            Is content whitelisted in the Profile CC below
local function dcm_insert_new_entry(bind_variables, is_whitelisted)
    local refCount = {}
    local columns = { }
    local values = { }
    local sqls = { }

    llog.debug4("dcm", "dcm_insert_new_entry enter", "", "")

    local binder = make_binder()

    if bind_variables.contentIndexedState == nil then
        if bind_variables.type ~= "Entry:Item" then
            bind_variables.contentIndexedState = integer_max_value
        else
            bind_variables.contentIndexedState = 0
        end
    end

    -- -1 represents that this item is not present in active Kid db therefore
    -- associate this entry on profile switch
    refCount.referenceCount = is_whitelisted and 1 or -1

    for k, v in pairs(bind_variables) do
        if column_specs[k] then
            local col_changes, extra
                = column_specs[k](bind_variables, binder, change_type_names.insert)

            for col, val in pairs(col_changes) do
                columns[#columns + 1] = col
                values[#values + 1]   = val
            end
        end
    end


    -- TODO: Remove this duplicate code
    for k, v in pairs(refCount) do
        assert(column_specs[k], "Attempt to set unknown field " .. k)
        local col_changes, extra
            = column_specs[k](refCount, binder, change_type_names.insert)

        for col, val in pairs(col_changes) do
            columns[#columns + 1] = col
            values[#values + 1]   = val
        end
    end

    sqls = {
               sql = table.concat{
                         "INSERT OR REPLACE INTO DeviceContentEntry ( ",
                         table.concat(columns, ",\n"),
                         [[ ) VALUES ( ]],
                         table.concat(values, ",\n"),
                         [[ ) ]]
                     },
               bind_vars = binder.bind_vars
           }

    cc_db_util.exec_sql(db, sqls.sql, sqls.bind_vars)

    llog.debug4("dcm", "dcm_insert_new_entry exit", "", "")
end

-- This module updates the reference count of the entry. If count is less than
-- one then reset to 1 else increment by 1
-- @param uuid
--            dcm entry uuid
-- @param refCount
--            previous reference count value
-- @param modification
--            update modification time
-- @param version
--            version of the content
-- @param guid
--            guid of the content
-- @param diskUsage
--            diskUsage of the content
-- @param contentSize
--            contentSize of the content
local function dcm_update_ref_count_for_entry (uuid, refCount, modification, version, guid, diskUsage, contentSize)
    if refCount < 0 then
        refCount = 1;
    elseif refCount > 0 then
        refCount = refCount + 1
    else
        llog.error("dcm", "dcm_update_ref_count_for_entry", "uuid = %s refCount=%d", "Reference Count can never be zero", tostring(uuid), tonumber(refCount))
        return
    end
    local binder = make_binder()
    local sql = [[UPDATE DeviceContentEntry SET p_referenceCount = ]] .. binder:bind(refCount) .. 
                                         [[ , p_modificationTime = ]] .. binder:bind(modification) .. 
                                         [[ , p_version = ]] .. binder:bind(version) .. 
                                         [[ , p_guid = ]] .. binder:bind(guid) .. 
                                         [[ , p_diskUsage = ]] .. binder:bind(diskUsage) .. 
                                         [[ , p_contentSize = ]] .. binder:bind(contentSize) .. 
                                         [[ WHERE p_uuid = ]] .. binder:bind(uuid)
    cc_db_util.exec_sql(db, sql, binder.bind_vars)
    llog.debug4("dcm", "dcm_update_ref_count_for_entry", "uuid = %s refCount=%d sql=%s", "", tostring(uuid), tonumber(refCount), tostring(sql))
end

-- Add values to EntryUserAssociation Table
-- @param uuid
--            UUID of the Item
-- @param profile_data
--            Profile Id of the active user
local function dcm_create_association_for_entry(uuid, profile_data)
    llog.debug4("dcm", "dcm_create_association_for_entry enter", "uuid = %s profile_data=%s", "", tostring(uuid), tostring(profile_data))
    local binder = make_binder()
    local sql = [[INSERT INTO EntryUserAssociation Values ( ]] .. binder:bind(uuid) .. [[ , ]] .. binder:bind(profile_data) ..[[ )]]
    cc_db_util.exec_sql(db, sql, binder.bind_vars)
end

-- Check if the change is white listed in the below PCM db
-- @params pcm_db
--             Active Profile DB
-- @params profile_data
--             Active Profile
-- @params uuid
--             Item UUID
-- @params cdeKey
--             Item cdeKey
-- @params cdeType
--             Item cdeType
-- @return
--        Return is the Item is white listed or not.
local function check_change_whitelisted (pcm_db, profile_data, uuid, cdeKey, cdeType)
    local is_white_listed = true
    -- If in Active DB is that of the Kid then validate if the Item is white listed.
    if (tostring(profile_data) ~= default_user_value) then
        local profile_cc_uuid = check_item_whitelisted_for_profile(pcm_db, uuid, cdeKey, cdeType)
        if not profile_cc_uuid then
            is_white_listed = false
        end
    end
    
    return is_white_listed
end

-- Compare the version/guid passed as the paramerters.
-- @params actual_version
--             Existing version in DCM
-- @params actual_guid
--             Existing guid in DCM
-- @params new_version
--             New version of the content
-- @params new_guid
--             New guid of the content
-- @return
--        Return is the Item is white listed or not.
local function compare_entries(actual_version, actual_guid, new_version, new_guid)
    llog.debug4("dcm", "compare_entries enter", "actual_version=%s actual_guid=%s new_version=%s new_guid=%s", "", tostring(actual_version), tostring(actual_guid) , tostring(new_version), tostring(new_guid))
    if tostring(actual_version) == tostring(new_version) and tostring(actual_guid) == tostring(new_guid) then
        llog.debug4("dcm", "compare_entries exit", "same values", "")
        return 0
    end
    llog.debug4("dcm", "compare_entries exit", "different values", "")
    return 1
end

-- If change type is Delete then make the corresponding changes to DCM as well.
-- @params bind_variables
--             Binding Variables
-- @params profile_data
--             Active Profile
-- @params pcm_db
--             Active Profile DB
-- @return
--        Return is the Item is white listed or not.
local function dcm_delete(bind_variables, profile_data, pcm_db)
    local sqls = { }

    llog.debug4("dcm", "dcm_delete enter", "type = %s uuid=%s", "", tostring(profile_data), tostring(bind_variables.uuid))

    local dcm_obj = check_item_exists_in_dcm(nil, bind_variables.uuid)

    if dcm_obj and dcm_obj.location then
        llog.debug4("dcm", "dcm_delete", "location = %s", "Delete Content Index", tostring(dcm_obj.location))
        local function command()
            delete_index(dcm_obj.location)
        end
        index_work_list[#index_work_list + 1] = command
    end

    local binder = make_binder()
    local delete_predicate = "WHERE p_uuid = " .. binder:bind(bind_variables.uuid)

    -- Delete from DeviceContentEntry table
    sqls = {
               sql = table.concat{
                         [[ DELETE FROM DeviceContentEntry ]],
                         delete_predicate
                     },
                     bind_vars = binder.bind_vars
           }

    cc_db_util.exec_sql(db, sqls.sql, sqls.bind_vars)

    -- Delete from Associations table
    sqls = {
               sql = table.concat{
                         [[ DELETE FROM EntryUserAssociation ]],
                         delete_predicate
                     },
               bind_vars = binder.bind_vars
           }
    cc_db_util.exec_sql(db, sqls.sql, sqls.bind_vars)

    llog.debug4("dcm", "dcm_delete exit", "type = %s uuid=%s", "", tostring(profile_data), tostring(bind_variables.uuid))

    return check_change_whitelisted(pcm_db, profile_data, bind_variables.uuid, nil, nil)
end

-- If change type is Insert or InsertOr then make the corresponding changes to DCM as well.
-- @params bind_variables
--             Binding Variables
-- @params profile_data
--             Active Profile
-- @params pcm_db
--             Active Profile DB
-- @return
--        Return is the Item is white listed or not.
local function dcm_insert(bind_variables, profile_data, pcm_db)

   --Add null checks to keep the dcm db consistent with the cc db

    if bind_variables.isVisibleInHome == nil then
        bind_variables.isVisibleInHome = false
    end

    if bind_variables.ownershipType == nil then
        bind_variables.ownershipType = 0
    end

     --If no modification time is provided on an insert, set to now to  
     --ensure that this is the newest item.
     if bind_variables.modificationTime == nil then               
         bind_variables.modificationTime = tonumber(os.date('%s'))
     end   

    local is_white_listed = check_change_whitelisted(pcm_db, profile_data, nil, bind_variables.cdeKey, bind_variables.cdeType)

    llog.debug4("dcm", "dcm_insert enter", "type = %s location=%s", "", tostring(profile_data), tostring(bind_variables.location))

    if bind_variables.location and cc_string_util.is_file_path(bind_variables.location) then
        -- Check if DCM already has entry for this location
        local dcm_obj = check_item_exists_in_dcm(bind_variables.location, nil)

        -- Item is not present in DCM. Completely New
        if not dcm_obj or not dcm_obj.uuid then
            llog.debug4("dcm", "dcm_insert", "location=%s", "New Content Added!", tostring(bind_variables.location))
            dcm_insert_new_entry(bind_variables, is_white_listed)
        else
            -- Check if the items have different version/guid
            if compare_entries(dcm_obj.version, dcm_obj.guid, bind_variables.version, bind_variables.guid) == 1 then
                llog.debug4("dcm", "dcm_insert", "location=%s", "Item deleted as guid/version mismatch!", tostring(bind_variables.location))
                dcm_delete(dcm_obj, profile_data, pcm_db)
                llog.debug4("dcm", "dcm_insert", "location=%s", "New Content Added as the different version/guid!", tostring(bind_variables.location))
                dcm_insert_new_entry(bind_variables, is_white_listed)
            else
                llog.debug4("dcm", "dcm_insert", "location=%s", "Item Exists in DCM!", tostring(bind_variables.location))
                -- This code flow will be executed when existing book is downloaded by another profile
                if is_white_listed then
                    -- Change the uuid to existing value
                    bind_variables.uuid = dcm_obj.uuid;
                    bind_variables.contentIndexedState = dcm_obj.contentIndexedState

                    -- This would update the Ref count and also update the Modification time, version, guid, diskUsage and Content Size
                    dcm_update_ref_count_for_entry(dcm_obj.uuid, dcm_obj.referenceCount, bind_variables.modificationTime, bind_variables.version, bind_variables.guid, bind_variables.diskUsage, bind_variables.contentSize)
                else
                    assert(false, cc_db_util.package_error(500, "Item not whitelisted."))
                end
            end
        end
        
        if is_white_listed then
            llog.debug4("dcm", "dcm_create_association_for_entry", "type = %s location=%s", "", tostring(profile_data), tostring(bind_variables.location))
            dcm_create_association_for_entry(bind_variables.uuid, profile_data)
        end
    end

    llog.debug4("dcm", "dcm_insert exit", "type = %s location=%s", "", tostring(profile_data), tostring(bind_variables.location))

    return is_white_listed
end

-- If change type is InserOr then convert the request to Insert
-- @params bind_variables
--             Binding Variables
-- @params profile_data
--             Active Profile
-- @params pcm_db
--             Active Profile DB
-- @return
--        Return is the Item is white listed or not.
local function dcm_insert_or(bind_variables, profile_data, pcm_db)
    return dcm_insert(bind_variables.entry, profile_data, pcm_db)
end

-- If change type is Update then make the corresponding changes to DCM as well.
-- @params bind_variables
--             Binding Variables
-- @params profile_data
--             Active Profile
-- @params pcm_db
--             Active Profile DB
-- @return
--        Return is the Item is white listed or not.
local function dcm_update(bind_variables, profile_data, pcm_db)
    llog.debug4("dcm", "dcm_update enter", "type = %s uuid=%s", "", tostring(profile_data), tostring(bind_variables.uuid))

    local changes = { }
    local sqls = { }

    local binder = make_binder()
    
    for k, v in pairs(bind_variables) do
        if column_specs[k] then

            local col_updates, extra
                = column_specs[k](bind_variables, binder, change_type_names.update)

            for col, val in pairs(col_updates) do
                -- If the original values was "null" bypass the binder
                if string.lower(tostring(v)) == "null" then
                    changes[#changes + 1] = col .. " = NULL"
                else
                    changes[#changes + 1] = col .. " = " .. val
                end
            end
            for _, v in ipairs(extra) do
                sqls[#sqls + 1] = v
            end
        end
    end

    sqls[#sqls + 1] = {
              sql = table.concat{
                        [[ UPDATE DeviceContentEntry SET ]],
                        table.concat(changes, ",\n"),
                        [[ WHERE p_uuid = ]],
                        binder:bind(bind_variables.uuid)
                    },
                    bind_vars = binder.bind_vars
          }

    for _, c in ipairs(sqls) do
        llog.debug4("dcm", "dcm_update", "exec_sql", "%s", c.sql)
        cc_db_util.exec_sql(db, c.sql, c.bind_vars)
    end

    llog.debug4("dcm", "dcm_update exit", "contentIndexedState = %s uuid=%s", "", tostring(bind_variables.contentIndexedState), tostring(bind_variables.uuid))
    return check_change_whitelisted(pcm_db, profile_data, bind_variables.uuid, nil, nil)
end

-- Check if the NON sql command need to be run on the active Kid DB
-- @params bind_variables
--             Binding Variables
-- @params pcm_db
--             Active Profile DB
-- @params type
--             type of non sql command
-- @return
--        Returns is the command whitelisted
local function is_non_sql_command_whitelisted(bind_variables, profile_data, pcm_db, type)
    llog.debug4("dcm", "dcm_check_command_whitelisted enter", "type = %s", "", tostring(type))
    local uuid, cdekey, cdetype = nil

    if type == "updateDeletedBackIssues" or type == "updateDeletedArchivedItem" then
        uuid = bind_variables.deletedUuid
    elseif type == "updateArchivedItem" then
        cdekey = bind_variables.cdekey or bind_variables.cdeKey
        cdetype = bind_variables.cdetype or bind_variables.cdeType
    elseif type == "updateBackIssues" then
        if tostring(profile_data) ~= default_user_value then
            return false
        else
            return true
        end
    elseif type == "updateHomeDictionaryCollection" then
        if tostring(profile_data) ~= default_user_value then
            return false
        else
            return true
        end
    end
    
    return check_change_whitelisted(pcm_db, profile_data, uuid, cdekey, cdetype)
end

-- Update the Index state of Device contents from DCM to active Profile DB.
local function updateContentIndexer()
    llog.debug4("dcm", "updateContentIndexer", "", "Updating Indexes")
    -- Attach DB fails if in middle of opened transaction
    dcm.commit()
    local attach_sqls = [[ATTACH DATABASE "]] .. cc_db_path .. [[" as CC]]
    cc_db_util.exec_sql(db, attach_sqls)
    
    local update_index_sqls = [[ UPDATE Entries 
                                     SET p_contentIndexedState = 
                                     ( Select p_contentIndexedState from DeviceContentEntry 
                                                  WHERE DeviceContentEntry.p_uuid = Entries.p_uuid )
                                     WHERE p_isVisibleInHome=1 AND p_isArchived=0]]
    cc_db_util.exec_sql(db, update_index_sqls)
    
    cc_db_util.exec_sql(db, [[DETACH DATABASE CC]])
    dcm.begin()
end

-- Possible SQL Change types
local change_types = {
    update = dcm_update,
    delete = dcm_delete,
    insert = dcm_insert,
    insertOr = dcm_insert_or
}

-- Possible SQL Change types
local non_sql_types = {
    updateDeletedBackIssues = is_non_sql_command_whitelisted,
    updateDeletedArchivedItem = is_non_sql_command_whitelisted,
    updateArchivedItem = is_non_sql_command_whitelisted,
    updateBackIssues = is_non_sql_command_whitelisted,
    updateHomeDictionaryCollection = is_non_sql_command_whitelisted
}

-- Constructs prepare statement on DCM DB
-- @param k
--         Type of transaction
-- @param bind_variables
--         Bind variables
-- @param profile_data
--         Active Profile
-- @param pcm_db
--         Active Profile CC db
-- @return is_whitelisted
--         True is this change is whitelisted for the active profile CC db
function dcm.change_entry(type, bind_variables, profile_data, pcm_db)
    local is_white_listed = true
    if change_types[type] then
        is_white_listed = change_types[type](bind_variables, profile_data, pcm_db)
    elseif non_sql_types[type] then
        if tostring(profile_data) ~= default_user_value then
            is_white_listed = non_sql_types[type](bind_variables, profile_data, pcm_db, type)
        end
    elseif type == "updateIndexer" then
        updateContentIndexer()
        return false
    else
        llog.error("dcm", "change_entry", "type = %s profile_data=%s","Undefined Type", tostring(type), tostring(profile_data))
    end
    return is_white_listed
end

-- Add index Command
-- @param command
--         Indexing function pointer
function dcm.add_index_command(command)
    index_work_list[#index_work_list + 1] = command
end

-- Execute Indexing Commands
function dcm.execute_index_commands()
    if index_work_list ~= nil then
        --Issue all content indexing commands
        for _, indexCommand in ipairs(index_work_list) do
            indexCommand()
        end
        --Empty the work list
        index_work_list = {}
    end
end

-- Constructs prepare statement on DCM DB
-- @param sql
--         Sql query.
-- @return stmt
function dcm.prepare_query(sql)
    llog.debug4("dcm", "prepare_query", "sql = %s", "", tostring(sql))
    return db:prepare(sql)
end
