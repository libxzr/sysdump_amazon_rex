-- Copyright (c) 2015 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.


local PREFERENCE_FILE_NAME = "/var/local/system/winmgr_preference.prop"
local propertyTable = {}

-- initialize property value from preference file
function initPreference()
   -- Init default values
   propertyTable["key"] = "Normal"

   local f = io.open(PREFERENCE_FILE_NAME, "r")
   if f ~= nil then
      for line in f:lines() do
         for key, value in string.gmatch(line, "(.-)=(.-)$") do 
             propertyTable[key] = value 
         end
      end
      f:close() 
   end
end

-- write the preference information to preference property file
local function writePreference()
    local f = io.open(PREFERENCE_FILE_NAME, "w")
    for key, value in pairs(propertyTable) do
        f:write("" .. key .. "=" .. value)
    end
    f:close() 
end

-- get the preference file
function getPropertyFromPreference(key)
    return propertyTable[key]
end

-- set the preference value
function setPropertyFromPreference(key, value)
   propertyTable[key] = value
   writePreference()
end 

-- Register prefrence properties
function preference_register_properties()
  initPreference()

  propertySetPreference = registerLipcStringProp("setPreference", "w")
  propertySetPreference.listener = function (name, propertyValue)
      local index = 1
      local params = {}
      for param in stringSplit(propertyValue, ":") do
          params[index] = param
          index = index + 1
      end
      local key = params[1]
      local value =  params[2]
      setPropertyFromPreference(key, value)
  end

 propertyKeyConfig = registerLipcStringProp("pageTurnkeyConfig", "rw")
 propertyKeyConfig.value = propertyTable["key"]
 propertyKeyConfig.listener = function (name, value)
       if value == "Normal" or value == "Inverted" then
           setPropertyFromPreference("key", value)
           propertyKeyConfig.value = value
       end
    end
end

