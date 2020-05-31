-- sql_functions.lua
--
-- Copyright (c) 2011-2013 Amazon Technologies, Inc.  All rights reserved.
--
-- PROPRIETARY/CONFIDENTIAL
--
-- Use is subject to license terms.


-- This file contains a list of SQLite user functions.
--
-- To install a new user function in SQLite simply add the function below and
-- update the install_user_db_functions function with:
--
-- assert(db:set_function("<YOUR_FUNCTION_NAME_IN_DB>", <NUM_ARGS>,
--                         <YOUR_FUNCTION_NAME>))
--
-- where YOUR_FUNCTION_NAME_IN_DB is the function name reference when used in
-- SQL statements, and YOUR_FUNCTION_NAME is the LUA function name defined in
-- this file, and NUM_ARGS is the number of arguments YOUR_FUNCTION_NAME takes.


require 'cc_db_util'
-- Installs user functions into the SQLite database.
--
-- @returns <code>true</code> if user database functions are successfully
--     installed.
function install_user_db_functions(db)
    assert(db:set_function("build_title_json", 5, build_title_json))
    assert(db:set_function("build_credit_json", 6, build_credit_json))
    assert(db:set_function("json_string", 1, json.encode))
    assert(db:set_function("get_language_from_titles", 1, get_language_from_titles))
    assert(db:set_function("is_journaling_enabled", 0, is_journaling_enabled))
    assert(db:set_function("build_metadate_unicode_word", 2, build_metadate_unicode_word))

    return true
end


-- Returns the JSON encoded title.
--
-- @param display The display of the title.
-- @param collation The collation of the title.
-- @param pronunciation The pronunciation of the title.
-- @param language The language of the title.
-- @param direction The text direction of the title.
-- @return The JSON encoded title, or nil if any parameter is not set.
function build_title_json(display, collation, pronunciation, language, direction)
    if display or collation or pronunciation or language or direction then
        return json.encode({
                               {
                                   display = display,
                                   nominal = display,
                                   collation = collation,
                                   pronunciation = pronunciation,
                                   language = language,
                                   direction = direction
                               }
                           })
    else
        return nil
    end
end


-- Returns the JSON encoded credit.
--
-- @param kind The kind of credit; i.e. Author, Narrator, etc.
-- @param display The display title of the credit.
-- @param collation The collation of the credit.
-- @param pronunciation The pronunciation of the credit.
-- @param language The language of the credit.
-- @param direction The text direction of the credit.
-- @return The JSON encoded credit, or nil if any parameter is not set.
function build_credit_json(kind, display, collation, pronunciation, language,
                                 direction)
    if kind or display or collation or pronunciation or language or direction then
       return json.encode({
                              {
                                  kind = kind,
                                  name = {
                                             display = display,
                                             nominal = display,
                                             collation = collation,
                                             pronunciation = pronunciation,
                                             language = language,
                                             direction = direction
                                         }
                              }
                          })
    else
        return nil
    end
end


-- Returns the JSON encoded p_titles_0_language from the list of JSON encoded
-- titles.
--
-- @param titles JSON encoded list of titles.
-- @return The language of the first title, or an empty string if the decoding fails.
function get_language_from_titles(titles)
    if titles then
        titleList = json.decode(titles)
        if titleList and #titleList > 0 then
            return json.encode(titleList[1].language)
        end
    end

    return json.encode("")
end


-- Returns whether collections journaling is enabled.
--
-- @return Whether collections journaling is enabled.
function is_journaling_enabled()
	return is_collections_journaling_enabled()
end

-- Builds Unicode for Metadata for the given titles and returns them.
-- @param titles
-- @param credits
function build_metadate_unicode_word(titles, credits)
    return get_unicode_normalized_metadata(titles,credits) 
end