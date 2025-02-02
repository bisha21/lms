import { createConnection } from "@/database/db";
import { createCategory, getAllCategory } from "./category.controller";

export async function POST(req: Request) {
    return createCategory(req);
}

export async function GET() {
    await createConnection();
    return getAllCategory();
}
