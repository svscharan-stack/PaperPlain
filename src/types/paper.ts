export interface TakeawayItem {
  heading: string;
  detail: string;
}

export interface PaperSummarySections {
  problem: string;
  method: string;
  dataset: string;
  results: string;
  limitations: string;
}

export interface PaperSummaryData {
  title: string;
  authors: string[];
  year: string;
  oneLineOverview: string;
  sections: PaperSummarySections;
  keyTakeaways: TakeawayItem[];
  readingTimeMinutes: number;
}

export interface SummarizedPaperRecord {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  createdAt: string;
  summary: PaperSummaryData;
}

export interface SamplePaperMeta {
  id: string;
  shortTitle: string;
  topic: string;
  pageCount: number;
}
