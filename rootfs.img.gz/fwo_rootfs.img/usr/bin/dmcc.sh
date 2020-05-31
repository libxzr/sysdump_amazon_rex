#!/bin/sh
#
# Copyright (c) 2011-2018 Amazon.com, Inc. or its affiliates. All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.
#
# This script to gathers all possible information from the device to diagnose a problem
# including cc.db, documents listing and actual device info.
# It should only be used for development and should not remain on shipped devices,
# (unlike dm.sh which only collects the --sanitized-- system logs).

# verify we are on a pre GM device
if ! [ -e "/PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC" ]; then
    exit 0
fi


DDST=/mnt/us/documents
THMBDIR=/mnt/us/system/thumbnails/
MRCHIMGDIR=/mnt/us/system/.mrch/
ASINRECSDIR=/mnt/us/system/recommendation/
BTDEST_DIR=/mnt/us/documents/btlogs
BTLOG_DIR=/mnt/us/system/btlogs
PCAP_DIR=/mnt/us/pcap/
DTMP=dmcc.$$

if [ -n $1 ]; then
    BASENAME=$1
else
    BASENAME="all_logs_ccdb_find_"
fi

CORE_DUMP_FILE=$2

DATENAME=`date +%b_%d_%H.%M.%S_%Y`
ATGZFILE="${BASENAME}${DATENAME}.tgz"
LOGSFILE="${BASENAME}${DATENAME}.html"
PCAPFILE="Packet_Captures_${DATENAME}.tgz"
CCDBFILE=cc_${DATENAME}.db
DCMDBFILE=dcm_${DATENAME}.db
WISHLISTDBFILE=Wishlist_${DATENAME}.db
APPREGDBFILE=appreg_${DATENAME}.db
WSYNCDBFILE=wsync_${DATENAME}.db
KFTDBFILE=kft_${DATENAME}.db
FINDFILE=find-mnt-us.txt
CCDEFILE=ccdb-entries.txt
CCDUFILE=ccdb-entries-uudec.txt
DIFFFILE=diff-find-ccdb.txt
SYSGFILE=syslog.txt
NETGFILE=netlog.txt
WAPGFILE=wpa_supplicant_log.txt
BSAGFILE=bsa_server_log.txt
VERSFILE=version.txt
PARTFILE=df-info.txt
TOPBFILE=top-info.txt
PWRDFILE=powerd-info.txt
VLMDFILE=volumd-info.txt
BLCKFILE=blacklist.txt
THMBFILE=thumbnail-info.txt
MRCHIMGFILE=mrch-images-info.txt
ASINRECSFILE=asin-recs-info.txt
IDXRFILE=indexer_dashboard.txt
MRCHFILE=mrch_files.txt
GROKFILE=grok_files.txt
ACXFILE=acx-info.txt
MAKEDIFF=makediff.sh
WININFOFILE=wininfo.txt
ASRINFOFILE=asrinfo.txt
UPSTARTFILE=upstart.txt
APPCRASHLOGS=kdkapps-crashlogs.tgz
PRINTKLOGS=kernel-buffers.tgz
CCDBDIR=ccdb-profiles.tgz
HOUSEHOLDPROFILES=HouseholdProfiles.json
PROFILECATALOGDB=ProfileCatalog.db
KFTPREFERENCEFILE=KftPreferences.txt
LIPCDUMP=lipcPropertyValues.txt
BTFRAMEWORKDUMP=bt-framework-info.txt
TZDBFILE=timezone_db_file.txt
FILENAME_BSA_LOG="/var/log/bsa_server_log"
BTLOGNAME=bsalogs.tgz
BTSNOOPLOGNAME=btsnooplogs.tgz
HSERRFILETAR=hs_err.tgz
DEBUGINFORMATIONFILE=extra_debug_info.txt

ccdb_summary()
{
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries;"` $'\t'"Total number of Items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_isArchived=1;"` $'\t'"Archived items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_isDownloading=1;"` $'\t'"Downloading items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_type = 'Entry:Item';"` $'\t'"Content items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_type = 'Entry:Item:Dictionary';"` $'\t'"Dictionaries" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_type = 'Entry:Item:Notice';"` $'\t'"Notices" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_type = 'Entry:Item:Audible';"` $'\t'"Audible items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_type = 'Entry:Item:Audio';"` $'\t'"Audio items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_type not in ('Entry:Item', 'Entry:Item:Dictionary', 'Entry:Item:Notice', 'Entry:Item:Audible', 'Entry:Item:Audio');"` $'\t'"Miscellaneous items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_type = 'Collection';"` $'\t'"Collections" >> $1
}

indexer_summary()
{
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_isArchived=1 and p_metadataIndexedState = 1;"` $'\t'"Indexed archived items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_contentIndexedState = 1;"` $'\t'"Indexed content items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_contentIndexedState = 2147483647;"` $'\t'"Unindexable content items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_contentIndexedState <= 0;"` $'\t'"Unindexed content items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_metadataIndexedState = 1;"` $'\t'"Indexed metadata of content items" >> $1
    echo `sqlite3 /var/local/cc.db "select count(*) from Entries where p_location is not null and p_metadataIndexedState <= 0;"` $'\t'"Unindexed metadata of content items" >> $1

}

indexer_todo()
{
    echo "---- Content items not yet indexed: ----" >> $1
    sqlite3 /var/local/cc.db "select p_titles_0_nominal from Entries where p_location is not null and p_contentIndexedState <= 0;" >> $1
    echo >> $1

    echo "---- Content items metadata not yet indexed: ----" >> $1
    sqlite3 /var/local/cc.db "select p_titles_0_nominal from Entries where p_location is not null and p_metadataIndexedState <= 0;" >> $1

    echo >> $1

    echo "---- Archived items metadata not yet indexed: ----" >> $1
    sqlite3 /var/local/cc.db "select p_titles_0_nominal from Entries where p_isArchived = 1 and p_metadataIndexedState <= 0;" >> $1
}

logger -s "I dmcc:TRY:Creating logs and checks on ${DATENAME}"



#collect any existing packet captures into tar-ball
cd "${PCAP_DIR}" && tar zcf "${DDST}/${PCAPFILE}" * && rm -r "${PCAP_DIR}"

# build in /tmp
WORKING_DIR="/tmp/"
mkdir -p ${WORKING_DIR}${DTMP}
cd ${WORKING_DIR}${DTMP}
###################################### START LOG COLLECTION ######################################

top -b -H -n 1 > ${TOPBFILE}

# Include a cvm-dumpstack at the end of the syslog
lipc-set-prop com.lab126.kaf callInspector dumpAllThreads
if [ $? -ne 0 ]
then
    #The LIPC route has failed for some reason. Send SIGQUIT to dump threads
    logger -s "W dmcc:LIPC to dump CVM threads failed. Sending SIGQUIT to dump threads"
    killall -QUIT cvm >/dev/null 2>/dev/null
fi

## Create the Indexer_Dump*.txt files; this may take a few seconds, but lipc-set-prop will return quickly.
lipc-set-prop com.lab126.indexer dumpIndexerState 1

## Create the HomeDigest*.txt files; this may take a few seconds, but lipc-set-prop will return quickly.
lipc-set-prop com.lab126.booklet.home digest 1

## Write cached (in-memory) GRoK resources to grok.db
lipc-set-prop com.lab126.grokservice flushCache 1

##dump tmd queue
lipc-hash-prop -n com.lab126.transfer dump_queues

## find all .tpz. azw? .azw .prc .mobi .mobi? .pobi .pobi? .txt .pdf .mp3 .kac .aax .aa .kcrt .acx .dcap
find /mnt/us/documents /mnt/us/audible /mnt/us/music /mnt/us/system/acw/ -type f \( -iname "*.tpz" -o -iname "*.azw?" -o -iname "*.azw" -o -iname "*.prc" -o -iname "*.mobi" -o -iname "*.mobi?" -o -iname "*.pobi" -o -iname "*.pobi?" -o -iname "*.txt" -o -iname "*.pdf" -o -iname "*.mp3" -o -iname "*.kac" -o -iname "*.aax" -o -iname "*.aa" -o -iname "*.kcrt" -o -iname "*.acx" -o -iname "*.dcap" \) | sort > ${FINDFILE}
sqlite3 /var/local/cc.db "select p_isVisibleInHome, p_isLatestItem, p_location from Entries;" | sed -e '/^.|.|$/d' -e 's|file://||' > ${CCDEFILE}
sqlite3 /var/local/cc.db 'select p_location from Entries where (p_diskUsage = 0 and p_thumbnail = "0")' > ${BLCKFILE}

## Add any extraction in progress, which may be due to a hung scanner/extractor.
if [ -f /var/tmp/scanner.blacklist ]; then
    echo -n "In progress: " >> ${BLCKFILE}
    cat /var/tmp/scanner.blacklist >> ${BLCKFILE}
fi
BLCK_CNT=`cat ${BLCKFILE} | wc -l`
if [ $BLCK_CNT -eq 0 ]; then
    rm ${BLCKFILE}
fi

## Add a summary of tumbnail files
ls -lR ${THMBDIR} > ${THMBFILE}

## List all images download for merchnat campaigns
ls -lR ${MRCHIMGDIR} > ${MRCHIMGFILE}

## List all recommendations downloaded for asin based and author based
ls -lR ${ASINRECSDIR} > ${ASINRECSFILE}

# For URI-encoded locations, use this:
##echo "sed -e's/%\([0-9A-F][0-9A-F]\)/\\\\\x\1/g' -e's/^.|.|//' ${CCDEFILE} | xargs -n1 echo -e | sort > ${CCDUFILE}" > ${MAKEDIFF}
# For non-URI-encoded locations, use this:
echo "sed -e's/^.|.|//' ${CCDEFILE} | sort > ${CCDUFILE}" > ${MAKEDIFF}
source ./${MAKEDIFF}
# diff may not be in the device, but now that the sed has run, we can safely add this as a hint to run later on the host:
echo "diff -U0 ${CCDUFILE} ${FINDFILE}" >> ${MAKEDIFF}

echo "<HTML><HEAD><TITLE>Summary of logs/ccdb on ${LOGSFILE}</TITLE></HEAD><BODY><H3>Summary of logs/ccdb</H3>" >> ${LOGSFILE}
echo "<B>This is just a summary, so please attach to any bugs: ${ATGZFILE}</B><BR>" >> ${LOGSFILE}
echo '<PRE>' >> ${LOGSFILE}
cat /etc/version.txt >> ${LOGSFILE}
echo '</PRE>' >> ${LOGSFILE}

# Create a TOC
echo '<HR>' >> ${LOGSFILE}
if [ $BLCK_CNT -gt 0 ]; then
    echo -n '<A HREF="#black">Black</A> | ' >> ${LOGSFILE}
fi
# if diff is available, run it to generate a better summary on device. If not, makediff.sh can still be run on the host.
if [ -x /usr/bin/diff ]; then
    /usr/bin/diff -U0 ${CCDUFILE} ${FINDFILE} > $DIFFFILE
    DIFFSTAT=$?
    echo -n '<A HREF="#diff">diffs</A> | ' >> ${LOGSFILE}
else
    echo "# Sorry, no diff on device; on host, try execure ${MAKEDIFF}" > $DIFFFILE
fi
echo '<A HREF="#entries">CC</A> | <A HREF="#index">Idxr</A> | <A HREF="#ccdb">cc.db</A> | <A HREF="#find">find</A> | <A HREF="#logs">SysLog</A> | <A HREF="#apps">AppLog</A>' >> ${LOGSFILE}
echo '<HR>' >> ${LOGSFILE}

if [ $BLCK_CNT -gt 0 ]; then
    echo '<H3 id="black">Black-listed content</H3>' >> ${LOGSFILE}
    echo '<PRE>' >> ${LOGSFILE}
    cat $BLCKFILE >> ${LOGSFILE}
    echo '</PRE>' >> ${LOGSFILE}
fi

# Dump diff
if [ -x /usr/bin/diff ]; then
    echo '<H3 id="diff">diff cc.db /mnt/us</H3>' >> ${LOGSFILE}
    if [ $DIFFSTAT -eq 0 ]; then
        echo '<I>100% match between cc.db and storage</I>' >> ${LOGSFILE}
    else
        echo '<I>Mismatches between cc.db entries and storage:</I><BR>' >> ${LOGSFILE}
        echo '<PRE>' >> ${LOGSFILE}
        cat $DIFFFILE >> ${LOGSFILE}
        echo '</PRE>' >> ${LOGSFILE}
    fi
fi


# call out coredump file
if [ -n $CORE_DUMP_FILE ]; then
    echo '<H3 id="coredump">Coredump</H3>'  >> ${LOGSFILE}
    echo "<P>${CORE_DUMP_FILE}</P>" >> ${LOGSFILE}
fi

echo '<H3 id="entries">CC entries summary</H3>' >> ${LOGSFILE}
touch tmp_$IDXRFILE
ccdb_summary tmp_$IDXRFILE
echo '<ul>' >> ${LOGSFILE}
echo >> ${LOGSFILE}
sed 's/^/<li> /' tmp_${IDXRFILE} >> ${LOGSFILE}
echo '</ul>' >> ${LOGSFILE}

echo '---- CC entries summary: ----'> $IDXRFILE
cat tmp_${IDXRFILE} >> $IDXRFILE
echo >> $IDXRFILE
rm -f tmp_${IDXRFILE}

# Dump the Indexer status
echo '<H3 id="index">Indexer status</H3>' >> ${LOGSFILE}
touch tmp_$IDXRFILE
indexer_summary tmp_$IDXRFILE
echo '<ul>' >> ${LOGSFILE}
echo >> ${LOGSFILE}
sed 's/^/<li> /' tmp_${IDXRFILE} >> ${LOGSFILE}
echo '</ul>' >> ${LOGSFILE}

# Append the (possibly much) more verbose non-indexed item list to the IDXRFILE
echo '---- Indexer status: ----' >> $IDXRFILE
cat tmp_${IDXRFILE} >> $IDXRFILE
rm -f tmp_${IDXRFILE}
echo >> $IDXRFILE
indexer_todo $IDXRFILE

# Dump cc.db entries
echo '<H3 id="ccdb">cc.db entries</H3>' >> ${LOGSFILE}
read lines words chars <<EOF
$(wc < ${CCDEFILE})
EOF
echo "Number of entries: $lines <BR>" >> ${LOGSFILE}

echo "<B>Format: isVisible|isLatest|location</B><BR>" >> ${LOGSFILE}
echo '<ul>' >> ${LOGSFILE}
echo >> ${LOGSFILE}
sed 's/^/<li> /' ${CCDEFILE} >> ${LOGSFILE}
echo '</ul>' >> ${LOGSFILE}

# List all files in documents, audible and music
echo '<H3 id="find">find /mnt/us</H3>' >> ${LOGSFILE}
read lines words chars <<EOF
$(wc < ${FINDFILE})
EOF
echo "Number of files: $lines <BR>" >> ${LOGSFILE}
echo "<B>Find ext: tpz azw* prc mobi* pobi* txt pdf mp3 kac aax aa</B><BR>" >> ${LOGSFILE}
echo '<ul>' >> ${LOGSFILE}
echo >> ${LOGSFILE}
sed 's/^/<li> /' ${FINDFILE} >> ${LOGSFILE}
echo '</ul>' >> ${LOGSFILE}

# Dump syslog
echo '<H3 id="logs">System logs, last 500 lines</H3>' >> ${LOGSFILE}
echo "<B> Note: attach ${ATGZFILE} with full log to bugs!</B><BR>" >> ${LOGSFILE}
echo '<PRE>' >> ${LOGSFILE}
echo >> ${LOGSFILE}
tail -500 /var/log/messages >> ${LOGSFILE}
echo '</PRE>' >> ${LOGSFILE}

echo '<H3 id="apps">KDK app crash logs</H3>' >> ${LOGSFILE}
NITEMS=`find /mnt/us/developer/ -name crash.log | wc -l`
if [ $NITEMS -eq 0 ]; then
    echo "<H4>Found no developer crash logs</H4>" >> ${LOGSFILE}
else
    OLDIFS=$IFS
    IFS=$'\n'
    find /mnt/us/developer -name crash.log | while read file ; do
        echo "<H4>$file</H4>" >> ${LOGSFILE}
        echo '<PRE>' >> ${LOGSFILE}
        cat $file >> ${LOGSFILE}
        echo '</PRE>' >> ${LOGSFILE}
    done
    IFS=$OLDIFS
fi
NITEMS=`find /mnt/us/.active-content-data/ -name crash.log | wc -l`
if [ $NITEMS -eq 0 ]; then
    echo "<H4>Found no active-content-data crash logs</H4>" >> ${LOGSFILE}
else
    OLDIFS=$IFS
    IFS=$'\n'
    find /mnt/us/.active-content-data -name crash.log | while read file ; do
        echo "<H4>$file</H4>" >> ${LOGSFILE}
        echo '<PRE>' >> ${LOGSFILE}
        cat $file >> ${LOGSFILE}
        echo '</PRE>' >> ${LOGSFILE}
    done
    IFS=$OLDIFS
fi

#### Closing up the LOGSFILE ###
echo '</BODY></HTML>' >> ${LOGSFILE}

# if there are no crash.log files, this will be an empty tar-ball.
tar zcf ${APPCRASHLOGS} /mnt/us/developer/*/work/crash.log /mnt/us/.active-content-data/*/work/crash.log

#if there are hs_err files in /var/tmp , copying it into dmcc.If there are no hs_err files, this will be an empty tar ball.
tar zcf ${HSERRFILETAR} /var/tmp/hs_err*.log

#This function is a utility function which takes in the command and file as argument, writes the output of the command to the file.
add_debug_info () {
echo "********************************************************  $1  ********************************************************" >> $2
$1 >> $2 2>&1
echo -e "\n" >> $2
}

#This function is a utility function which takes in the command and file as argument, executes the command,
#iterates over all the files names and prints those file contents.
iterate_files () {
for file in `$1`
do
    add_debug_info "cat $file" $2
done

}
#The following are the commands usefull for debugging

#The list of all milestones the device had reached from bootup is in the /tmp/milestones file.
add_debug_info "cat /tmp/milestones" $DEBUGINFORMATIONFILE

#To know the ffs status
add_debug_info "cat /var/local/system/ffs_status.conf" $DEBUGINFORMATIONFILE

#This is to list the keys partition
add_debug_info "ls -lrt /keys" $DEBUGINFORMATIONFILE

#The list of the device logs
add_debug_info "ls -l /var/local/log" $DEBUGINFORMATIONFILE

#To display all currently attached file systems
add_debug_info "mount" $DEBUGINFORMATIONFILE

#We list the var/local files in order to know what files are touched if any, during an issue.
add_debug_info "ls -alh /var/local/" $DEBUGINFORMATIONFILE

#To know the disk usage in var/local upto 2 directory levels.
add_debug_info "du -d 2 -h /var/local/" $DEBUGINFORMATIONFILE

#We take the below information to know the exact memory and cpu usage by each process at that time
add_debug_info "ps -aux" $DEBUGINFORMATIONFILE

echo -e "Files inside /var/run/upstart/ \n" >> $DEBUGINFORMATIONFILE
iterate_files "find /var/run/upstart/ -maxdepth 1 -type f" $DEBUGINFORMATIONFILE

#/var/local/upstart folder gets created only when there is an abnormal device reboot.
if [ -d "/var/local/upstart/" ]; then
    echo -e "Files inside /var/local/upstart/ \n" >> $DEBUGINFORMATIONFILE
    iterate_files "find /var/local/upstart/ -maxdepth 1 -type f" $DEBUGINFORMATIONFILE
fi


# gather printk log files if they exist on disk
if [[ -e /var/local/printklogs ]]; then
    tar zcf ${PRINTKLOGS} /var/local/printklogs
fi

# Copy some additional info and give the indexer some time to complete
sleep 5

## If we see two "In progress" on the same item, there is a good chance the item is stuck!
if [ -f /var/tmp/scanner.blacklist ]; then
    echo -n "In progress: " >> ${BLCKFILE}
    cat /var/tmp/scanner.blacklist >> ${BLCKFILE}
fi

logger -s "I dmcc:OK:Created ${DDST}/${LOGSFILE%.*}.txt and making ${DDST}/${ATGZFILE}"
sleep 1
showlog > ${SYSGFILE}
showlog -n > $NETGFILE
showlog -w > $WAPGFILE
# Dump bsa_server logs if bluetooth is supported.
if [ 1 -eq $(devcap-get-feature -a bluetooth) ]
then
    if [ -e "$FILENAME_BSA_LOG" ];then
        echo "creating logdump for bsa_server"
        showlog -z > $BSAGFILE
    else
        echo "Bluetooth file doesn't exist"
    fi

    #gather bsalogs if they are present in /var/local/log
    if [ -e /mnt/us/bsa_log ];then
        echo "copying log for bsa_log "
        mkdir -p /mnt/us/documents/btlogs
       cd "/mnt/us" && tar zcf "${BTDEST_DIR}/bsa_log_current.tgz" bsa_log
    fi

    if [ 0 -lt $(ls /var/local/log/bsa_log* 2>/dev/null | wc -w) ]; then
        echo "copying /var/local/log/bsa_log*"
        mkdir -p /mnt/us/documents/btlogs
       cd "/var/local/log" && tar zcf "${BTDEST_DIR}/${BTLOGNAME}" bsa_log*
    fi

    if [ -e /mnt/us/bt_snoop_log ];then
        echo "copying log for bt_snoop_log"
        mkdir -p /mnt/us/documents/btlogs
       cd "/mnt/us" && tar zcf "${BTDEST_DIR}/bt_snoop_log_current.tgz" bt_snoop_log
    fi

    if [ 0 -lt $(ls /mnt/us/system/btlogs/bt_snoop_log* 2>/dev/null | wc -w) ]; then
        echo "copying /mnt/us/system/btlogs/bt_snoop_log*"
        mkdir -p /mnt/us/documents/btlogs
       cd "${BTLOG_DIR}" && tar zcf "${BTDEST_DIR}/${BTSNOOPLOGNAME}" bt_snoop_log*
    fi
    cd ${WORKING_DIR}${DTMP}
fi
xwininfo -root -tree > $WININFOFILE
echo "---- lsusb ----" > ${ASRINFOFILE}
lsusb >> ${ASRINFOFILE}
echo "---- aplay -l ----">> ${ASRINFOFILE}
aplay -l >> ${ASRINFOFILE}
# TODO: This may pick up older indexer files and the latest one may be incomplete!
cp /mnt/us/Indexer_Dump*.txt .
cp /mnt/us/HomeDigest*.txt .

echo "---- /etc/version ----" > ${VERSFILE}
cat /etc/version.txt >> ${VERSFILE}
echo >> ${VERSFILE}
echo "------- idme -s -------" >> ${VERSFILE}
idme -s >> ${VERSFILE}

# gather cc db files if they exist on disk
if [[ -e /var/local/cc ]]; then
    tar zcf ${CCDBDIR} /var/local/cc/*
fi

cp /var/local/cc.db ${CCDBFILE}
cp /var/local/dcm.db ${DCMDBFILE}
cp /var/local/WishList.db ${WISHLISTDBFILE}
cp /var/local/appreg.db ${APPREGDBFILE}
cp /var/local/wsync.db ${WSYNCDBFILE}
df > ${PARTFILE}

touch ${HOUSEHOLDPROFILES}
if [ -f /var/local/java/prefs/household.json ]; then
   echo "---- /var/local/java/prefs/household.json ----"  >> ${HOUSEHOLDPROFILES}
   cat /var/local/java/prefs/household.json >> ${HOUSEHOLDPROFILES}
   echo "" >> ${HOUSEHOLDPROFILES}
fi
touch ${KFTPREFERENCEFILE}
if [ -f /var/local/java/prefs/freetime.preferences ]; then
   echo "---- /var/local/java/prefs/freetime.preferences ----"  >> ${KFTPREFERENCEFILE}
   cat /var/local/java/prefs/freetime.preferences >> ${KFTPREFERENCEFILE}
   echo "" >> ${KFTPREFERENCEFILE}
fi
cp /mnt/us/system/freetime/freetime.db ${KFTDBFILE}
cp /var/local/ProfileCatalog.db ${PROFILECATALOGDB}
touch ${MRCHFILE}
if [ -f /var/local/merchant/server_response ]; then
   ls -larth /var/local/merchant/server_response >> ${MRCHFILE}
   cat /var/local/merchant/server_response >> ${MRCHFILE}
   echo "" >> ${MRCHFILE}
fi
if [ -f /var/local/merchant/num_bytes_downloaded ]; then
  echo "---- /var/local/merchant/num_bytes_downloaded ----" >> ${MRCHFILE}
  cat /var/local/merchant/num_bytes_downloaded >> ${MRCHFILE}
  echo "" >> ${MRCHFILE}
fi
if [ -f /var/local/merchant/update_time ]; then
  echo "---- /var/local/merchant/update_time ----" >> ${MRCHFILE}
  cat /var/local/merchant/update_time  >> ${MRCHFILE}
  echo "" >> ${MRCHFILE}
fi
if [ -f /var/local/java/prefs/cookies/auth.cookies ]; then
 echo "---- /var/local/java/prefs/cookies/auth.cookies ----" >> ${MRCHFILE}
 cat /var/local/java/prefs/cookies/auth.cookies  >> ${MRCHFILE}
 echo "" >> ${MRCHFILE}
fi

touch ${GROKFILE}
if [ -f /var/local/java/prefs/reginfo ]; then
   echo "---- /var/local/java/prefs/reginfo  ----" >> ${GROKFILE}
   cat /var/local/java/prefs/reginfo   >> ${GROKFILE}
   echo "" >> ${GROKFILE}
fi
if [ -d /mnt/us/system/grok_thumbnails/ ]; then
   echo "---- /mnt/us/system/grok_thumbnails/  ----" >> ${GROKFILE}
   ls -al /mnt/us/system/grok_thumbnails/   >> ${GROKFILE}
   echo "" >> ${GROKFILE}
fi
cp /var/local/grok.db .

cp /mnt/us/audible/hushpuppy.db .
cp /mnt/us/audible/audiblemetadata.db .
cp /mnt/us/audible/audible.db .

touch ${LIPCDUMP}
echo '---- Dumping Lipc properties for all targets ----' >> ${LIPCDUMP}
lipc-probe -v -a >> ${LIPCDUMP}

touch ${BTFRAMEWORKDUMP}
echo '** Dumping BT Framework Info **' >> ${BTFRAMEWORKDUMP}
cat /var/local/system/bt_source_state.conf >> ${BTFRAMEWORKDUMP}
if [ -f /var/local/VOICE_VIEW_STARTED ]; then
    echo "VOICE_VIEW_STARTED present" >> ${BTFRAMEWORKDUMP}
fi
if [ -f /var/local/ASR_ON ]; then
    echo "ASR_ON present" >> ${BTFRAMEWORKDUMP}
fi
if [ -f /var/local/NO_DEVICE_IN_RANGE_ALERT_SHOWN ]; then
    echo "NO_DEVICE_IN_RANGE_ALERT_SHOWN present" >> ${BTFRAMEWORKDUMP}
fi
if [ -f /var/local/IN_ASR_MODE ]; then
    echo "IN_ASR_MODE present" >> ${BTFRAMEWORKDUMP}
fi


touch ${ACXFILE}
echo '---- ACX directory ----' >> ${ACXFILE}
ls -ltr /mnt/us/system/acw/ >> ${ACXFILE}
echo '---- ACX registry entries ----' >> ${ACXFILE}
if [ -x /usr/local/bin/AppRegistryAcxs ]; then
    /usr/local/bin/AppRegistryAcxs -i >> ${ACXFILE}
else
    echo 'ACX registry dump tool not available, or not executable' >> ${ACXFILE}
fi

initctl list > ${UPSTARTFILE}

echo -n "Userstore total: " > ${VLMDFILE}
lipc-get-prop com.lab126.volumd userstoreTotalSpace >> ${VLMDFILE}
echo -n "Userstore free: " >> ${VLMDFILE}
lipc-get-prop com.lab126.volumd userstoreFreeSpace >> ${VLMDFILE}
echo -n "USB networking: " >> ${VLMDFILE}
lipc-get-prop com.lab126.volumd useUsbForNetwork >> ${VLMDFILE}
echo -n "USB drive mode: " >> ${VLMDFILE}
lipc-get-prop com.lab126.volumd driveModeState >> ${VLMDFILE}

lipc-get-prop com.lab126.powerd status > ${PWRDFILE}
echo -n "Battery temperature: " >> ${PWRDFILE}
cat `kdb get system/driver/charger/SYS_BATT_TEMP` >> ${PWRDFILE}

# Store timezone DB contents.
if [ 0 -eq $(devcap-get-feature -a wan) ]
then
    sqlite3 /var/local/system/TimeZoneCacheManager.db "select *from timezonecache" > ${TZDBFILE}
fi

top -b -H -n 1 >> ${TOPBFILE}
#cp `which $0` ./dmcc.sh


# Leaving /tmp/${DTMP}: make tar-ball, not tar-bomb
cd ..
tar zcf ${DDST}/${ATGZFILE} ${DTMP} "${BTDEST_DIR}/bsa_log_current.tgz" "${BTDEST_DIR}/${BTLOGNAME}" "${BTDEST_DIR}/bt_snoop_log_current.tgz" "${BTDEST_DIR}/${BTSNOOPLOGNAME}"

# And put a copy of the summary as text file under DDST (documents)
mv ${DTMP}/${LOGSFILE} ${DDST}/${LOGSFILE%.*}.txt

rm -rf ${DTMP}

tar ztvf ${DDST}/${ATGZFILE}

exit 0
