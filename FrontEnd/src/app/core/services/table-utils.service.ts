import { Injectable } from '@angular/core';

export type SortDirection = 'asc' | 'desc' | '';

export interface TableSort {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  pageSize: number;
  pageSizeOptions: number[];
  currentPage: number;
  totalItems: number;
}

@Injectable({
  providedIn: 'root'
})
export class TableUtilsService {
  
  /**
   * Ordena um array de objetos por uma coluna específica
   */
  sortData<T>(data: T[], column: string, direction: SortDirection): T[] {
    // Garantir que data seja um array
    if (!Array.isArray(data)) {
      console.warn('[TableUtils] sortData recebeu dados que não são um array:', data);
      return [];
    }
    if (!column || !direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, column);
      const bValue = this.getNestedValue(b, column);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Comparação numérica
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Comparação de datas
      if (aValue instanceof Date && bValue instanceof Date) {
        return direction === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Comparação de strings
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (direction === 'asc') {
        return aStr.localeCompare(bStr, 'pt-BR');
      } else {
        return bStr.localeCompare(aStr, 'pt-BR');
      }
    });
  }

  /**
   * Obtém valor aninhado de um objeto usando notação de ponto
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Alterna a direção de ordenação
   */
  toggleSort(currentSort: TableSort, column: string): TableSort {
    if (currentSort.column === column) {
      // Alterna: asc -> desc -> '' -> asc
      if (currentSort.direction === 'asc') {
        return { column, direction: 'desc' };
      } else if (currentSort.direction === 'desc') {
        return { column: '', direction: '' };
      }
    }
    return { column, direction: 'asc' };
  }

  /**
   * Pagina os dados
   */
  paginateData<T>(data: T[], page: number, pageSize: number): T[] {
    // Garantir que data seja um array
    if (!Array.isArray(data)) {
      console.warn('[TableUtils] paginateData recebeu dados que não são um array:', data);
      return [];
    }
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }

  /**
   * Calcula o total de páginas
   */
  calculateTotalPages(totalItems: number, pageSize: number): number {
    return Math.ceil(totalItems / pageSize) || 1;
  }
}

