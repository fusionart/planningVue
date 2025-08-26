// useSalesOrdersTable.ts - Table-specific composable
import { ref, computed, watch, type Ref } from 'vue'
import type { SalesOrderMain, SalesOrderByDate } from '@/types/api'

export function useSalesOrdersTable(
  salesOrdersByDate: Ref<SalesOrderByDate[]>,
  currentPage: Ref<number>,
  rows: Ref<number>
) {
  // State
  const globalFilterValue = ref('')
  const selectedPlant = ref('All')
  const activeWeekTab = ref<string>('')
  const activeWeekIndex = ref<number>(0)
  const sortColumn = ref<string>('')
  const sortDirection = ref<'asc' | 'desc'>('asc')

  // Computed properties
  const sortedSalesOrdersByDate = computed(() => {
    if (!salesOrdersByDate.value.length) return []
    
    return [...salesOrdersByDate.value].sort((a, b) => {
      const parseWeek = (weekStr: string) => {
        const parts = weekStr.split('/')
        return {
          week: parseInt(parts[0]) || 0,
          year: parseInt(parts[1]) || 0
        }
      }
      
      const weekA = parseWeek(a.reqDlvWeek)
      const weekB = parseWeek(b.reqDlvWeek)
      
      if (weekA.year !== weekB.year) {
        return weekA.year - weekB.year
      }
      
      return weekA.week - weekB.week
    })
  })

  const activeWeekData = computed(() => {
    if (!sortedSalesOrdersByDate.value.length || !activeWeekTab.value) {
      return sortedSalesOrdersByDate.value[0] || null
    }
    return sortedSalesOrdersByDate.value.find(weekData => weekData.reqDlvWeek === activeWeekTab.value) || null
  })

  const dynamicColumnKeys = computed(() => {
    if (!activeWeekData.value) return []
    
    const allKeys = new Set<string>()
    
    activeWeekData.value.salesOrderMainList.forEach(order => {
      if (order.dynamicSoItems) {
        Object.keys(order.dynamicSoItems).forEach(key => {
          allKeys.add(key)
        })
      }
    })
    
    return Array.from(allKeys).sort()
  })

  const availablePlants = computed(() => {
    if (!activeWeekData.value) return []
    
    const plants = new Set<string>()
    activeWeekData.value.salesOrderMainList.forEach(order => {
      if (order.plant && order.plant.trim() !== '') {
        plants.add(order.plant.trim())
      }
    })
    
    return Array.from(plants).sort()
  })

  const sortedAndFilteredData = computed(() => {
    if (!activeWeekData.value) return []
    
    let data = [...activeWeekData.value.salesOrderMainList]
    
    // Apply plant filter
    if (selectedPlant.value !== 'All') {
      data = data.filter(order => order.plant === selectedPlant.value)
    }
    
    // Apply search filter
    if (globalFilterValue.value.trim()) {
      const search = globalFilterValue.value.toLowerCase()
      data = data.filter(order => 
        order.material.toLowerCase().includes(search) ||
        order.plant.toLowerCase().includes(search) ||
        order.requestedQuantityUnit.toLowerCase().includes(search) ||
        (order.dynamicSoItems && Object.values(order.dynamicSoItems).some(item => 
          item.plannedOrder?.toLowerCase().includes(search) ||
          item.productionOrder?.toLowerCase().includes(search)
        ))
      )
    }
    
    // Apply sorting
    if (sortColumn.value) {
      try {
        data = data.sort((a, b) => {
          let valueA: any = ''
          let valueB: any = ''
          
          if (sortColumn.value.startsWith('dynamic-')) {
            const parts = sortColumn.value.split('-')
            if (parts.length >= 3) {
              const key = parts[1]
              const field = parts[2]
              
              const itemA = a.dynamicSoItems?.[key]
              const itemB = b.dynamicSoItems?.[key]
              
              if (field === 'quantity') {
                valueA = Number(itemA?.quantity) || 0
                valueB = Number(itemB?.quantity) || 0
              } else if (field === 'plannedOrder') {
                valueA = itemA?.plannedOrder || ''
                valueB = itemB?.plannedOrder || ''
              } else if (field === 'productionOrder') {
                valueA = itemA?.productionOrder || ''
                valueB = itemB?.productionOrder || ''
              }
            }
          } else {
            switch (sortColumn.value) {
              case 'material':
                valueA = a.material || ''
                valueB = b.material || ''
                break
              case 'plant':
                valueA = a.plant || ''
                valueB = b.plant || ''
                break
              case 'requestedQuantity':
                valueA = Number(a.requestedQuantity) || 0
                valueB = Number(b.requestedQuantity) || 0
                break
              case 'toProduce':
                valueA = Number(a.toProduce) || 0
                valueB = Number(b.toProduce) || 0
                break
              case 'totalAvailableQuantity':
                valueA = Number(a.totalAvailableQuantity) || 0
                valueB = Number(b.totalAvailableQuantity) || 0
                break
              case 'cumulativeQuantity':
                valueA = Number(a.cumulativeQuantity) || 0
                valueB = Number(b.cumulativeQuantity) || 0
                break
              case 'availableNotCharged':
                valueA = Number(a.availableNotCharged) || 0
                valueB = Number(b.availableNotCharged) || 0
                break
              case 'availableCharged':
                valueA = Number(a.availableCharged) || 0
                valueB = Number(b.availableCharged) || 0
                break
              case 'finalBattery':
                valueA = Number(a.finalBattery) || 0
                valueB = Number(b.finalBattery) || 0
                break
              default:
                valueA = ''
                valueB = ''
            }
          }
          
          if (typeof valueA === 'number' && typeof valueB === 'number') {
            return sortDirection.value === 'asc' ? valueA - valueB : valueB - valueA
          } else {
            const strA = String(valueA).toLowerCase()
            const strB = String(valueB).toLowerCase()
            
            if (sortDirection.value === 'asc') {
              return strA < strB ? -1 : strA > strB ? 1 : 0
            } else {
              return strA > strB ? -1 : strA < strB ? 1 : 0
            }
          }
        })
      } catch (error) {
        console.error('Error in sorting:', error)
        return data
      }
    }
    
    return data
  })

  const totalRecords = computed(() => {
    return sortedAndFilteredData.value.length
  })

  const totalPages = computed(() => {
    if (totalRecords.value === 0) return 1
    return Math.ceil(totalRecords.value / rows.value)
  })

  const startIndex = computed(() => {
    return (currentPage.value - 1) * rows.value
  })

  const endIndex = computed(() => {
    const start = startIndex.value
    const end = start + rows.value
    return Math.min(end, totalRecords.value)
  })

  const paginatedData = computed(() => {
    const data = sortedAndFilteredData.value
    const start = startIndex.value
    const end = start + rows.value
    
    return data.slice(start, end)
  })

  const paginationDisplay = computed(() => {
    const start = startIndex.value
    const total = totalRecords.value
    const end = endIndex.value
    
    return {
      start: total === 0 ? 0 : start + 1,
      end: end,
      total: total,
      currentPage: currentPage.value,
      totalPages: totalPages.value
    }
  })

  const filteredDataLength = computed(() => {
    return sortedAndFilteredData.value.length
  })

  // Methods
  const sortBy = (column: string) => {
    if (sortColumn.value === column) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn.value = column
      sortDirection.value = 'asc'
    }
    
    currentPage.value = 1
  }

  const resetSort = () => {
    sortColumn.value = ''
    sortDirection.value = 'asc'
    currentPage.value = 1
  }

  const goToPage = (page: number) => {
    const maxPage = totalPages.value
    if (page >= 1 && page <= maxPage) {
      currentPage.value = page
    }
  }

  const setActiveWeekTab = (weekName: string, index: number) => {
    activeWeekTab.value = weekName
    activeWeekIndex.value = index
    selectedPlant.value = 'All'
    globalFilterValue.value = ''
    currentPage.value = 1
    resetSort()
  }

  const applyPlantFilter = () => {
    currentPage.value = 1
  }

  // Footer calculation methods
  const getTotalRequested = () => {
    return sortedAndFilteredData.value.reduce((total, order) => total + order.requestedQuantity, 0)
  }

  const getTotalToProduce = () => {
    return sortedAndFilteredData.value.reduce((total, order) => total + (order.toProduce || 0), 0)
  }

  const getTotalAvailableQuantity = () => {
    return sortedAndFilteredData.value.reduce((total, order) => total + (order.totalAvailableQuantity || 0), 0)
  }

  const getTotalCumulativeQuantity = () => {
    return sortedAndFilteredData.value.reduce((total, order) => total + (order.cumulativeQuantity || 0), 0)
  }

  const getTotalAvailableNotCharged = () => {
    return sortedAndFilteredData.value.reduce((total, order) => total + order.availableNotCharged, 0)
  }

  const getTotalAvailableCharged = () => {
    return sortedAndFilteredData.value.reduce((total, order) => total + order.availableCharged, 0)
  }

  const getTotalFinalBattery = () => {
    return sortedAndFilteredData.value.reduce((total, order) => total + (order.finalBattery || 0), 0)
  }

  const getDynamicTotal = (key: string, field: 'quantity') => {
    return sortedAndFilteredData.value.reduce((total, order) => {
      const item = order.dynamicSoItems?.[key]
      return total + (item?.[field] || 0)
    }, 0)
  }

  const getDynamicCount = (key: string, field: 'plannedOrder' | 'productionOrder') => {
    return sortedAndFilteredData.value.filter(order => {
      const item = order.dynamicSoItems?.[key]
      return item?.[field] && item[field] !== '-' && item[field].trim() !== ''
    }).length
  }

  const getUniquePlants = () => {
    const plants = new Set(sortedAndFilteredData.value.map(order => order.plant))
    return plants.size
  }

  // Formatting utilities
  const formatNumber = (value: number) => {
    return value.toLocaleString()
  }

  const formatQuantity = (quantity: number, unit: string) => {
    return `${formatNumber(quantity)} ${unit}`
  }

  // Watchers
  watch(globalFilterValue, () => {
    currentPage.value = 1
  })

  watch([selectedPlant], () => {
    currentPage.value = 1
  })

  watch(rows, () => {
    const newMaxPage = Math.ceil(totalRecords.value / rows.value)
    if (currentPage.value > newMaxPage && newMaxPage > 0) {
      currentPage.value = newMaxPage
    }
  })

  return {
    // State
    globalFilterValue,
    selectedPlant,
    activeWeekTab,
    activeWeekIndex,
    sortColumn,
    sortDirection,
    
    // Computed
    sortedSalesOrdersByDate,
    activeWeekData,
    dynamicColumnKeys,
    availablePlants,
    sortedAndFilteredData,
    totalRecords,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
    paginationDisplay,
    filteredDataLength,
    
    // Methods
    sortBy,
    resetSort,
    goToPage,
    setActiveWeekTab,
    applyPlantFilter,
    getTotalRequested,
    getTotalToProduce,
    getTotalAvailableQuantity,
    getTotalCumulativeQuantity,
    getTotalAvailableNotCharged,
    getTotalAvailableCharged,
    getTotalFinalBattery,
    getDynamicTotal,
    getDynamicCount,
    getUniquePlants,
    formatNumber,
    formatQuantity
  }
}