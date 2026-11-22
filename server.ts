import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { PDFDocument } from "pdf-lib";
import { createServer as createViteServer } from "vite";
import { GeminiServiceError, summarizePaperWithGemini } from "./src/server/gemini.ts";
import { getSamplePaperPdf, listSamplePapers } from "./src/server/samples.ts";
import type { SummarizedPaperRecord } from "./src/types/paper.ts";

const PORT = Number(process.env.PORT) || 3000;
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = file.originalname.toLowerCase().endsWith(".pdf");
    if (isPdfMime || isPdfExt) {
      cb(null, true);
    } else {
      cb(new Error("Please upload a PDF file (.pdf)."));
    }
  },
});

async function parseAndSummarizeBuffer(
  buffer: Buffer,
  fileName: string
): Promise<SummarizedPaperRecord> {
  const headerSlice = buffer.subarray(0, Math.min(buffer.length, 1024)).toString("latin1");
  if (buffer.length < 5 || !headerSlice.includes("%PDF-")) {
    throw new GeminiServiceError("This file does not look like a valid PDF document.", 400);
  }

  let pdfLibPages: number | undefined;
  try {
    const pdfDoc = await PDFDocument.load(buffer, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
    });
    const count = pdfDoc.getPageCount();
    if (count > 0) {
      pdfLibPages = count;
    }
  } catch {
    // Some valid academic PDFs use XRef streams or features pdf-lib doesn't support;
    // unpdf (pdfjs-dist) and Gemini's PDF reader still handle them cleanly.
  }

  const { summary, pageCount } = await summarizePaperWithGemini(
    buffer,
    fileName,
    pdfLibPages
  );

  return {
    id: randomUUID(),
    fileName,
    fileSizeBytes: buffer.length,
    pageCount,
    createdAt: new Date().toISOString(),
    summary,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/samples", (_req, res) => {
    res.json({ samples: listSamplePapers() });
  });

  app.get("/api/samples/:id/pdf", async (req, res) => {
    try {
      const sample = await getSamplePaperPdf(req.params.id);
      if (!sample) {
        res.status(404).json({ error: "Sample paper not found." });
        return;
      }
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${sample.fileName}"`);
      res.send(sample.buffer);
    } catch {
      res.status(500).json({ error: "Could not load sample PDF." });
    }
  });

  app.post("/api/summarize-sample/:id", async (req, res) => {
    try {
      const sample = await getSamplePaperPdf(req.params.id);
      if (!sample) {
        res.status(404).json({ error: "Sample paper not found." });
        return;
      }
      const record = await parseAndSummarizeBuffer(sample.buffer, sample.fileName);
      res.json(record);
    } catch (error) {
      if (error instanceof GeminiServiceError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      const message = error instanceof Error ? error.message : "Failed to summarize sample paper.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/summarize", (req, res) => {
    upload.single("paper")(req, res, async (uploadErr) => {
      if (uploadErr) {
        const isSizeError =
          uploadErr instanceof multer.MulterError && uploadErr.code === "LIMIT_FILE_SIZE";
        res.status(400).json({
          error: isSizeError
            ? "This PDF is larger than 20 MB. Please upload a smaller PDF file."
            : uploadErr.message || "Could not upload the PDF file.",
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: "Please choose a PDF file to summarize." });
        return;
      }

      try {
        const record = await parseAndSummarizeBuffer(req.file.buffer, req.file.originalname);
        res.json(record);
      } catch (error) {
        if (error instanceof GeminiServiceError) {
          res.status(error.status).json({ error: error.message });
          return;
        }
        const message =
          error instanceof Error ? error.message : "Something went wrong while reading this PDF.";
        res.status(500).json({ error: message });
      }
    });
  });

  app.use("/api/*", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found." });
  });

  if (process.env.NODE_ENV !== "production") {
    const vitePromise = createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PaperPlain server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
