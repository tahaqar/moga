import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح لك برفع الملفات" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "لم يتم تحديد أي ملف" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize file name
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${timestamp}_${sanitizedName}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFileName);
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileMimeType: file.type || "application/octet-stream",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "فشل رفع الملف إلى الخادم" }, { status: 500 });
  }
}
