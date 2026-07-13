import { Injectable } from '@angular/core';
import { TajweedAnnotation } from '../models/api.models';

export interface TajweedRuleInfo {
  key: string;
  nameEn: string;
  nameAr: string;
  color: string;
  cssClass: string;
}

@Injectable({ providedIn: 'root' })
export class TajweedService {
  /** All known Tajweed rules with metadata */
  readonly rules: TajweedRuleInfo[] = [
    { key: 'ghunnah', nameEn: 'Ghunnah', nameAr: 'غنّة', color: '#1fa848', cssClass: 'tj-ghunnah' },
    { key: 'ikhafa', nameEn: 'Ikhfa', nameAr: 'إخفاء', color: '#d4a017', cssClass: 'tj-ikhafa' },
    { key: 'ikhafa_shafawi', nameEn: 'Ikhfa Shafawi', nameAr: 'إخفاء شفوي', color: '#c8a415', cssClass: 'tj-ikhafa-shafawi' },
    { key: 'idgham_ghunnah', nameEn: 'Idghaam (Ghunnah)', nameAr: 'إدغام بغنّة', color: '#9b59b6', cssClass: 'tj-idgham-ghunnah' },
    { key: 'idgham_wo_ghunnah', nameEn: 'Idghaam (No Ghunnah)', nameAr: 'إدغام بلا غنّة', color: '#3498db', cssClass: 'tj-idgham-wo-ghunnah' },
    { key: 'idgham_shafawi', nameEn: 'Idghaam Shafawi', nameAr: 'إدغام شفوي', color: '#8e44ad', cssClass: 'tj-idgham-shafawi' },
    { key: 'idgham_mutajanisain', nameEn: 'Idghaam Mutajaanisain', nameAr: 'إدغام متجانسين', color: '#6c3483', cssClass: 'tj-idgham-mutajanisain' },
    { key: 'idgham_mutaqaribain', nameEn: 'Idghaam Mutaqaaribain', nameAr: 'إدغام متقاربين', color: '#5b2c6f', cssClass: 'tj-idgham-mutaqaribain' },
    { key: 'iqlab', nameEn: 'Iqlab', nameAr: 'إقلاب', color: '#1abc9c', cssClass: 'tj-iqlab' },
    { key: 'qalaqah', nameEn: 'Qalqalah', nameAr: 'قلقلة', color: '#c0392b', cssClass: 'tj-qalaqah' },
    { key: 'madda_normal', nameEn: 'Madd Tabee\'i', nameAr: 'مد طبيعي', color: '#2980b9', cssClass: 'tj-madda-normal' },
    { key: 'madda_permissible', nameEn: 'Madd \'Aarid', nameAr: 'مد عارض للسكون', color: '#e67e22', cssClass: 'tj-madda-permissible' },
    { key: 'madda_obligatory', nameEn: 'Madd Muttasil', nameAr: 'مد متصل واجب', color: '#e74c3c', cssClass: 'tj-madda-obligatory' },
    { key: 'madda_necessary', nameEn: 'Madd Laazim', nameAr: 'مد لازم', color: '#c0392b', cssClass: 'tj-madda-necessary' },
    { key: 'ham_wasl', nameEn: 'Hamzat al-Wasl', nameAr: 'همزة وصل', color: '#7f8c8d', cssClass: 'tj-ham-wasl' },
    { key: 'laam_shamsiyah', nameEn: 'Lam Shamsiyyah', nameAr: 'لام شمسية', color: '#2c3e50', cssClass: 'tj-laam-shamsiyah' },
    { key: 'slnt', nameEn: 'Silent', nameAr: 'حرف ساكن', color: '#95a5a6', cssClass: 'tj-slnt' },
  ];

  private readonly ruleMap = new Map<string, TajweedRuleInfo>(
    this.rules.map(r => [r.key, r])
  );

  /** Get info for a specific rule key */
  getRuleInfo(key: string): TajweedRuleInfo | undefined {
    return this.ruleMap.get(key);
  }

  /** Get only the rules that appear in a given set of annotations */
  getActiveRules(annotations: TajweedAnnotation[]): TajweedRuleInfo[] {
    const activeKeys = new Set(annotations.map(a => a.rule));
    return this.rules.filter(r => activeKeys.has(r.key));
  }

  /**
   * Convert plain Arabic text + annotations into color-coded HTML.
   * Each annotation wraps the corresponding character range in a <span> with the Tajweed CSS class.
   * Overlapping annotations are handled by sorting and processing in order.
   */
  renderTajweedHtml(text: string, annotations: TajweedAnnotation[]): string {
    if (!annotations || annotations.length === 0) {
      return this.escapeHtml(text);
    }

    // Convert string to array of Unicode codepoints for accurate indexing
    const codepoints = Array.from(text);

    // Sort annotations by start index, then by end index descending for longer spans first
    const sorted = [...annotations].sort((a, b) => a.start - b.start || b.end - a.end);

    // Build a mapping: codepoint index -> CSS class
    const classMap = new Array<string | null>(codepoints.length).fill(null);

    for (const ann of sorted) {
      const info = this.ruleMap.get(ann.rule);
      if (!info) continue;

      // Clamp indices to valid range
      const start = Math.max(0, Math.min(ann.start, codepoints.length));
      const end = Math.min(ann.end, codepoints.length);

      for (let i = start; i < end; i++) {
        // Don't overwrite if already assigned (first rule wins for overlaps)
        if (classMap[i] === null) {
          classMap[i] = info.cssClass;
        }
      }
    }

    // Build HTML by grouping consecutive chars with the same class
    const parts: string[] = [];
    let currentClass: string | null | undefined = undefined;
    let buffer = '';

    for (let i = 0; i < codepoints.length; i++) {
      const cls = classMap[i];
      if (cls !== currentClass) {
        // Flush buffer
        if (buffer) {
          if (currentClass) {
            parts.push(`<span class="${currentClass}">${this.escapeHtml(buffer)}</span>`);
          } else {
            parts.push(this.escapeHtml(buffer));
          }
        }
        buffer = codepoints[i];
        currentClass = cls;
      } else {
        buffer += codepoints[i];
      }
    }

    // Flush remaining
    if (buffer) {
      if (currentClass) {
        parts.push(`<span class="${currentClass}">${this.escapeHtml(buffer)}</span>`);
      } else {
        parts.push(this.escapeHtml(buffer));
      }
    }

    return parts.join('');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
