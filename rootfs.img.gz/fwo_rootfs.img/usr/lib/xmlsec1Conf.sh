#
# Configuration file for using the XML library in GNOME applications
#
prefix="/usr"
exec_prefix="${prefix}"
libdir="${exec_prefix}/lib"
includedir="${prefix}/include"

XMLSEC_LIBDIR="${exec_prefix}/lib"
XMLSEC_INCLUDEDIR=" -D__XMLSEC_FUNCTION__=__FUNCTION__ -DXMLSEC_NO_XSLT=1 -DXMLSEC_NO_MD5=1 -DXMLSEC_NO_RIPEMD160=1 -DXMLSEC_NO_HMAC=1 -DXMLSEC_NO_GOST=1 -DXMLSEC_NO_XMLENC=1 -DXMLSEC_NO_XKMS=1 -DXMLSEC_DL_LIBLTDL=1, -I${prefix}/include/xmlsec1   -I/home/builder/yocto/source/build/tmp/sysroots/rex/usr/include/libxml2    -DXMLSEC_OPENSSL_098=1 -DXMLSEC_CRYPTO_OPENSSL=1 -DXMLSEC_CRYPTO=\\\"openssl\\\""
XMLSEC_LIBS="-L${exec_prefix}/lib -lxmlsec1-openssl -lxmlsec1 -lltdl  -lxml2   -lssl -lcrypto "
MODULE_VERSION="xmlsec-1.2.16-openssl"

