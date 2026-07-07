import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import './Table.css'

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Wrap in a scroll container with a sticky header. */
  stickyHeader?: boolean
  /** Constrain the scroll container height (enables vertical scroll). */
  maxHeight?: number | string
  containerClassName?: string
}

export function Table({
  stickyHeader = false,
  maxHeight,
  containerClassName = '',
  className = '',
  children,
  ...rest
}: TableProps) {
  return (
    <div
      className={`fk-table-scroll ${stickyHeader ? 'is-sticky' : ''} ${containerClassName}`.trim()}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      <table className={`fk-table ${className}`.trim()} {...rest}>
        {children}
      </table>
    </div>
  )
}

export function THead({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...rest}>{children}</thead>
}

export function TBody({ children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...rest}>{children}</tbody>
}

export interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  /** Highlight the row (hover/selected accent bar). */
  active?: boolean
  muted?: boolean
}
export function Tr({ active, muted, className = '', children, ...rest }: TrProps) {
  const classes = [active ? 'is-active' : '', muted ? 'is-muted' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <tr className={classes || undefined} {...rest}>
      {children}
    </tr>
  )
}

export interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  sortDirection?: 'asc' | 'desc' | null
}
export function Th({
  align = 'left',
  sortable = false,
  sortDirection = null,
  className = '',
  children,
  ...rest
}: ThProps) {
  const sortLabel = { asc: 'ascending', desc: 'descending' } as const
  let ariaSort: 'ascending' | 'descending' | 'none' | undefined
  if (sortable) ariaSort = sortDirection ? sortLabel[sortDirection] : 'none'
  return (
    <th
      className={`fk-th ${sortable ? 'is-sortable' : ''} ${className}`.trim()}
      style={{ textAlign: align }}
      aria-sort={ariaSort}
      {...rest}
    >
      {children}
    </th>
  )
}

export interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right' | 'center'
  mono?: boolean
}
export function Td({ align = 'left', mono = false, className = '', children, ...rest }: TdProps) {
  return (
    <td
      className={`fk-td ${mono ? 'fk-mono' : ''} ${className}`.trim()}
      style={{ textAlign: align }}
      {...rest}
    >
      {children}
    </td>
  )
}
