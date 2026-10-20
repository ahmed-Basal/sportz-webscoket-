import { SQL, and, or, eq, gte, gt, lte, lt, ilike, asc, desc, type Column } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

export interface PaginationResult {
  currentPage: number;
  limit: number;
  totalDocuments?: number;
  numberOfPages?: number;
  next?: number;
  prev?: number;
}

export interface ParsedSort {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * ApiFeatures for PostgreSQL & Drizzle ORM
 * Handles Filtering, Sorting, Field Limiting, Searching, and Pagination without Mongoose.
 */
export class ApiFeatures<TTable extends PgTable = PgTable> {
  public queryString: Record<string, any>;
  public paginationResult: PaginationResult;
  public filters: Record<string, any> = {};
  public sortFields: ParsedSort[] = [];
  public selectedFields: string[] = [];
  public searchKeyword: string = '';
  public page: number = 1;
  public limitCount: number = 20;
  public skipCount: number = 0;

  constructor(queryString: Record<string, any> = {}) {
    this.queryString = queryString;
    this.paginationResult = { currentPage: 1, limit: 20 };
  }

  // 1) FILTERING: Removes query parameters that are reserved keywords (page, sort, limit, fields, keyword)
  filter(): this {
    const queryObj = { ...this.queryString };
    const reserved = ['page', 'limit', 'sort', 'fields', 'keyword'];
    reserved.forEach((key) => delete queryObj[key]);

    this.filters = queryObj;
    return this;
  }

  // 2) SORTING: Parses "sort=-createdAt,homeScore" into [{ field: 'createdAt', order: 'desc' }]
  sort(defaultSort: string = '-createdAt'): this {
    const rawSort = this.queryString.sort || defaultSort;
    const parts = String(rawSort).split(',');

    this.sortFields = parts.map((part) => {
      const trimmed = part.trim();
      if (trimmed.startsWith('-')) {
        return { field: trimmed.substring(1), order: 'desc' as const };
      }
      return { field: trimmed, order: 'asc' as const };
    });

    return this;
  }

  // 3) FIELD LIMITING: Parses "fields=id,homeTeam,awayTeam"
  limitFields(): this {
    if (this.queryString.fields) {
      this.selectedFields = String(this.queryString.fields)
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
    }
    return this;
  }

  // 4) SEARCH: Extracts keyword string for searching
  search(): this {
    if (this.queryString.keyword) {
      this.searchKeyword = String(this.queryString.keyword).trim();
    }
    return this;
  }

  // 5) PAGINATION: Calculates page, limit, offset, and navigation metadata
  paginate(totalDocuments?: number): this {
    this.page = Math.max(1, Number(this.queryString.page) || 1);
    this.limitCount = Math.max(1, Number(this.queryString.limit) || 20);
    this.skipCount = (this.page - 1) * this.limitCount;

    const pagination: PaginationResult = {
      currentPage: this.page,
      limit: this.limitCount,
    };

    if (totalDocuments !== undefined) {
      pagination.totalDocuments = totalDocuments;
      pagination.numberOfPages = Math.ceil(totalDocuments / this.limitCount);

      if (this.page * this.limitCount < totalDocuments) {
        pagination.next = this.page + 1;
      }
      if (this.skipCount > 0) {
        pagination.prev = this.page - 1;
      }
    }

    this.paginationResult = pagination;
    return this;
  }

  // Builds Drizzle Relational Query parameters: { limit, offset, where, orderBy }
  getDrizzleQueryOptions(tableColumns: Record<string, Column<any>>): {
    limit: number;
    offset: number;
    orderBy: SQL<unknown>[];
    where?: SQL<unknown>;
  } {
    const whereConditions: SQL<unknown>[] = [];

    // Apply Filter conditions
    for (const [key, value] of Object.entries(this.filters)) {
      const col = tableColumns[key];
      if (col && value !== undefined && value !== '') {
        whereConditions.push(eq(col, value));
      }
    }

    // Apply Search keyword
    if (this.searchKeyword) {
      const searchConditions: SQL<unknown>[] = [];
      for (const col of Object.values(tableColumns)) {
        if (col.dataType === 'string') {
          searchConditions.push(ilike(col, `%${this.searchKeyword}%`));
        }
      }
      if (searchConditions.length > 0) {
        whereConditions.push(or(...searchConditions)!);
      }
    }

    // Apply OrderBy
    const orderByList: SQL<unknown>[] = [];
    for (const { field, order } of this.sortFields) {
      const col = tableColumns[field];
      if (col) {
        orderByList.push(order === 'desc' ? desc(col) : asc(col));
      }
    }

    return {
      limit: this.limitCount,
      offset: this.skipCount,
      orderBy: orderByList,
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    };
  }
}
