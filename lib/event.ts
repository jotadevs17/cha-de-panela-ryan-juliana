export const eventDetails = {
  couple: "Ryan e Juliana",
  title: "Chá de Panela de Ryan e Juliana",
  date: "26/09/2026",
  dateLong: "26 de setembro de 2026",
  time: "13h",
  place: "Clube da Petrobras CEPE RIO - Recreio",
  mapsUrl: "https://maps.app.goo.gl/gaQZQYba9dQqQ6Su8",
  whatsappDisplay: "(00) 00000-0000",
  whatsappNumber: "5500000000000",
  contactName: "Juliana",
  deadline: "05/10/2026",
  inviteParagraphs: [
    "Olá, queremos te convidar com muito carinho para o nosso Chá de Panela, que será no dia 26/09.",
    "Esse dia vai ser muito especial pra gente, porque além de celebrarmos essa fase tão bonita, queremos dividir esse momento com pessoas queridas.",
    "Estamos muito felizes em dar esse passo e começar esse novo capítulo da nossa vida. E seria muito importante ter você com a gente nesse momento!",
    "A sua presença vai deixar esse dia ainda mais leve, feliz e cheio de significado.",
    "Esperamos você pra celebrar com a gente!",
    "Com carinho,\nRyan e Juliana"
  ],
  payment: {
    preferredMethod: "Pix",
    pixKeyType: "a definir",
    pixKey: "PIX_A_DEFINIR",
    recipientName: "NOME_A_DEFINIR",
    bank: "BANCO_A_DEFINIR",
    receiptInstruction: "Após o pagamento, envie o comprovante para Ryan ou Juliana.",
    creditCardInstruction: "Caso prefira pagar com cartão de crédito, Ryan e Juliana podem enviar um link para compra."
  },
  notices: [
    "A preferência é receber o valor do presente via Pix.",
    "Você pode reservar mais de um presente, se quiser.",
    "A data limite sugerida para envio do presente é 05/10/2026."
  ]
};

export function getWhatsappUrl(message = "Oi, Juliana! Quero confirmar minha presença no Chá de Panela de Ryan e Juliana.") {
  return `https://wa.me/${eventDetails.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
