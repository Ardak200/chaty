import { configDotenv } from "dotenv";
configDotenv();
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { conversationsRouter } from "./routes/conversations.js";
import { messagesRouter } from "./routes/messages.js";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { setupSocket } from "./socket/index.js";
import { usersRouter } from "./routes/users.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const port = process.env.PORT;

connectDB();

const server = express();

server.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
server.use(express.json());
server.use(morgan("dev"));
server.use(cookieParser());

server.get("/", (_req, res) => {
  res.json({ message: "Server is up and running" });
});

server.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
server.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

server.use("/auth", authRouter);
server.use("/conversations", conversationsRouter);
server.use("/messages", messagesRouter);
server.use("/users", usersRouter);

server.use(errorHandler);

const httpServer = createServer(server);
setupSocket(httpServer);
httpServer.listen(port, () =>
  console.log(`Server has started on port ${port}`),
);
