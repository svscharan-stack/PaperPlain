import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { SamplePaperMeta } from "../types/paper.ts";

interface SamplePaperDefinition {
  meta: SamplePaperMeta;
  title: string;
  authors: string;
  year: string;
  paragraphs: { heading: string; body: string }[];
}

const SAMPLE_DEFINITIONS: SamplePaperDefinition[] = [
  {
    meta: {
      id: "solar-microgrids",
      shortTitle: "Solar Microgrids for Rural Schools",
      topic: "Clean Energy & Education",
      pageCount: 2,
    },
    title:
      "Community-Managed Solar Microgrids for Off-Grid Rural Secondary Schools: A Three-Year Field Evaluation",
    authors: "Ananya Rao, David Mensah, and Clara Lindqvist (2024)",
    year: "2024",
    paragraphs: [
      {
        heading: "Abstract",
        body: "Millions of rural secondary schools lack reliable grid electricity, limiting evening study hours, digital classroom tools, and laboratory refrigeration. This study evaluates whether small solar microgrids co-managed by local school committees and trained youth technicians provide dependable power at lower long-term cost than diesel generators.",
      },
      {
        heading: "1. Introduction and Problem Statement",
        body: "Across sub-Saharan rural districts, grid extensions often stall because transmission lines are expensive to build over long distances with low daytime demand. Many schools rely on small diesel generators, which suffer from high fuel costs, loud noise near classrooms, and frequent mechanical breakdowns. Without dependable lighting and power, evening exam preparation drops sharply and science laboratories cannot run basic equipment.",
      },
      {
        heading: "2. Proposed Method",
        body: "We designed a modular 8 kW rooftop solar array paired with lithium-iron-phosphate battery banks and smart prepaid meters. Instead of relying on distant private contractors for maintenance, two recent graduates from each village completed a three-week hands-on repair course and received diagnostic tablet tools. School parent committees collected small monthly community fees from nearby shops that bought surplus daytime electricity.",
      },
      {
        heading: "3. Field Dataset",
        body: "Data were collected over 36 months across 18 rural secondary schools in northern Ghana and western Kenya (total 6,420 students). Continuous 15-minute telemetry recorded solar generation, battery state of charge, outages, and diesel usage. Pre- and post-intervention school attendance logs and national science exam pass rates were compared against 12 matched control schools still using diesel generators.",
      },
      {
        heading: "4. Empirical Results",
        body: "Microgrid schools achieved 98.4% power uptime during school and evening study hours, compared to 61.0% uptime in diesel control schools. Annual energy operating costs dropped by 64% after accounting for battery upkeep. Evening library attendance doubled, and average national science exam pass rates rose by 11.3 percentage points over three years. Selling surplus daytime power to 42 local small businesses covered 78% of routine maintenance costs.",
      },
      {
        heading: "5. Limitations and Future Work",
        body: "Heavy monsoon cloud cover for five consecutive days still reduced available evening power in two coastal sites, requiring rationing of computer lab hours. Additionally, three trained youth technicians migrated to cities for higher-paying jobs during year two, leaving temporary repair delays until replacements were trained. Future deployments should budget for backup technician stipends and larger battery reserves in cloud-prone valleys.",
      },
    ],
  },
  {
    meta: {
      id: "spaced-repetition",
      shortTitle: "Spaced Review vs. Cramming in Biology",
      topic: "Student Learning Science",
      pageCount: 2,
    },
    title:
      "Adaptive Spaced Retrieval Schedules Versus Massed Review in Introductory University Biology Courses",
    authors: "Marcus Vance, Sofia Alvarez, and Mei-Ling Zhou (2025)",
    year: "2025",
    paragraphs: [
      {
        heading: "Abstract",
        body: "Undergraduate students frequently rely on massed review (cramming) before major exams, leading to rapid forgetting afterward. We test whether a lightweight adaptive spaced-retrieval schedule integrated into weekly homework improves both final exam performance and three-month knowledge retention without increasing total weekly study time.",
      },
      {
        heading: "1. Introduction and Problem Statement",
        body: "Introductory biology requires students to remember hundreds of interconnected concepts, from cellular respiration pathways to genetics terminology. Surveys show over 70% of first-year students reread notes in long sessions the night before midterms. While cramming can produce short-term familiarity, cognitive science suggests memory decays steeply within two weeks, leaving students unprepared for cumulative finals and advanced courses.",
      },
      {
        heading: "2. Experimental Method",
        body: "We built a simple flashcard and short-answer quiz scheduler inside the course website. Whenever a student answered a question correctly, the system waited longer before showing that topic again (first 2 days, then 6 days, then 14 days). If the student missed a question, the topic returned the next day with a short hint. Total practice was capped at 20 minutes, three times per week, so students did not spend extra hours studying.",
      },
      {
        heading: "3. Study Dataset",
        body: "The randomized trial followed 480 first-year biology undergraduates across four lecture sections at two public universities during one 15-week semester. Half of the students (240) used the adaptive spaced schedule, while the other half (240) received the exact same practice questions grouped into single-week cramming blocks before each exam. Both groups completed unannounced retention quizzes 90 days after the semester ended.",
      },
      {
        heading: "4. Key Findings and Results",
        body: "Both groups spent nearly identical total study time (4.2 vs. 4.3 hours per week). On the cumulative final exam, students using spaced retrieval scored an average of 84.6%, compared to 74.2% for the cramming group. The largest gap appeared 90 days later: the spaced group retained 79% of core concepts, whereas the cramming group dropped to 48%. Students who started with lower high-school science grades gained the biggest boost (+14 points).",
      },
      {
        heading: "5. Limitations",
        body: "All participants were enrolled in introductory multiple-choice and short-answer biology, so results may differ for essay-heavy humanities classes or lab-skills exams. Also, about 14% of students in the spaced group skipped sessions during midterm week, reducing their final score advantage. Future versions could send gentle calendar reminders and test open-ended problem solving.",
      },
    ],
  },
];

const cachedSamplePdfs = new Map<string, Buffer>();

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxChars) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function generateSamplePdfBuffer(def: SamplePaperDefinition): Promise<Buffer> {
  const existing = cachedSamplePdfs.get(def.meta.id);
  if (existing) return existing;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(def.title);
  pdfDoc.setAuthor(def.authors);

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const marginX = 56;
  const marginBottom = 56;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - 60;

  const ensureSpace = (needed: number) => {
    if (y - needed < marginBottom) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 60;
    }
  };

  // Title
  const titleLines = wrapText(def.title, 62);
  for (const line of titleLines) {
    ensureSpace(22);
    page.drawText(line, {
      x: marginX,
      y,
      size: 15,
      font: fontBold,
      color: rgb(0.08, 0.1, 0.16),
    });
    y -= 20;
  }

  y -= 4;
  page.drawText(def.authors, {
    x: marginX,
    y,
    size: 10.5,
    font: fontRegular,
    color: rgb(0.32, 0.36, 0.44),
  });
  y -= 24;

  // Sections
  for (const section of def.paragraphs) {
    ensureSpace(36);
    page.drawText(section.heading, {
      x: marginX,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.11, 0.25, 0.58),
    });
    y -= 16;

    const bodyLines = wrapText(section.body, 82);
    for (const line of bodyLines) {
      ensureSpace(15);
      page.drawText(line, {
        x: marginX,
        y,
        size: 10.5,
        font: fontRegular,
        color: rgb(0.15, 0.18, 0.22),
      });
      y -= 14.5;
    }
    y -= 10;
  }

  const bytes = await pdfDoc.save();
  const buffer = Buffer.from(bytes);
  cachedSamplePdfs.set(def.meta.id, buffer);
  return buffer;
}

export function listSamplePapers(): SamplePaperMeta[] {
  return SAMPLE_DEFINITIONS.map((d) => d.meta);
}

export async function getSamplePaperPdf(
  sampleId: string
): Promise<{ fileName: string; buffer: Buffer; pageCount: number } | null> {
  const def = SAMPLE_DEFINITIONS.find((d) => d.meta.id === sampleId);
  if (!def) return null;

  const buffer = await generateSamplePdfBuffer(def);
  return {
    fileName: `${def.meta.id}.pdf`,
    buffer,
    pageCount: def.meta.pageCount,
  };
}
