require("dotenv").config();
const express = require("express");
const { sequelize } = require("./models");
const startBot = require("./bot/bot");

const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const chatRoutes = require("./routes/chat.routes");
const pageRoutes = require("./routes/page.routes");

const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // buat baca body dari form HTML

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chat", chatRoutes);
app.use("/", pageRoutes);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Koneksi database berhasil");

    await sequelize.sync();
    console.log("Sync model selesai");

    // Express (halaman web tempat user belanja) dan bot Telegram (khusus
    // admin) jalan BARENG dalam 1 process, sama-sama manggil service
    // layer yang sama (liat services/)
    app.listen(PORT, () => {
      console.log(`Server web jalan di http://localhost:${PORT}`);
    });

    startBot();
  } catch (err) {
    console.error("Gagal konek ke database:", err.message);
  }
}

start();
