#/bin/sh 
export CVM_PROP_NBPROFILER_HOME=/mnt/us
cd /usr/java
bin/cvm -cp lib/profiler/lib/jfluid-server.jar:lib/profiler/lib/jfluid-server-cvm.jar org.netbeans.lib.profiler.server.ProfilerCalibrator
