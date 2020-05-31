
-- metadata_index.lua

-- Copyright (c) 2012 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- This file contains code to handle changes to the metadataUnicodeWords column
-- in Entries.
-- It has code to insert the unicode normalized words for any given term to provide
-- substring matching.

require 'cc_db_util'
require 'llog'

local modname = ...
local metadata_index = {}
_G[modname] = metadata_index 

-- fucntion to update metadata suitable for substring search.
function metadata_index.change_metadataUnicodeNormalizedWords(obj , binder , change_type)

	if obj.metadataUnicodeWords == nil or string.len(obj.metadataUnicodeWords) == 0  then
		local j_titles  = obj.titles and json.encode(obj.titles)
		local j_credits = obj.credits and json.encode(obj.credits)

		if j_titles == nil then
			j_titles = ''
		end
		if j_credits == nil then
			j_credits = ''
	        end
		obj.metadataUnicodeWords =   get_unicode_normalized_metadata(j_titles, j_credits) 
	end

	return { p_metadataUnicodeWords = binder:bind(obj.metadataUnicodeWords) }, { }
end


