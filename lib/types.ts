export type ApplicationStatus = "pass" | "review" | "fail";

export interface WarningStatus {
  capital: boolean;
  bold: boolean;
  spelling: boolean;
}

export interface ApplicationResult {
  id: string;
  filename: string;
  pdfUrl?: string;
  brandName: string;
  brandNameConfidence: number;
  classType: string;
  alcoholContent: string;
  netContent: string;
  producer: string;
  sourceOfProduct: string;
  governmentWarning: WarningStatus;
  status: ApplicationStatus;
  verification: {
    brandName: boolean;
    alcoholContent: boolean;
  };
}
