
// string map for default mode
var WLLegalStringTable = {

  WLFAQHeader : "Passw\u00f6rter auf Amazon speichern",
  close       : "SCHLIESSEN",
  WLFAQMessageFormat : new MessageFormat("<b> 1. Welchen Vorteil hat das Speichern meiner WLAN-Passw\u00f6rter in meinem Amazon-Konto? </b> </br> Sobald Sie Ihre WLAN-Passw\u00f6rter in Ihrem Amazon-Konto speichern, k\u00f6nnen wir Ihre kompatiblen Ger\u00e4te konfigurieren, sodass Sie Ihre WLAN-Passw\u00f6rter nicht auf jedem Ger\u00e4t einzeln eingeben m\u00fcssen. </br> <b> 2. Sind meine WLAN-Passw\u00f6rter sicher? </b> </br> Ja. Sobald sie in Ihrem Amazon-Konto gespeichert sind, werden Ihre WLAN-Passw\u00f6rter \u00fcber eine sichere Verbindung versendet und in einer verschl\u00fcsselten Datei auf einem Amazon-Server gespeichert. Amazon kann Ihre WLAN-Passw\u00f6rter verwenden, um Ihre kompatiblen Ger\u00e4te zu verbinden, und leitet sie ohne Ihre Zustimmung nicht an Dritte weiter. Amazon behandelt alle erhaltenen Informationen, einschlie\u00dflich Ihrer WLAN-Passw\u00f6rter, gem\u00e4\u00df den Amazon-Datenschutzbestimmungen ({privacyUrlString}). </br> <b> 3. Was muss ich tun, wenn ich meine WLAN-Passw\u00f6rter \u00e4ndere? </b> </br> Sie k\u00f6nnen Ihre aktualisierten WLAN-Passw\u00f6rter in Ihrem Amazon-Konto speichern, indem Sie auf einem beliebigen kompatiblen Ger\u00e4t WLAN erneut einrichten. Sobald Sie erneut mit Ihrem WLAN-Netzwerk verbunden sind, wird Ihr aktualisiertes WLAN-Passwort automatisch in Ihrem Amazon-Konto gespeichert. </br> <b> 4. Werden die zuvor auf diesem Ger\u00e4t gespeicherten Passw\u00f6rter in meinem Amazon-Konto gespeichert, wenn ich die Option \u201ePasswort auf Amazon speichern\u201c nicht ausgew\u00e4hlt habe? </b> </br> Nein, das werden sie nicht. Nur Passw\u00f6rter, die Sie zuk\u00fcnftig eingeben, werden gespeichert, so lange \u201ePasswort auf Amazon speichern\u201c ausgew\u00e4hlt ist. Wenn die Option abgew\u00e4hlt ist, werden wir Ihre WLAN-Passw\u00f6rter nicht in Ihrem Amazon-Konto speichern. </br> <b> 5. Wie l\u00f6sche ich meine WLAN-Passw\u00f6rter von meinem Amazon-Konto? </b> </br> Sie k\u00f6nnen die auf Ihrem Amazon-Konto gespeicherten WLAN-Passw\u00f6rter l\u00f6schen, indem Sie den Kundenservice \u00fcber das Kontaktformular auf {deviceSupporUrlString} kontaktieren. Sie k\u00f6nnen die von diesem Ger\u00e4t gespeicherten WLAN-Passw\u00f6rter auch in den Einstellungen l\u00f6schen."),
  WLPrivacyUrlMessageFormat : new MessageFormat("wifilocker.privacyurl.{MarketPlace}"),
  WLDeviceSupportMessageFormat : new MessageFormat("wifilocker.devicesupporturl.{MarketPlace}")
};

// string map for large mode
var WLLegalStringTableLarge = {

  close       : "Schlie\u00dfen"
};

//checks for large mode and constructs WLLegalStringTable based on the display mode

WLLegalStringTable = constructTableOnDisplayModeChange(WLLegalStringTable,WLLegalStringTableLarge);
