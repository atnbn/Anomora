import type { LegalSlug } from "@/features/marketing/legal-links";

/**
 * Layout-Inhalte für die rechtlichen Seiten. Impressum, Datenschutz und
 * Nutzungsbedingungen sind Platzhalter: Die rechtsverbindlichen Texte muss
 * der Betreiber (ggf. mit Rechtsberatung) ergänzen.
 */

export type LegalSection = { heading: string; paragraphs: string[] };

export type LegalDocument = {
  title: string;
  summary: string;
  placeholder: boolean;
  sections: LegalSection[];
};

const PLACEHOLDER = "[Platzhalter – vom Betreiber zu ergänzen]";

export const legalDocuments: Record<LegalSlug, LegalDocument> = {
  impressum: {
    title: "Impressum",
    summary: "Anbieterkennzeichnung nach § 5 Digitale-Dienste-Gesetz (DDG).",
    placeholder: true,
    sections: [
      {
        heading: "Anbieter",
        paragraphs: [
          `Name bzw. Firma: ${PLACEHOLDER}`,
          `Anschrift: ${PLACEHOLDER}`,
          `Vertreten durch: ${PLACEHOLDER}`,
        ],
      },
      {
        heading: "Kontakt",
        paragraphs: [`E-Mail: ${PLACEHOLDER}`, `Telefon: ${PLACEHOLDER}`],
      },
      {
        heading: "Verantwortlich für Inhalte",
        paragraphs: [`${PLACEHOLDER}`],
      },
    ],
  },
  datenschutz: {
    title: "Datenschutzerklärung",
    summary: "Wie ANIMORA personenbezogene Daten verarbeitet.",
    placeholder: true,
    sections: [
      {
        heading: "Verantwortliche Stelle",
        paragraphs: [PLACEHOLDER],
      },
      {
        heading: "Welche Daten wir verarbeiten",
        paragraphs: [
          "In der Demo-Version werden Konto- und Profildaten (E-Mail-Adresse, Nutzername, Profilangaben), Favoriten, Beiträge und Einstellungen ausschließlich im lokalen Speicher deines Browsers abgelegt und nicht an einen Server übertragen. Passwörter werden nicht gespeichert.",
          `Für den Produktivbetrieb: ${PLACEHOLDER}`,
        ],
      },
      {
        heading: "Rechtsgrundlagen und Speicherdauer",
        paragraphs: [PLACEHOLDER],
      },
      {
        heading: "Deine Rechte",
        paragraphs: [
          "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht auf Beschwerde bei einer Aufsichtsbehörde.",
          `Kontakt für Datenschutzanfragen: ${PLACEHOLDER}`,
        ],
      },
    ],
  },
  nutzungsbedingungen: {
    title: "Nutzungsbedingungen",
    summary: "Regeln für die Nutzung von ANIMORA.",
    placeholder: true,
    sections: [
      { heading: "Geltungsbereich", paragraphs: [PLACEHOLDER] },
      { heading: "Konto und Registrierung", paragraphs: [PLACEHOLDER] },
      {
        heading: "Inhalte von Nutzerinnen und Nutzern",
        paragraphs: [
          "Für Beiträge, Kommentare und Bilder gelten zusätzlich die Community-Richtlinien.",
          PLACEHOLDER,
        ],
      },
      { heading: "Sperrung und Kündigung", paragraphs: [PLACEHOLDER] },
    ],
  },
  "community-richtlinien": {
    title: "Community-Richtlinien",
    summary: "Damit ANIMORA ein guter Ort für alle Fans bleibt.",
    placeholder: false,
    sections: [
      {
        heading: "Respektvoll bleiben",
        paragraphs: [
          "Diskutiere über Serien, nicht über Personen. Beleidigungen, Hass, Belästigung und Drohungen sind nicht erlaubt.",
        ],
      },
      {
        heading: "Spoiler markieren",
        paragraphs: [
          "Aktiviere die Spoiler-Markierung, sobald dein Beitrag oder Kommentar Handlungsdetails verrät – besonders bei neuen Folgen und Manga-Inhalten.",
        ],
      },
      {
        heading: "Keine Werbung und kein Spam",
        paragraphs: [
          "Wiederholte Beiträge, Links zu illegalen Streams und kommerzielle Werbung werden entfernt.",
        ],
      },
      {
        heading: "Rechte anderer achten",
        paragraphs: [
          "Teile nur Bilder, die du selbst erstellt hast oder verwenden darfst, und nenne bei Fanart die Künstlerin oder den Künstler.",
        ],
      },
      {
        heading: "Melden statt streiten",
        paragraphs: [
          "Über das Menü an jedem Beitrag, Kommentar und Profil kannst du Verstöße melden oder Personen blockieren. Das Moderationsteam prüft jede Meldung.",
        ],
      },
    ],
  },
};
