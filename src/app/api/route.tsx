import { createConnection } from "@/database/db";

export const GET = async () => {
  try {
    await createConnection(); // Assuming createConnection is asynchronous
    return new Response("Database connected", { status: 200 });
  } catch (error) {
    console.error("Error connecting to the database:", error);
    return new Response("Failed to connect to the database", { status: 500 });
  }
};
