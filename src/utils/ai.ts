import { Pipeline, pipeline } from "@huggingface/transformers";

// Déclaration de la variable captionner
let captionner: any;

// Fonction d'initialisation du modèle
async function initializeCaptionner() {
  try {
    captionner = await pipeline(
      "image-to-text",
      "Xenova/vit-gpt2-image-captioning"
    );
    console.log("Captionner initialisé avec succès");
  } catch (err) {
    console.error("Erreur lors de l'initialisation du captionner", err);
    process.exit(1);
  }
}

// Fonction pour générer une légende à partir d'une image
async function generateCaption(imagePath: string) {
  if (!captionner) {
    throw new Error("Le modèle captionner n'a pas été initialisé.");
  }
  try {
    const caption = await captionner(imagePath);
    return caption;
  } catch (err: any) {
    throw new Error(err);
  }
}

export { initializeCaptionner, generateCaption };