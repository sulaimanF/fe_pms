import { ColumnDef, Table, Row } from "@tanstack/react-table";
import { ReactNode } from "react";

/**
 * Props untuk komponen utama DataTables
 */
export interface DataTableProps<TData> {
  /**
   * Instance TanStack Table
   */
  table: Table<TData>;

  /**
   * Header
   */
  title?: string;
  description?: string;
  actions?: ReactNode;

  /**
   * Toolbar
   */
  toolbar?: ReactNode;

  /**
   * Footer
   */
  footer?: ReactNode;

  /**
   * Loading State
   */
  loading?: boolean;

  /**
   * Menampilkan pagination
   */
  pagination?: boolean;

  headerClassName?: string;
}

/**
 * Header
 */
export interface DataTablesHeaderProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * Toolbar
 */
export interface DataTablesToolbarProps {
  children?: ReactNode;
}

/**
 * Search
 */
export interface DataTablesSearchProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

/**
 * Column Toggle
 */
export interface DataTablesColumnToggleProps<TData> {
  table: Table<TData>;
}

/**
 * Content
 */
export interface DataTablesContentProps<TData> {
  table: Table<TData>;
  headerClassName?: string;
}

/**
 * Footer
 */
export interface DataTablesFooterProps {
  footer?: ReactNode;
  children?: ReactNode;
}

/**
 * Pagination
 */
export interface DataTablesPaginationProps<TData> {
  table: Table<TData>;
}

/**
 * Empty State
 */
export interface DataTablesEmptyProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

/**
 * Loading State
 */
export interface DataTablesLoadingProps {
  rows?: number;
  columns?: number;
}

/**
 * Column Helper
 */
export type DataTableColumn<TData> = ColumnDef<TData>;

/**
 * Row Helper
 */
export type DataTableRow<TData> = Row<TData>;