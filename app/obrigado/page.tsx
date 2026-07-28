import { ArrowLeft, CheckCircle2, Gift, HeartHandshake, MessageCircle } from "lucide-react";
import { eventDetails, getWhatsappUrl } from "@/lib/event";

type ThankYouPageProps = {
  searchParams?: {
    tipo?: string;
    presente?: string;
    valor?: string;
    pessoas?: string;
  };
};

function cleanParam(value: string | undefined, fallback = "") {
  return value ? value.slice(0, 120) : fallback;
}

export default function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const type = searchParams?.tipo === "presenca" ? "presenca" : "presente";
  const giftName = cleanParam(searchParams?.presente, "presente escolhido");
  const giftValue = cleanParam(searchParams?.valor, "Valor a combinar");
  const guestsCount = Math.max(1, Number(searchParams?.pessoas ?? 1));
  const isPresence = type === "presenca";
  const whatsappMessage = isPresence
    ? "Oi, Juliana! Acabei de confirmar minha presença no site do Chá de Panela."
    : `Oi, Juliana! Reservei o presente "${giftName}" no site do Chá de Panela e vou enviar o comprovante.`;

  return (
    <main className="min-h-screen bg-[#f7f8ef]">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-10 sm:px-8 lg:px-10">
        <a
          href="/"
          className="focus-ring mb-8 inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-blueink-700 transition hover:bg-blueink-50"
        >
          <ArrowLeft size={17} />
          Voltar ao convite
        </a>

        <div className="rounded-lg border border-blueink-100 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={28} />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase text-blueink-600">
            {isPresence ? "Presença confirmada" : "Presente reservado"}
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-blueink-900 sm:text-4xl">
            {isPresence ? "Obrigado por confirmar presença!" : "Obrigado pela reserva do presente!"}
          </h1>

          {isPresence ? (
            <div className="mt-5 max-w-3xl space-y-3 text-base leading-7 text-graphite">
              <p>
                Recebemos a confirmação de {guestsCount} {guestsCount === 1 ? "pessoa" : "pessoas"}. Vai ser muito
                especial ter vocês com a gente nesse dia.
              </p>
              <p>
                O evento será em {eventDetails.dateLong}, às {eventDetails.time}, no{" "}
                <a
                  href={eventDetails.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring rounded-md font-semibold text-blueink-800 underline decoration-blueink-300 underline-offset-4"
                >
                  {eventDetails.place}
                </a>
                {"."}
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
              <div className="rounded-lg border border-blueink-100 bg-blueink-50/60 p-5">
                <div className="flex items-start gap-3">
                  <Gift className="mt-1 shrink-0 text-blueink-600" size={22} />
                  <div>
                    <p className="text-sm font-semibold text-blueink-700">Presente escolhido</p>
                    <h2 className="mt-2 break-words text-2xl font-semibold text-blueink-950">{giftName}</h2>
                    <p className="mt-2 text-sm font-semibold text-graphite">{giftValue}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-blueink-100 bg-white p-5">
                <p className="text-sm font-semibold uppercase text-blueink-600">Próximos passos</p>
                <div className="mt-4 space-y-3 text-sm leading-6 text-graphite">
                  <p>
                    Faça o Pix para <span className="font-semibold">{eventDetails.payment.pixKey}</span>.
                  </p>
                  <p>
                    Nome: <span className="font-semibold">{eventDetails.payment.recipientName}</span>
                  </p>
                  <p>
                    Depois, envie o comprovante para Juliana pelo WhatsApp para ela dar baixa no recebimento.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href={getWhatsappUrl(whatsappMessage)}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-blueink-700 px-6 py-3 font-semibold text-white transition hover:bg-blueink-800"
            >
              <MessageCircle size={18} />
              Falar com Juliana
            </a>
            <a
              href="/#presentes"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 px-6 py-3 font-semibold text-blueink-800 transition hover:bg-blueink-50"
            >
              <Gift size={18} />
              Ver lista de presentes
            </a>
            {!isPresence ? (
              <a
                href="/#presenca"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 px-6 py-3 font-semibold text-blueink-800 transition hover:bg-blueink-50"
              >
                <HeartHandshake size={18} />
                Confirmar presença
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
