require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";

if (!apiKey || apiKey === "isi-api-key-kamu-disini") {
  console.warn(
    "⚠️  GEMINI_API_KEY belum diset di .env, fitur chat AI di halaman web gak aktif",
  );
}

const genAI =
  apiKey && apiKey !== "isi-api-key-kamu-disini"
    ? new GoogleGenerativeAI(apiKey)
    : null;
const MODEL_NAME = model;

module.exports = { genAI, MODEL_NAME };
