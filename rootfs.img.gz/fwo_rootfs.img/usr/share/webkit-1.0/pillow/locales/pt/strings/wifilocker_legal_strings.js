
// string map for default mode
var WLLegalStringTable = {

  WLFAQHeader : "Como salvar as senhas na Amazon",
  close       : "FECHAR",
  WLFAQMessageFormat : new MessageFormat("<b> 1. Qual o benef\u00edcio de salvar as senhas de Wi-Fi na conta da Amazon? </b> </br> Quando voc\u00ea salvar as senhas de Wi-Fi na conta da Amazon, \u00e9 poss\u00edvel configurar os dispositivos compat\u00edveis para que n\u00e3o seja necess\u00e1rio inserir as senhas de Wi-Fi novamente em cada dispositivo. </br> <b> 2. As senhas de Wi-Fi est\u00e3o seguras? </b> </br> Sim. Quando voc\u00ea salv\u00e1-las na conta da Amazon, as senhas de Wi-Fi s\u00e3o enviadas atrav\u00e9s de uma conex\u00e3o segura e s\u00e3o armazenadas em um arquivo criptografado no servidor da Amazon. A Amazon poder\u00e1 usar as senhas de Wi-Fi para conectar os dispositivos compat\u00edveis e n\u00e3o as compartilhar\u00e1 com terceiros sem a sua permiss\u00e3o. A Amazon lida com quaisquer informa\u00e7\u00f5es recebidas, inclusive as senhas de Wi-Fi, de acordo com o aviso de privacidade da Amazon ({privacyUrlString}). </br> <b> 3. O que devo fazer se eu alterar as senhas de Wi-Fi? </b> </br> \u00c9 poss\u00edvel salvar as senhas de Wi-Fi atualizadas na conta da Amazon ao executar novamente qualquer dispositivo compat\u00edvel pelo processo de configura\u00e7\u00e3o de Wi-Fi. Quando voc\u00ea reconectar-se com a rede Wi-Fi, a senha de Wi-Fi atualizada ser\u00e1 salva automaticamente na conta da Amazon. </br> <b> 4. As senhas anteriores inseridas no dispositivo s\u00e3o salvas na conta da Amazon mesmo se eu n\u00e3o selecionar a op\u00e7\u00e3o Salvar senha na Amazon? </b> </br> N\u00e3o, elas n\u00e3o s\u00e3o salvas. A partir de agora, as senhas inseridas ser\u00e3o salvas desde que a caixa de sele\u00e7\u00e3o Salvar senha na Amazon for selecionada. Se a caixa de sele\u00e7\u00e3o n\u00e3o for selecionada, as senhas de Wi-Fi n\u00e3o ser\u00e3o salvas na conta da Amazon. </br> <b> 5. Como excluo as senhas de Wi-Fi da conta da Amazon? </b> </br> \u00c9 poss\u00edvel excluir as senhas de Wi-Fi que foram salvas na conta da Amazon ao entrar em contato com o Atendimento ao cliente atrav\u00e9s do formul\u00e1rio Fale conosco em {deviceSupporUrlString}. Tamb\u00e9m \u00e9 poss\u00edvel excluir as senhas de Wi-Fi salvas neste dispositivo em Configura\u00e7\u00f5es."),
  WLPrivacyUrlMessageFormat : new MessageFormat("wifilocker.privacyurl.{MarketPlace}"),
  WLDeviceSupportMessageFormat : new MessageFormat("wifilocker.devicesupporturl.{MarketPlace}")
};

// string map for large mode
var WLLegalStringTableLarge = {

  close       : "Fechar"
};

//checks for large mode and constructs WLLegalStringTable based on the display mode

WLLegalStringTable = constructTableOnDisplayModeChange(WLLegalStringTable,WLLegalStringTableLarge);
