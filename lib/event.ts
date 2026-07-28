export const eventDetails = {
  couple: "Ryan e Juliana",
  title: "Chá de Casa Nova de Ryan e Juliana",
  description:
    "Criamos esse site para compartilhar com vocês os detalhes da organização do nosso chá de casa nova. Estamos muito felizes e contamos com a presença de todos para comemorar essa nova fase. Pedimos que confirme sua presença preenchendo os dados necessários. Para nos presentear, escolha qualquer item da lista desse site. Aguardamos vocês!",
  date: "11/10/2026",
  dateLong: "11 de outubro de 2026",
  time: "12h",
  place: "Rua Olímpio de Azevedo, 261 - Vila Valqueire",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Rua%20Ol%C3%ADmpio%20de%20Azevedo%2C%20261%20-%20Vila%20Valqueire",
  whatsappDisplay: "(21) 98162-0736",
  whatsappNumber: "5521981620736",
  contactName: "Ryan e Juliana",
  contactCta: "Fale conosco",
  deadline: "até o dia do evento",
  inviteParagraphs: [
    "Criamos esse site para compartilhar com vocês os detalhes da organização do nosso chá de casa nova.",
    "Estamos muito felizes e contamos com a presença de todos para comemorar essa nova fase.",
    "Pedimos que confirme sua presença preenchendo os dados necessários.",
    "Para nos presentear, escolha qualquer item da lista desse site.",
    "Aguardamos vocês!"
  ],
  payment: {
    preferredMethod: "Pix",
    pixKeyType: "CPF",
    pixKey: "16472088748",
    recipientName: "Ryan Cavalcanti Barbosa",
    bank: "Nubank",
    receiptInstruction: "Após o pagamento, envie o comprovante para Ryan e Juliana.",
    creditCardInstruction: "Caso prefira pagar com cartão de crédito, Ryan e Juliana podem enviar um link para compra."
  },
  notices: [
    "A preferência é receber o valor do presente via Pix.",
    "Você pode reservar mais de um presente, se quiser.",
    "A data sugerida para envio do presente é até o dia do evento."
  ]
};

export function getWhatsappUrl(message = "Oi! Quero falar com vocês sobre o chá de casa nova.") {
  return `https://wa.me/${eventDetails.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
