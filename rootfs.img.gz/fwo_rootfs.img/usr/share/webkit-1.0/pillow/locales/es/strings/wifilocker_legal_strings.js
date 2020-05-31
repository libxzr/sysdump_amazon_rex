
// string map for default mode
var WLLegalStringTable = {

  WLFAQHeader : "Guardando contrase\u00f1as en Amazon",
  close       : "CERRAR",
  WLFAQMessageFormat : new MessageFormat("<b> 1. \u00bfCu\u00e1les son las ventajas de guardar mis contrase\u00f1as wifi en mi cuenta de Amazon? </b> </br> Una vez guardes las contrase\u00f1as wifi en tu cuenta de Amazon, podremos configurar tus dispositivos compatibles para que no tengas que introducir las claves wifi en cada dispositivo. </br> <b> 2. \u00bfLas contrase\u00f1as se almacenan de forma segura? </b> </br> S\u00ed. Una vez almacenadas en tu cuenta de Amazon, las contrase\u00f1as wifi se env\u00edan a trav\u00e9s de una red segura y se almacenan en un archivo cifrado en un servidor de Amazon. Amazon puede utilizar las contrase\u00f1as wifi para conectar tus dispositivos compatibles y no las compartir\u00e1 con terceros sin tu permiso. Amazon gestiona todos los datos que recibe, contrase\u00f1as wifi inclusive, seg\u00fan el acuerdo de privacidad de Amazon ({privacyUrlString}). </br> <b> 3. \u00bfQu\u00e9 debo hacer si cambio mis contrase\u00f1as wifi? </b> </br> Puedes almacenar las contrase\u00f1as wifi actualizadas en tu cuenta de Amazon repitiendo el proceso de configuraci\u00f3n wifi en los dispositivos. Una vez conectados nuevamente a la red wifi, la nueva contrase\u00f1a se almacenar\u00e1 de forma autom\u00e1tica en tu cuenta de Amazon. </br> <b> 4. \u00bfLas contrase\u00f1as anteriores que introduje en el dispositivo se almacenaron en mi cuenta de Amazon si la opci\u00f3n Guardar contrase\u00f1as en Amazon no estaba seleccionada? </b> </br> No. Solo se almacenar\u00e1n las contrase\u00f1as que introduzcas en el futuro siempre que la opci\u00f3n Guardar contrase\u00f1as en Amazon est\u00e9 seleccionada. En caso contrario, las contrase\u00f1as wifi no se almacenar\u00e1n en tu cuenta de Amazon. </br> <b> 5. \u00bfC\u00f3mo borro las contrase\u00f1as wifi de mi cuenta de Amazon? </b> </br> Puedes borrar las contrase\u00f1as wifi almacenadas en tu cuenta de Amazon contactando con Atenci\u00f3n al cliente a trav\u00e9s del formulario de Contacto en {deviceSupporUrlString}. Tambi\u00e9n puedes eliminar las contrase\u00f1as wifi guardas desde este dispositivo en Configuraci\u00f3n."),
  WLPrivacyUrlMessageFormat : new MessageFormat("wifilocker.privacyurl.{MarketPlace}"),
  WLDeviceSupportMessageFormat : new MessageFormat("wifilocker.devicesupporturl.{MarketPlace}")
};

// string map for large mode
var WLLegalStringTableLarge = {

  close       : "Cerrar"
};

//checks for large mode and constructs WLLegalStringTable based on the display mode

WLLegalStringTable = constructTableOnDisplayModeChange(WLLegalStringTable,WLLegalStringTableLarge);
