-- post_processor.lua

-- Copyright (c) 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- This file contains code to handle archive post processing
require 'cc_db_util'
require 'series'

local make_binder = cc_db_util.make_binder

local modname = ...
local post_processor = {}
_G[modname] = post_processor

-- Trigger post processing
function post_processor.trigger(db)
    llog.info("post_processor.trigger", "enter", "", "")
    series.triggerPostProcessing(db)
    llog.info("post_processor.trigger", "exit", "", "")
end
