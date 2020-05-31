
// string map for default mode
var WLLegalStringTable = {

  WLFAQHeader : "Salva le password su Amazon",
  close       : "CHIUDI",
  WLFAQMessageFormat : new MessageFormat("<b> 1. Quali sono i vantaggi nel salvare le password Wi-Fi nel mio account Amazon? </b> </br> Quando salvi le password Wi-Fi nel tuo account Amazon, possiamo configurare i tuoi dispositivi compatibili in modo che tu non debba reinserire le tue password Wi-Fi su ogni dispositivo. </br> <b> 2. Le mie password Wi-Fi sono al sicuro? </b> </br> Si. Quando salvi le tue password Wi-Fi nel tuo account Amazon, queste vengono inviate tramite connessione sicura a un server Amazon e salvate sotto forma di file criptato. Amazon user\u00e0 le tue password Wi-Fi per connettere i tuoi dispositivi compatibili e non le condivider\u00e0 con nessuna terza parte senza il tuo permesso. Amazon tratta le informazioni ricevute, comprese le tue password Wi-Fi, in conformit\u00e0 all\u02bcInformativa sulla privacy Amazon ({privacyUrlString}). </br> <b> 3. Cosa devo fare se modifico le mie password Wi-Fi? </b> </br> Puoi salvare le password Wi-Fi aggiornate nel tuo account Amazon riavviando su un dispositivo compatibile il processo di configurazione del Wi-Fi. Quando sei connesso nuovamente alla rete Wi-Fi, la password Wi-Fi aggiornata verr\u00e0 salvata automaticamente nel tuo account Amazon. </br> <b>4. Le password Wi-Fi inserite in precedenza su questo dispositivo vengono salvate sul mio account Amazon se non era selezionata l\u02bcopzione Salva le password su Amazon?  </b> </br> No. Solo le password inserite dal momento in cui abiliti l\u02bcopzione Salva le password su Amazon verranno salvate. Se non selezioni tale opzione, le password Wi-Fi non verranno salvate sul tuo account Amazon. </br> <b> 5. Come posso cancellare le mie password Wi-Fi dal mio account Amazon? </b> </br> Puoi cancellare le password Wi-Fi salvate nel tuo account Amazon contattando il Servizio Clienti tramite il modulo Contattaci su {deviceSupporUrlString}. Puoi anche cancellare le password Wi-Fi salvate su questo dispositivo da Impostazioni."),
  WLPrivacyUrlMessageFormat : new MessageFormat("wifilocker.privacyurl.{MarketPlace}"),
  WLDeviceSupportMessageFormat : new MessageFormat("wifilocker.devicesupporturl.{MarketPlace}")
};

// string map for large mode
var WLLegalStringTableLarge = {

  close       : "Chiudi"
};

//checks for large mode and constructs WLLegalStringTable based on the display mode

WLLegalStringTable = constructTableOnDisplayModeChange(WLLegalStringTable,WLLegalStringTableLarge);
