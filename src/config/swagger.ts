import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Chaty Backend API",
      version: "1.0.0",
      description:
        "REST API for the Chaty messaging app. Covers authentication, " +
        "users, conversations, and messages. Real-time events are documented " +
        "separately in SOCKET.md.",
    },
    servers: [
      {
        url: "http://localhost:{port}",
        variables: { port: { default: process.env.PORT ?? "5001" } },
      },
    ],
    tags: [
      { name: "Auth", description: "Registration, login, refresh, logout, current user" },
      { name: "Users", description: "User search and avatar upload" },
      { name: "Conversations", description: "Direct and group conversations" },
      { name: "Messages", description: "Message CRUD and read receipts" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Pass the access token returned by /auth/login or /auth/register " +
            "as `Authorization: Bearer <token>`. The server also accepts the " +
            "`accessToken` HTTP-only cookie set by those endpoints.",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "HTTP-only access token cookie set on login/register/refresh.",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "67120a3e1c2d8e5f4a9b1234" },
            username: { type: "string", example: "alice" },
            email: { type: "string", format: "email", example: "alice@example.com" },
            avatar: {
              type: "string",
              format: "uri",
              nullable: true,
              example: "https://chaty.s3.eu-central-1.amazonaws.com/avatars/...",
            },
          },
          required: ["id", "username", "email"],
        },
        Conversation: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67120b1f1c2d8e5f4a9b5678" },
            type: { type: "string", enum: ["direct", "group"] },
            name: { type: "string", nullable: true, example: "Project team" },
            participants: {
              type: "array",
              items: { $ref: "#/components/schemas/User" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["_id", "type", "participants"],
        },
        Message: {
          type: "object",
          properties: {
            _id: { type: "string", example: "67120c4d1c2d8e5f4a9b9abc" },
            conversationId: { type: "string", example: "67120b1f1c2d8e5f4a9b5678" },
            sender: {
              oneOf: [
                { type: "string", description: "User id" },
                { $ref: "#/components/schemas/User" },
              ],
            },
            content: { type: "string", example: "Hey there!" },
            read: { type: "boolean", example: false },
            isEdited: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["_id", "conversationId", "sender", "content"],
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Bad request" },
          },
        },
        AuthSuccess: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                token: {
                  type: "string",
                  description: "JWT access token (15 min lifetime)",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }, { cookieAuth: [] }],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
