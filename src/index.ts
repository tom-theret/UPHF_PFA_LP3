import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import path from "path";
import fs from "fs";
import util from "util";
import { initializeCaptionner, generateCaption } from "./utils/ai";

// Promisify fs methods for async/await
const writeFile = util.promisify(fs.writeFile);

const app = Fastify({ logger: true });

app.register(fastifyMultipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5 Mo pour les fichiers
  },
});

// Dossier pour sauvegarder les images
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

app.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});

app.get("/", async (request, reply) => {
  return reply.sendFile("index.html");
});

// Route pour servir le CSS
app.get('/index.css', (req, reply) => {
  reply.sendFile('index.css');
});

// Route pour uploader une image
app.post("/upload", async (request, reply) => {
  // Obtenir le fichier de la requête
  const data = await request.file();
  if (!data) {
    reply.code(400).send({ error: "Aucun fichier reçu." });
    return;
  }

  // Vérifier le type de fichier (ex: uniquement des images)
  const validTypes = ["image/jpeg", "image/png", "image/gif"];
  if (!validTypes.includes(data.mimetype)) {
    reply.code(400).send({ error: "Type de fichier non pris en charge." });
    return;
  }

  // Générer un nom de fichier unique
  const filename = `${Date.now()}-${data.filename}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  // Sauvegarder le fichier
  await writeFile(filePath, await data.toBuffer());

  // Passer le bon chemin à generateCaption
  const output = await generateCaption(filePath);

  // Supprimer le fichier après utilisation
  await fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Erreur lors de la suppression du fichier", err);
    }
  });


  console.log(JSON.stringify(output));

  // Répondre avec succès
  reply.code(200).send({ caption: output });
});

app.listen({ port: 3000 }, async (address) => {
  try {
    await initializeCaptionner();
    app.log.info(`Server is running at ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
});
