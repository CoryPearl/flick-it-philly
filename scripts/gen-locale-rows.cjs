"use strict";
/* eslint-disable max-len */
const fs = require("fs");
const path = require("path");
const en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../public/locales/_en.json"), "utf8")
);
const keys = Object.keys(en);
const chunks = [keys.slice(0, 48), keys.slice(48, 96), keys.slice(96)];
const names = ["a", "b", "c"];

const fr = {
  "nav.home": "Accueil",
  "nav.camera": "Caméra",
  "nav.settings": "Réglages",
  "nav.main_aria": "Navigation principale",
  "set.title": "Réglages",
  "set.dark": "Mode sombre",
  "set.location": "Utiliser la position de l’appareil",
  "set.camera": "Utiliser l’appareil photo",
  "set.microphone": "Utiliser le micro",
  "set.language": "Langue",
  "set.open_app": "Ouvrir les réglages de l’app",
  "set.help_blocked":
    "Utilisez ceci si l’invite caméra ou micro a été bloquée ou si l’aperçu ne démarre pas.",
  "set.clear": "Effacer toutes les données locales",
  "home.title": "Flick It Philly",
  "home.reports": "Vos signalements",
  "home.empty":
    "Aucun signalement pour l’instant. Utilisez la caméra pour ajouter des photos et/ou une note vocale, puis générez un rapport. Touchez un brouillon pour les détails ou envoyer plus tard.",
  "home.map_title_all": "Tous les signalements au 311",
  "home.map_title_mine": "Vos signalements au 311",
  "home.map_desc":
    "La carte montre seulement les 30 derniers jours. Vos envois sont jaunes (en attente) ou verts (terminés). Avec Tout le monde, les points rouges et bleus sont des dossiers 311 réels (ouverts / fermés). Les brouillons ne s’affichent pas.",
  "map.view": "Vue",
  "map.mine": "Moi seulement",
  "map.everyone": "Tout le monde",
  "map.category": "Catégorie",
  "map.all_types": "Tous les types",
  "map.count_none_yours": "Aucun signalement correspondant sur la carte.",
  "map.count_yours": "{n} signalement{s} sur la carte (les vôtres)",
  "map.count_none": "Aucun signalement correspondant sur la carte.",
  "map.count_mix":
    "{t} signalements sur la carte ({y} vôtres · {c} ville). Touchez un groupe pour zoomer ; touchez un point pour les détails.",
  "cam.slots_aria": "Emplacements photo ; retirez avec le bouton X",
  "cam.overlay": "Ajoutez des photos et/ou une note vocale, puis Signaler",
  "cam.off": "Caméra désactivée",
  "cam.off_help":
    "Activez « Utiliser l’appareil photo » dans l’onglet Réglages.",
  "cam.unavail": "Caméra indisponible",
  "cam.allow": "Autorisez la caméra dans l’onglet Réglages.",
  "cam.take_photo": "Prendre une photo",
  "cam.native_help":
    "Touchez le bouton rond pour ouvrir l’appareil photo de l’appareil.",
  "cam.pinch_help": "Pincez l’aperçu avec deux doigts pour zoomer.",
  "cam.gallery": "Galerie",
  "cam.gallery_aria": "Importer des photos depuis la galerie",
  "cam.report": "Signaler",
  "cam.preview_aria": "Aperçu caméra en direct",
  "cam.capture_aria": "Prendre une photo",
  "cam.generate_aria": "Générer un rapport à partir des photos et de l’audio",
  "voice.audio": "Audio",
  "voice.stop": "Arrêter",
  "voice.recording": "Enregistrement…",
  "voice.ready": "Note vocale prête — touchez lecture pour réécouter",
  "voice.mic_off": "Le micro est désactivé dans les Réglages.",
  "voice.btn_aria": "Enregistrer ou arrêter la note vocale",
  "voice.clear": "Effacer la voix",
  "voice.clear_aria": "Supprimer la note vocale",
  "voice.playback_aria": "Lire la note vocale",
  "voice.playback_heading": "Note vocale",
  "modal.confirm_title": "Utiliser cette photo ?",
  "modal.confirm_img_alt": "Photo sélectionnée",
  "modal.retake": "Reprendre",
  "modal.accept": "Accepter",
  "modal.report_title": "Modifier le rapport",
  "modal.ai_heading": "Revue IA",
  "modal.category": "Catégorie",
  "modal.description": "Description",
  "modal.location": "Lieu (adresse)",
  "modal.loc_meta": "Obligatoire — rue ou intersection",
  "modal.loc_detail": "rue ou intersection",
  "modal.loc_ph": "Obligatoire : rue ou intersection",
  "modal.desc_staff_hint": "description générale pour le personnel municipal.",
  "modal.desc_optional_hint": "ajoutez des détails si utile.",
  "modal.primary_note":
    "Votre première photo est envoyée automatiquement comme image principale avec ce rapport.",
  "modal.offline":
    "Hors ligne ou échec de l’IA — remplissez le formulaire manuellement.",
  "modal.cancel": "Annuler",
  "modal.close": "Fermer",
  "modal.save": "Enregistrer le signalement",
  "modal.submit": "Envoyer le signalement",
  "modal.triage_no":
    "Cela ne ressemble pas à un cas 311 typique. L’envoi est désactivé pour ce brouillon.",
  "modal.triage_yes":
    "Cela semble être un problème sur lequel Philadelphia 311 peut agir. Vérifiez les détails, puis envoyez si c’est exact.",
  "detail.title": "Votre signalement",
  "detail.close": "Fermer",
  "detail.edit": "Modifier",
  "detail.submit": "Envoyer",
  "detail.delete": "Supprimer",
  "detail.ai_low": " · IA : faible priorité pour le 311",
  "detail.no_photos": "Aucune photo jointe.",
  "toast.mic_settings": "Activez le micro dans Réglages pour enregistrer.",
  "toast.mic_unsupported":
    "La voix nécessite l’app ou un navigateur compatible avec l’enregistrement.",
  "toast.mic_denied": "Impossible d’accéder au micro.",
  "toast.loc_settings": "Activez la position dans Réglages pour utiliser ceci.",
  "toast.loc_unavail": "La position n’est pas disponible sur cet appareil.",
  "toast.loc_read": "Impossible de lire votre position.",
  "toast.loc_perm": "Position introuvable. Vérifiez les autorisations.",
  "toast.submitted_demo":
    "Envoyé au 311 — en attente jusqu’au traitement par la ville.",
  "toast.submitted_local":
    "Envoyé sur cet appareil. Définissez FLICK_311_DEMO_URL dans .env et redémarrez Expo pour le tableau de bord démo.",
  "toast.saved_demo": "Enregistré. Tableau de bord démo mis à jour.",
  "toast.saved": "Signalement enregistré sur cet appareil.",
  "toast.app_settings": "Ouverture des réglages système…",
  "toast.data_cleared": "Données locales effacées.",
  "modal.triage_prefix": "Utile à envoyer : ",
  "field.required": "Obligatoire",
  "field.optional": "Facultatif",
  "field.select_ph": "Choisir…",
  "field.optional_dash": "—",
  "map.legend_title": "Légende",
  "map.legend_region": "Légende de la carte",
  "map.legend_user_pending": "Votre signalement — en attente",
  "map.legend_user_done": "Votre signalement — terminé",
  "map.legend_city_open": "Données 311 de Philadelphie — en attente",
  "map.legend_city_closed": "Données 311 de Philadelphie — terminé",
  "map.locate_aria": "Aller à ma position",
  "map.filters_aria": "Filtres de la carte",
  "detail.submit311": "Envoyer au 311",
  "detail.row_category": "Catégorie",
  "detail.row_description": "Description",
  "detail.row_location": "Lieu",
  "detail.row_ai_note": "Note IA",
  "detail.photo_alt": "Photo du signalement",
  "detail.voice_aria": "Note vocale",
  "status.completed": "Terminé",
  "status.pending": "En attente",
  "status.submitted": "Envoyé",
  "status.saved": "Enregistré",
  "home.no_location": "Aucune adresse",
  "home.ai_low_flag": "IA : faible priorité",
  "home.no_image": "Aucune image",
  "slot.remove_aria": "Retirer la photo",
  "slot.photo": "Photo {n}",
  "confirm.clear_title": "Effacer toutes les données",
  "confirm.clear_message":
    "Supprimer tous les signalements enregistrés et les réglages sur cet appareil ?",
  "confirm.delete_all": "Tout supprimer",
  "confirm.delete_title": "Supprimer",
  "confirm.delete_message":
    "Supprimer ce signalement ? Cette action est irréversible.",
  "confirm.delete": "Supprimer",
  "confirm.default": "Confirmer",
  "app.ok": "OK",
  "val.location": "L’adresse (lieu) est obligatoire.",
  "val.description": "La description est obligatoire pour ce type de demande.",
  "val.field": "Remplissez le champ obligatoire : {field}.",
  "toast.analyzing": "Analyse par l’IA…",
  "toast.camera_not_ready":
    "Caméra indisponible. Vérifiez les autorisations ou utilisez la galerie.",
  "toast.need_media":
    "Ajoutez au moins une photo ou une note vocale pour générer un rapport.",
  "toast.slots_partial":
    "Seulement {n} emplacement(s) vide(s) ; fichiers supplémentaires ignorés.",
  "toast.demo_unreachable":
    "Impossible d’atteindre le serveur démo 311. Même Wi‑Fi ? Vérifiez FLICK_311_DEMO_URL et lancez npm run 311-demo.",
  "toast.concern_not_found": "Signalement introuvable.",
  "toast.completed_no_edit":
    "Ce signalement est terminé — il ne peut pas être modifié.",
  "toast.deleted": "Signalement supprimé.",
  "toast.slots_full": "Les 5 emplacements photo sont pleins.",
};

// Remaining languages: load from sibling file if present (optional override)
var ja, zh, hi, ar, bn;
try {
  ({
    ja,
    zh,
    hi,
    ar,
    bn,
  } = require("./gen-locale-rows-langs.cjs"));
} catch (e) {
  console.error("Missing gen-locale-rows-langs.cjs — run after creating it");
  process.exit(1);
}

const maps = { fr, ja, zh, hi, ar, bn };
names.forEach(function (name, ci) {
  var slice = chunks[ci];
  var rows = slice.map(function (key) {
    return [
      key,
      maps.fr[key] || "",
      maps.ja[key] || "",
      maps.zh[key] || "",
      maps.hi[key] || "",
      maps.ar[key] || "",
      maps.bn[key] || "",
    ];
  });
  var body = rows
    .map(function (r) {
      return "  [" + r.map(JSON.stringify).join(", ") + "]";
    })
    .join(",\n");
  fs.writeFileSync(
    path.join(__dirname, "locale-rows-" + name + ".cjs"),
    '"use strict";\nmodule.exports = [\n' + body + "\n];\n",
    "utf8"
  );
});
console.log("Wrote locale-rows-a/b/c.cjs");
