import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface ResearchReport {
  id: string;
  query: string;
  createdAt: string;
  answer: string;
  confidence: number;
  sources: Array<{
    url: string;
    title: string;
    description: string;
    domain: string;
    logo?: string;
    color?: string;
  }>;
  evidence: Array<{
    id: string;
    title: string;
    claim: string;
    sourceUrl: string;
    sourceTitle: string;
    confidence: number;
  }>;
  images: string[];
  screenshots: Array<{
    url: string;
    screenshotUrl: string;
    title: string;
  }>;
  charts: Array<{
    type: 'bar' | 'line' | 'pie';
    title: string;
    data: Array<{ label: string; value: number }>;
  }>;
  summary: string;
  executive_report: string; // Markdown
  recommendedSearches?: string[];
}

/**
 * Storage helpers with transparent localStorage fallback
 */
export class ResearchStorage {
  private static LOCAL_STORAGE_KEY = 'nebula_research_history';

  static isUsingLocalStorage(): boolean {
    return !isSupabaseConfigured;
  }

  static async saveReport(report: ResearchReport): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('reports')
          .upsert({
            id: report.id,
            query: report.query,
            created_at: report.createdAt,
            data: report,
          });
        
        if (!error) return true;
        console.error('Supabase save failed, falling back to localStorage:', error);
      } catch (err) {
        console.error('Supabase save error, falling back to localStorage:', err);
      }
    }

    // Fallback: localStorage
    try {
      const history = this.getLocalHistory();
      const index = history.findIndex((r) => r.id === report.id);
      if (index >= 0) {
        history[index] = report;
      } else {
        history.unshift(report);
      }
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      return false;
    }
  }

  static async getReport(id: string): Promise<ResearchReport | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('data')
          .eq('id', id)
          .single();

        if (!error && data) {
          return data.data as ResearchReport;
        }
      } catch (err) {
        console.error('Supabase fetch error, checking localStorage:', err);
      }
    }

    // Fallback: localStorage
    const history = this.getLocalHistory();
    return history.find((r) => r.id === id) || null;
  }

  static async getHistory(): Promise<Array<{ id: string; query: string; createdAt: string; confidence: number }>> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('id, query, created_at, data->confidence')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            query: item.query,
            createdAt: item.created_at,
            confidence: item.confidence || 90,
          }));
        }
      } catch (err) {
        console.error('Supabase history error, checking localStorage:', err);
      }
    }

    // Fallback: localStorage
    return this.getLocalHistory().map((r) => ({
      id: r.id,
      query: r.query,
      createdAt: r.createdAt,
      confidence: r.confidence,
    }));
  }

  static async deleteReport(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('reports').delete().eq('id', id);
        if (!error) return true;
      } catch (err) {
        console.error('Supabase delete error:', err);
      }
    }

    try {
      const history = this.getLocalHistory();
      const filtered = history.filter((r) => r.id !== id);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      return false;
    }
  }

  private static getLocalHistory(): ResearchReport[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }
}
