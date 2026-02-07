export enum AnalysisStatus {
    Güvenli = 'Güvenli',
    Şüpheli = 'Şüpheli',
    Tehlikeli = 'Tehlikeli',
  }
  
  export interface TriggeredRule {
    rule: string;
    description: string;
    points: number;
    rationale: string;
  }
  
  export interface AnalysisResult {
    risk_score: number;
    status: AnalysisStatus;
    rules_triggered: TriggeredRule[];
  }