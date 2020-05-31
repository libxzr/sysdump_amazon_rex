
// string map for default mode
var WLLegalStringTable = {

  WLFAQHeader : "Enregistrer les mots de passe sur Amazon",
  close       : "FERMER",
  WLFAQMessageFormat : new MessageFormat("<b> 1. Quels sont les avantages \u00e0 enregistrer mes mots de passe Wi-Fi sur mon compte Amazon ? </b> </br> Une fois vos mots de passe Wi-Fi enregistr\u00e9s sur votre compte Amazon, vous pouvez configurer vos appareils compatibles afin de ne pas avoir \u00e0 retaper vos mots de passe Wi-Fi sur chaque appareil. </br> <b> 2. Mes mots de passe sont-ils enregistr\u00e9s de mani\u00e8re s\u00e9curis\u00e9e ? </b> </br> Une fois enregistr\u00e9s sur votre compte Amazon, vos mots de passe sont envoy\u00e9s via une connexion s\u00e9curis\u00e9e et sont stock\u00e9s dans un fichier encod\u00e9 sur un serveur Amazon. Amazon n\u02bcutilisera vos mots de passe Wi-Fi que pour connecter vos appareils compatibles et ne les partagera pas avec un tiers sans votre autorisation. Amazon traite toutes les informations qu\u02bcil re\u00e7oit, y compris vos mots de passe Wi-Fi, conform\u00e9ment \u00e0 la notice Protection de vos informations personnelles d\u02bcAmazon ({privacyUrlString}). </br> <b> 3. Que faire si je change mes mots de passe Wi-Fi ? </b> </br> Vous pouvez enregistrer vos nouveaux mots de passe Wi-Fi sur votre compte Amazon en ex\u00e9cutant \u00e0 nouveau l\u02bcinstallation du Wi-Fi de votre appareil compatible. Une fois celui-ci reconnect\u00e9 \u00e0 votre r\u00e9seau Wi-Fi, votre nouveau mot de passe Wi-Fi sera automatiquement enregistr\u00e9 sur votre compte Amazon. </br> <b> 4. Est-ce que les mots de passe saisis pr\u00e9c\u00e9demment sur cet appareil sont enregistr\u00e9s sur mon compte Amazon si je ne s\u00e9lectionne pas l\u02bcoption Enregistrer les mots de passe sur Amazon\u00a0? </b> </br> Non, ils ne le sont pas. Seuls les mots de passe saisis apr\u00e8s avoir coch\u00e9 l\u02bcoption Enregistrer le mot de passe sur Amazon le sont. Si l\u02bcoption n\u02bcest pas coch\u00e9e, aucun de vos mots de passe Wi-Fi ne sera enregistr\u00e9 sur votre compte Amazon. </br> <b> 5. Comment supprimer mes mots de passe Wi-Fi de mon compte Amazon ? </b> </br> Vous pouvez supprimer les mots de passe Wi-Fi enregistr\u00e9s sur votre compte Amazon en contactant le service client par le biais du formulaire Nous contacter \u00e0 l\u02bcadresse {deviceSupporUrlString}. Vous pouvez \u00e9galement supprimer les mots de passe Wi-Fi enregistr\u00e9s sur cet appareil dans Param\u00e8tres."),
  WLPrivacyUrlMessageFormat : new MessageFormat("wifilocker.privacyurl.{MarketPlace}"),
  WLDeviceSupportMessageFormat : new MessageFormat("wifilocker.devicesupporturl.{MarketPlace}")
};

// string map for large mode
var WLLegalStringTableLarge = {

  close       : "Fermer"
};

//checks for large mode and constructs WLLegalStringTable based on the display mode

WLLegalStringTable = constructTableOnDisplayModeChange(WLLegalStringTable,WLLegalStringTableLarge);
