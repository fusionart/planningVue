// src/types/datatables.d.ts
declare module 'datatables.net-vue3' {
  import { DefineComponent } from 'vue'
  
  interface DataTableColumn {
    title: string
    data: string | null
    render?: (data: any, type: string, row: any) => string
    orderable?: boolean
    searchable?: boolean
    className?: string
  }
  
  interface DataTableOptions {
    responsive?: boolean
    pageLength?: number
    lengthChange?: boolean
    lengthMenu?: number[]
    searching?: boolean
    ordering?: boolean
    info?: boolean
    autoWidth?: boolean
    language?: {
      search?: string
      lengthMenu?: string
      info?: string
      infoEmpty?: string
      infoFiltered?: string
      paginate?: {
        first?: string
        last?: string
        next?: string
        previous?: string
      }
    }
    drawCallback?: () => void
  }
  
  interface DataTableRef {
    dt: {
      clear: () => void
      rows: {
        add: (data: any[]) => void
      }
      draw: () => void
      row: (element: Element) => {
        data: () => any
      }
    }
  }
  
  const DataTable: DefineComponent<{
    data: any[]
    columns: DataTableColumn[]
    options: DataTableOptions
  }>
  
  export default DataTable
}

declare module 'datatables.net' {
  const DataTablesCore: any
  export default DataTablesCore
}