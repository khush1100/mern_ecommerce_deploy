import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";
import path from "path";
// configure env
dotenv.config();

// database config
connectDB();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); //just tells ypu about the request is succesffull or not in the console
app.use(express.static(path.join(__dirname, "./client/build")));

// routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// app.get("/", (req, res) => {
//   res.send({
//     message: "welcome to ecom app",
//   });
// });

app.use("*", function (req, res) {
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(
    `server is running on ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
      .white
  );
});
