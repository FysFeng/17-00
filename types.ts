export enum NewsType {
  LAUNCH = "New Car Launch",
  POLICY = "Policy & Regulation",
  SALES = "Market Sales",
  PERSONNEL = "Personnel Changes",
  COMPETITOR = "Competitor Dynamics",
  OTHER = "Other"
}

export interface NewsItem {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  title: string;
  summary: string;
  type: NewsType;
  brand: string;
  source: string;
  image: string;
  url: string;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  selectedBrands: string[];
  selectedTypes: NewsType[];
  searchQuery: string;
}