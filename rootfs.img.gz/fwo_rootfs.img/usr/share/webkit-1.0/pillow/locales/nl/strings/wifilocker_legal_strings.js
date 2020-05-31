
// string map for default mode
var WLLegalStringTable = {

  WLFAQHeader : "Je wachtwoorden opslaan in Amazon",
  close       : "SLUITEN",
  WLFAQMessageFormat : new MessageFormat("<b> 1. Wat is het voordeel van het opslaan van mijn wifi-wachtwoorden in mijn Amazon-account? </b> </br> Als je je wifi-wachtwoorden opslaat in je Amazon-account, kunnen wij jouw compatibele apparaten configureren zodat je je wifi-wachtwoorden niet op elk apparaat opnieuw hoeft in te voeren. </br> <b> 2. Zijn mijn wifi-wachtwoorden veilig? </b> </br> Ja. Zodra je wifi-wachtwoorden zijn opgeslagen in je Amazon-account, worden ze via een beveiligde verbinding verzonden en opgeslagen in een gecodeerd bestand op een server van Amazon. Amazon gebruikt je wifi-wachtwoorden alleen om verbinding te maken met je compatibele apparaten. Zonder jouw toestemming worden je wachtwoorden niet gedeeld met derde partijen. Alle informatie die Amazon ontvangt, dus ook jouw wifi-wachtwoorden, wordt behandeld in overeenstemming met de Privacyverklaring op Amazon.com ({privacyUrlString}). </br> <b> 3. Wat moet ik doen als ik mijn wifi-wachtwoorden wijzig? </b> </br> Je kunt je ge\u00fcpdatete wifi-wachtwoorden opslaan in je Amazon-account door het wifi-installatieproces opnieuw uit te voeren op een compatibel apparaat. Zodra je apparaat weer verbonden is met je wifi-netwerk, wordt je ge\u00fcpdatete wifi-wachtwoord automatisch opgeslagen in je Amazon-account. </br> <b> 4. Zijn vorige wachtwoorden ingevoerd op dit apparaat opgeslagen in mijn Amazon-account als ik de optie om wachtwoorden op te slaan in Amazon niet heb geselecteerd? </b> </br>Nee, ze zijn niet opgeslagen. Wachtwoorden die je invoert, worden vanaf nu alleen opgeslagen als het selectievakje is aangevinkt voor Wachtwoord opslaan in Amazon. Als het selectievakje niet is aangevinkt, slaan we je wifi-wachtwoorden niet op in je Amazon-account. </br> <b> 5. Hoe kan ik mijn wifi-wachtwoorden verwijderen uit mijn Amazon-account? </b> </br> Je kunt de wifi-wachtwoorden die je hebt opgeslagen in je Amazon-account verwijderen door contact op te nemen met de klantenservice via het formulier Contact op {deviceSupporUrlString}. Je kunt wifi-wachtwoorden opgeslagen op dit apparaat verwijderen in Instellingen."),
  WLPrivacyUrlMessageFormat : new MessageFormat("wifilocker.privacyurl.{MarketPlace}"),
  WLDeviceSupportMessageFormat : new MessageFormat("wifilocker.devicesupporturl.{MarketPlace}")
};

// string map for large mode
var WLLegalStringTableLarge = {

  close       : "Sluiten"
};

//checks for large mode and constructs WLLegalStringTable based on the display mode

WLLegalStringTable = constructTableOnDisplayModeChange(WLLegalStringTable,WLLegalStringTableLarge);
