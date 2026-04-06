import { configDotenv } from "dotenv";
configDotenv();
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { connectDB } from "./config/db";
import { authRouter } from "./routes/auth";
import { errorHandler } from "./middleware/errorHandler";
import { conversationsRouter } from "./routes/conversations";
import { messagesRouter } from "./routes/messages";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { setupSocket } from "./socket";
import { usersRouter } from "./routes/users";

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
