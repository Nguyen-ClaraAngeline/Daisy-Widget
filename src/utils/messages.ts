import type { ApiErrorKind } from "../types";

export const MSG = {
  loading: "Chargement…",
  noCourses: "Aucun cours n'est proposé pour le moment.",
  noSlots: "Aucune date n'est ouverte dans les 90 prochains jours.",
  courseFull: "Ce cours est complet pour le moment. De nouvelles dates sont ajoutées régulièrement, revenez bientôt.",
  slotFull: "Complet",
  remaining: (n: number) => (n === 1 ? "Dernière place" : `${n} places`),
  retry: "Réessayer",
  back: "Retour",
  confirm: "Confirmer la réservation",
  confirming: "Réservation en cours…",
  seats: "Nombre de places",
  notes: "Précisions pour l'atelier (facultatif)",
  total: (t: string) => `Total : ${t}`,

  // Texte exact quand la dernière place part pendant la saisie (409 slot_full, available = 0)
  taken:
    "Cette place vient d'être réservée par quelqu'un d'autre. Vos coordonnées sont conservées : choisissez un autre créneau ci-dessous, il suffira de confirmer.",
  // 409 slot_full avec available > 0
  reduced: (n: number) =>
    `Il ne reste plus que ${n} place${n > 1 ? "s" : ""} sur ce créneau. Ajustez le nombre de places ou choisissez un autre créneau.`,
  cancelled: "Ce créneau a été annulé par l'atelier. Vos coordonnées sont conservées : choisissez une autre date.",

  confirmed: (code: string) => `Votre réservation est confirmée. Code : ${code}. Un e-mail de confirmation vous a été envoyé.`,

  errors: {
    network: "Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez. Vos informations sont conservées.",
    timeout: "Le serveur met trop de temps à répondre. Réessayez dans un instant.",
    server: "Un problème est survenu de notre côté. Réessayez dans un instant.",
    origin: "Ce module de réservation n'est pas encore autorisé sur ce site. Si vous en êtes le propriétaire, déclarez ce domaine dans votre back-office Daisy.",
    rate_limited: "Trop de tentatives. Réessayez dans une heure ou contactez directement l'atelier.",
    full: "Ce créneau est complet.",
    cancelled: "Ce créneau a été annulé.",
    phone_required: "L'atelier demande un numéro de téléphone.",
    too_many_seats: "Nombre de places trop élevé pour une seule réservation.",
    validation: "Certaines informations semblent incorrectes. Vérifiez le formulaire.",
    // Pas de retry aveugle : la réservation a peut-être abouti.
    uncertain:
      "Nous n'avons pas reçu de réponse. Votre réservation a peut-être été enregistrée : vérifiez votre boîte mail (et vos spams) avant de réessayer, pour éviter un doublon.",
  } satisfies Record<ApiErrorKind, string>,

  fields: { firstName: "Prénom", lastName: "Nom", email: "Adresse e-mail", phone: "Téléphone", phoneOpt: "Téléphone (facultatif)" },
  validation: {
    firstName: "Indiquez votre prénom.",
    lastName: "Indiquez votre nom.",
    email: "Indiquez une adresse e-mail valide.",
    phone: "Numéro de téléphone invalide.",
    phoneRequired: "L'atelier a besoin de votre numéro de téléphone.",
  },
} as const;