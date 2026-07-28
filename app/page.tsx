import {
  CalendarDays,
  Gift,
  HeartHandshake,
  MapPin,
  MessageCircle,
  ShieldCheck
} from "lucide-react";
import { CoupleCarousel } from "@/components/CoupleCarousel";
import { GiftList } from "@/components/GiftList";
import { HomeScrollReset } from "@/components/HomeScrollReset";
import { RsvpForm } from "@/components/RsvpForm";
import { eventDetails, getWhatsappUrl } from "@/lib/event";
import { formatCurrencyFromCents } from "@/lib/format";
import { getGiftSummary, getPublicGifts } from "@/lib/data";
import type { PublicGift } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let gifts: PublicGift[] = [];
  let loadError: string | null = null;

  try {
    gifts = await getPublicGifts();
  } catch {
    loadError = "A lista de presentes não pôde ser carregada. Verifique a conexão com o banco de dados.";
  }

  const summary = getGiftSummary(gifts);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8ef]">
      <HomeScrollReset />
      <section className="relative bg-blueink-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(143,161,79,0.24),transparent_34%),linear-gradient(135deg,#fcfdf6_0%,#edf1df_48%,#f7f8ef_100%)]" />
        <div className="relative mx-auto grid min-h-[86vh] max-w-7xl gap-8 px-4 pb-12 pt-5 sm:gap-10 sm:px-8 sm:pb-14 sm:pt-6 lg:px-10 xl:grid-cols-[1.05fr_0.95fr]">
          <nav className="col-span-full flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
            <a href="/" className="text-sm font-semibold text-blueink-800">
              Ryan & Juliana
            </a>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="#presenca"
                className="focus-ring rounded-full px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-white/75"
              >
                Presença
              </a>
              <a
                href="#presentes"
                className="focus-ring rounded-full px-4 py-2 text-sm font-semibold text-blueink-800 transition hover:bg-white/75"
              >
                Presentes
              </a>
              <a
                href="/admin"
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-blueink-800 shadow-sm transition hover:bg-white"
                aria-label="Área administrativa"
                title="Área administrativa"
              >
                <ShieldCheck size={18} />
              </a>
            </div>
          </nav>

          <div className="flex flex-col justify-center py-7 lg:py-16">
            <p className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-blueink-700 shadow-sm">
              <HeartHandshake size={17} />
              Convite especial
            </p>
            <h1 className="max-w-3xl text-[2rem] font-semibold leading-[1.08] text-blueink-900 min-[390px]:text-[2.375rem] sm:text-[4rem] sm:leading-[1.03]">
              <span className="block whitespace-nowrap">Chá de Panela</span>
              <span className="block whitespace-nowrap">Ryan e Juliana.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-graphite sm:text-xl sm:leading-8">
              {eventDetails.description}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm">
                <CalendarDays className="mb-3 text-blueink-600" size={22} />
                <p className="text-sm text-pewter">Data e horário</p>
                <p className="mt-1 font-semibold text-blueink-900">
                  {eventDetails.date} às {eventDetails.time}
                </p>
              </div>
              <div className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm sm:col-span-2">
                <MapPin className="mb-3 text-blueink-600" size={22} />
                <p className="text-sm text-pewter">Local</p>
                <a
                  href={eventDetails.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring mt-1 inline-flex rounded-md font-semibold text-blueink-900 underline decoration-blueink-300 underline-offset-4 transition hover:text-blueink-700"
                >
                  {eventDetails.place}
                </a>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#presenca"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-6 py-3 font-semibold text-blueink-800 transition hover:border-blueink-300 hover:bg-blueink-50"
              >
                <HeartHandshake size={19} />
                Confirmar presença
              </a>
              <a
                href={getWhatsappUrl()}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-blueink-700 px-6 py-3 font-semibold text-white shadow-soft transition hover:bg-blueink-800"
              >
                <MessageCircle size={19} />
                {eventDetails.contactCta}
              </a>
              <a
                href="#presentes"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-full border border-blueink-200 bg-white px-6 py-3 font-semibold text-blueink-800 transition hover:border-blueink-300 hover:bg-blueink-50"
              >
                <Gift size={19} />
                Ver lista de presentes
              </a>
            </div>
          </div>

          <div className="flex items-center pb-6 lg:pb-0">
            <div className="hero-photo min-h-[320px] w-full rounded-lg shadow-soft sm:min-h-[460px] xl:min-h-[620px]" />
          </div>
        </div>
      </section>

      <section className="bg-white py-10 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-blueink-50 px-4 py-2 text-sm font-semibold text-blueink-700">
              <Gift size={17} />
              Lista de presentes
            </p>
            <h2 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-blueink-900 sm:text-3xl">
              Quer nos ajudar nesse novo começo?
            </h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-graphite">
              Se quiser participar com um presente, a lista completa está logo abaixo, com itens disponíveis, valores e reserva simples pelo site.
            </p>
          </div>
          <a
            href="#presentes"
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-full bg-blueink-700 px-6 font-semibold text-white shadow-sm transition hover:bg-blueink-800"
          >
            <Gift size={18} />
            Ver presentes disponíveis
          </a>
        </div>
      </section>

      <RsvpForm />

      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 text-center sm:px-8 lg:px-10">
          <p className="text-sm font-semibold uppercase text-blueink-600">Convite</p>
          <h2 className="mx-auto max-w-3xl text-3xl font-semibold leading-tight text-blueink-900 sm:text-4xl">
            Queremos você com a gente nesse dia
          </h2>
          <div className="mx-auto max-w-4xl space-y-5 text-base leading-8 text-graphite sm:text-lg">
            {eventDetails.inviteParagraphs.map((paragraph) => (
              <p key={paragraph} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
          <CoupleCarousel />
        </div>
      </section>

      <section className="border-b border-blueink-100 bg-blueink-50/70 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-8 lg:grid-cols-[1fr_1fr] lg:px-10">
          <div className="rounded-lg border border-blueink-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase text-blueink-600">Formato dos presentes</p>
            <h2 className="mt-3 text-2xl font-semibold text-blueink-900">Pix preferencial</h2>
            <div className="mt-5 grid gap-3 text-sm text-graphite">
              <p>
                <span className="font-semibold">Chave Pix:</span> {eventDetails.payment.pixKey}
              </p>
              <p>
                <span className="font-semibold">Nome:</span> {eventDetails.payment.recipientName}
              </p>
              <p>
                <span className="font-semibold">Banco:</span> {eventDetails.payment.bank}
              </p>
              <p>
                <span className="font-semibold">Data limite:</span> {eventDetails.deadline}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-blueink-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase text-blueink-600">Avisos</p>
            <div className="mt-5 space-y-3 text-sm leading-6 text-graphite">
              {eventDetails.notices.map((notice) => (
                <p key={notice}>{notice}</p>
              ))}
              <p>{eventDetails.payment.receiptInstruction}</p>
              <p>{eventDetails.payment.creditCardInstruction}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="presentes" className="bg-[#f7f8ef] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-10">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-blueink-600">Lista de presentes</p>
              <h2 className="mt-3 text-3xl font-semibold text-blueink-900 sm:text-4xl">
                Escolha um presente para reservar
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-pewter">
                Depois da reserva, o item fica marcado como reservado para evitar duplicidade.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
              <div className="rounded-lg bg-white p-3 shadow-sm sm:p-4">
                <p className="text-2xl font-semibold text-blueink-900">{summary.total}</p>
                <p className="text-xs font-medium text-pewter">itens</p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm sm:p-4">
                <p className="text-2xl font-semibold text-emerald-700">{summary.available}</p>
                <p className="text-xs font-medium text-pewter">livres</p>
              </div>
              <div className="rounded-lg bg-white p-3 shadow-sm sm:p-4">
                <p className="text-2xl font-semibold text-slate-500">{summary.reserved}</p>
                <p className="text-xs font-medium text-pewter">reservados</p>
              </div>
            </div>
          </div>

          <GiftList
            gifts={gifts}
            loadError={loadError}
            reservedTotal={formatCurrencyFromCents(summary.reservedTotalCents)}
          />
        </div>
      </section>

      <footer className="border-t border-blueink-100 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-pewter sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>Com carinho, Ryan e Juliana.</p>
          <a
            href={getWhatsappUrl("Oi! Tenho uma dúvida sobre o chá de casa nova.")}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 font-semibold text-blueink-700 transition hover:bg-blueink-50"
          >
            <MessageCircle size={17} />
            {eventDetails.contactCta}
          </a>
        </div>
      </footer>
    </main>
  );
}
