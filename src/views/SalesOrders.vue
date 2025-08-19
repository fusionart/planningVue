<!-- SalesOrders.vue - Clean version without debug features -->
<template>
  <div class="sales-orders" :key="componentKey">
    <div class="page-header">
      <h2 class="page-title">Клиентски поръчки по заявена дата на доставка</h2>
      <div class="header-actions">
        <button 
          class="btn" 
          :class="hasCredentials ? 'btn-success' : 'btn-warning'"
          @click="showCredentialsModal = true"
        >
          {{ hasCredentials ? '🔐 Актуализация на идентификационни данни' : '🔓 Въведете идентификационни данни' }}
        </button>
      </div>
    </div>

    <!-- Credentials Required Notice -->
    <div v-if="!hasCredentials && !showCredentialsModal && !localCredentialsState" class="credentials-notice">
      <div class="notice-content">
        <div class="notice-icon">🔐</div>
        <div class="notice-text">
          <h3>SAP изискват се идентификационни данни</h3>
          <p>Моля въведете вашите потребителско име и парола за SAP.</p>
        </div>
        <button class="btn btn-primary" @click="showCredentialsModal = true">
          Въведете потребител и парола
        </button>
      </div>
    </div>

    <!-- Credentials Modal -->
    <div v-if="showCredentialsModal" class="modal-overlay" @click="closeCredentialsModal">
      <div class="modal credentials-modal" @click.stop>
        <div class="modal-header">
          <h3>SAP API идентификационни данни</h3>
          <button class="modal-close" @click="closeCredentialsModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="credentials-info">
            <p>Моля въведете вашите потребителско име и парола за SAP</p>
          </div>

          <div class="form-group">
            <label for="username">Потребителско име:</label>
            <input
              id="username"
              v-model="credentialsForm.username"
              type="text"
              placeholder="Въведете SAP потребител"
              class="form-input"
              :disabled="savingCredentials"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Парола:</label>
            <input
              id="password"
              v-model="credentialsForm.password"
              type="password"
              placeholder="Въведете SAP парола"
              class="form-input"
              :disabled="savingCredentials"
            />
          </div>

          <div v-if="credentialsError" class="credentials-error">
            {{ credentialsError }}
          </div>
          
          <div class="form-actions">
            <button 
              class="btn btn-secondary" 
              @click="closeCredentialsModal"
              :disabled="savingCredentials"
            >
              Отказ
            </button>
            <button 
              class="btn btn-primary" 
              @click="saveCredentials"
              :disabled="!credentialsForm.username || !credentialsForm.password || savingCredentials"
            >
              {{ savingCredentials ? 'Запазване...' : 'Запази' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- API Parameters Section with PrimeVue DatePickers -->
    <div v-if="hasCredentials || localCredentialsState" class="api-parameters-section">
      <h3>Времеви период</h3>
      <div class="parameters-grid">
        <div class="parameter-group-datepicker">
          <label for="dateFromPicker">Дата от</label>
          <DatePicker
            id="dateFromPicker"
            v-model="apiDateFromDate"
            dateFormat="dd.mm.yy"
            :firstDayOfWeek="1"
            :showWeek="true"
            :manualInput="true"
            placeholder="Изберете начална дата"
            class="parameter-datepicker"
            :class="{ 'p-invalid': dateFromError }"
            @date-select="onDateFromSelect"
            @blur="validateDateFrom"
            showButtonBar
            :showIcon="true"
            locale="bg"
          />
        </div>

        <div class="parameter-group-datepicker">
          <label for="dateToPicker">Дата до</label>
          <DatePicker
            id="dateToPicker"
            v-model="apiDateToDate"
            dateFormat="dd.mm.yy"
            :firstDayOfWeek="1"
            :showWeek="true"
            :manualInput="true"
            placeholder="Изберете крайна дата"
            class="parameter-datepicker"
            :class="{ 'p-invalid': dateToError }"
            @date-select="onDateToSelect"
            @blur="validateDateTo"
            showButtonBar
            :showIcon="true"
            locale="bg"
          />
        </div>

        <div class="parameter-actions">
          <button 
            class="btn btn-primary" 
            @click="loadDataFromAPI" 
            :disabled="loading || hasDateErrors"
          >
            {{ loading ? 'Зареждане...' : '📊 Зареди' }}
          </button>
        </div>
      </div>
      
      <!-- Date validation errors -->
      <div v-if="hasDateErrors" class="date-errors">
        <div v-if="dateFromError" class="date-error">
          <i class="pi pi-exclamation-triangle"></i>
          {{ dateFromError }}
        </div>
        <div v-if="dateToError" class="date-error">
          <i class="pi pi-exclamation-triangle"></i>
          {{ dateToError }}
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Зареждане на данни от SAP ...</p>
      <p class="loading-sub">Моля изчакайте ...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <div class="error-icon">❌</div>
      <p class="error-message">{{ error }}</p>
      <div class="error-actions">
        <button class="btn btn-primary" @click="clearError">
          Dismiss
        </button>
        <button class="btn btn-secondary" @click="showCredentialsModal = true">
          Check Credentials
        </button>
        <button class="btn btn-secondary" @click="clearCredentialsAndReload">
          Clear Credentials
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty && (hasCredentials || localCredentialsState)" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>No sales orders found for the selected date range.</p>
      <p class="empty-sub">Try adjusting the date range or load data for a different period.</p>
      <button class="btn btn-primary" @click="loadDataFromAPIWithCurrentMonth">
        Load Current Month
      </button>
    </div>

    <!-- Data Display with Two-Row Header -->
    <div v-else-if="hasData" class="table-container">
      <div class="table-header">
        <h3>Батерии за седмица {{ activeWeekData?.reqDlvWeek }} - {{ filteredData.length }} записа</h3>
        <div class="table-info">
          <span class="data-range">
            Дати: {{ formatDateDisplay(apiDateFromDate) }} - {{ formatDateDisplay(apiDateToDate) }}
          </span>
        </div>
      </div>

      <!-- Delivery Week Tabs -->
      <div v-if="sortedSalesOrdersByDate.length > 0" class="delivery-week-tabs">
        <div class="tabs-navigation">
          <nav class="tabs-nav">
            <button
              v-for="(weekData, index) in sortedSalesOrdersByDate"
              :key="weekData.reqDlvWeek"
              @click="setActiveWeekTab(weekData.reqDlvWeek, index)"
              :class="[
                'tab-button',
                activeWeekTab === weekData.reqDlvWeek ? 'tab-active' : 'tab-inactive'
              ]"
            >
              <div class="tab-content">
                <span class="tab-label">{{ weekData.reqDlvWeek }}</span>
                <span class="tab-count">
                  {{ weekData.salesOrderMainList.length }} записа
                </span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      <!-- Custom Table with Two-Row Header -->
      <div v-if="activeWeekData && activeWeekData.salesOrderMainList.length > 0" class="week-table-container">        
        <div class="custom-datatable-container">
          <div class="table-controls">
            <div class="controls-left">
              <!-- Plant Filter -->
              <label class="plant-filter-label">
                Филтър по завод:
                <select
                  id="plantFilter"
                  v-model="selectedPlant"
                  @change="applyPlantFilter"
                  class="filter-select"
                >
                  <option value="All">Всички заводи</option>
                  <option 
                    v-for="plant in availablePlants" 
                    :key="plant" 
                    :value="plant"
                  >
                    {{ plant }}
                  </option>
                </select>
              </label>
            </div>

            <div class="controls-right">
              <label>
                Търсене: 
                <input 
                  type="text" 
                  v-model="searchTerm" 
                  @input="filterData"
                  placeholder="Търсене в настоящата седмица ..."
                  class="search-input"
                >
              </label>
              <label>
                Покажи 
                <select v-model="pageLength" @change="updatePageLength" class="page-length-select">
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                записа
              </label>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="sales-orders-table-custom">
              <thead>
                <!-- First Header Row - Category Groups -->
                <tr class="header-categories">
                  <th colspan="2" class="header-basic">Основни данни</th>
                  <th colspan="7" class="header-inventory">Складови данни</th>
                  <!-- Dynamic Sales Order + Customer Groups -->
                  <template v-for="key in dynamicColumnKeys" :key="key">
                    <th colspan="3" class="header-dynamic">
                      {{ key }} / {{ getPlannedOrderForKey(key) }}
                    </th>
                  </template>
                </tr>
                
                <!-- Second Header Row - Column Names with Sorting -->
                <tr class="header-columns">
                  <!-- Basic Information Columns -->
                  <th 
                    class="col-material sortable" 
                    @click="sortBy('material')"
                    :class="{ 'sort-active': sortColumn === 'material' }"
                  >
                    Материал
                    <span class="sort-indicator">
                      <span v-if="sortColumn === 'material'" class="sort-arrow">
                        {{ sortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                      <span v-else class="sort-arrows">↕</span>
                    </span>
                  </th>
                  <th 
                    class="col-plant sortable" 
                    @click="sortBy('plant')"
                    :class="{ 'sort-active': sortColumn === 'plant' }"
                  >
                    Завод
                    <span class="sort-indicator">
                      <span v-if="sortColumn === 'plant'" class="sort-arrow">
                        {{ sortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                      <span v-else class="sort-arrows">↕</span>
                    </span>
                  </th>
                  
                  <!-- Inventory Data Columns - Now includes toProduce and totalAvailableQuantity -->
                  <th 
                    class="col-requested sortable" 
                    @click="sortBy('requestedQuantity')"
                    :class="{ 'sort-active': sortColumn === 'requestedQuantity' }"
                  >
                    Заявено количество
                    <span class="sort-indicator">
                      <span v-if="sortColumn === 'requestedQuantity'" class="sort-arrow">
                        {{ sortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                      <span v-else class="sort-arrows">↕</span>
                    </span>
                  </th>
                  <!-- NEW: To Produce Column -->
                  <th 
                    class="col-to-produce sortable" 
                    @click="sortBy('toProduce')"
                    :class="{ 'sort-active': sortColumn === 'toProduce' }"
                  >
                    За производство
                    <span class="sort-indicator">
                      <span v-if="sortColumn === 'toProduce'" class="sort-arrow">
                        {{ sortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                      <span v-else class="sort-arrows">↕</span>
                    </span>
                  </th>
                  <!-- NEW: Total Available Quantity Column -->
                  <th 
                    class="col-total-available sortable" 
                    @click="sortBy('totalAvailableQuantity')"
                    :class="{ 'sort-active': sortColumn === 'totalAvailableQuantity' }"
                  >
                    Общо налично
                    <span class="sort-indicator">
                      <span v-if="sortColumn === 'totalAvailableQuantity'" class="sort-arrow">
                        {{ sortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                      <span v-else class="sort-arrows">↕</span>
                    </span>
                  </th>
                  <!-- Cumulative Quantity Column -->
                  <th 
                    class="col-cumulative sortable" 
                    @click="sortBy('cumulativeQuantity')"
                    :class="{ 'sort-active': sortColumn === 'cumulativeQuantity' }"
                  >
                    Натрупано количество
                    <span class="sort-indicator">
                      <span v-if="sortColumn === 'cumulativeQuantity'" class="sort-arrow">
                        {{ sortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                      <span v-else class="sort-arrows">↕</span>
                    </span>
                  </th>
                  <th 
                    class="col-available sortable" 
                    @click="sortBy('availableNotCharged')"
                    :class="{ 'sort-active': sortColumn === 'availableNotCharged' }"
                  >
                    НФ
                    <span class="sort-indicator">
                      <span v-if="sortColumn === 'availableNotCharged'" class="sort-arrow">
                        {{ sortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                      <span v-else class="sort-arrows">↕</span>
                    </span>
                  </th>
                  <th 
                    class="col-charged sortable" 
                    @click="sortBy('availableCharged')"
                    :class="{ 'sort-active': sortColumn === 'availableCharged' }"
                  >
                    МЗ
                    <span class="sort-indicator">
                      <span v-if="sortColumn === 'availableCharged'" class="sort-arrow">
                        {{ sortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                      <span v-else class="sort-arrows">↕</span>
                    </span>
                  </th>
                  <!-- Final Battery Column -->
                  <th 
                    class="col-final-battery sortable" 
                    @click="sortBy('finalBattery')"
                    :class="{ 'sort-active': sortColumn === 'finalBattery' }"
                  >
                    10-ки
                    <span class="sort-indicator">
                      <span v-if="sortColumn === 'finalBattery'" class="sort-arrow">
                        {{ sortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                      <span v-else class="sort-arrows">↕</span>
                    </span>
                  </th>
                  
                  <!-- Dynamic Columns - Each Sales Order + Customer group -->
                  <template v-for="(key, keyIndex) in dynamicColumnKeys" :key="key">
                    <th 
                      :class="['col-dynamic-qty sortable', { 'first-dynamic-group': keyIndex === 0, 'sort-active': sortColumn === `dynamic-${key}-quantity` }]"
                      @click="sortBy(`dynamic-${key}-quantity`)"
                    >
                      Количество
                      <span class="sort-indicator">
                        <span v-if="sortColumn === `dynamic-${key}-quantity`" class="sort-arrow">
                          {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                        <span v-else class="sort-arrows">↕</span>
                      </span>
                    </th>
                    <th 
                      class="col-dynamic-planned sortable"
                      @click="sortBy(`dynamic-${key}-plannedOrder`)"
                      :class="{ 'sort-active': sortColumn === `dynamic-${key}-plannedOrder` }"
                    >
                      П-ва поръчка
                      <span class="sort-indicator">
                        <span v-if="sortColumn === `dynamic-${key}-plannedOrder`" class="sort-arrow">
                          {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                        <span v-else class="sort-arrows">↕</span>
                      </span>
                    </th>
                    <th 
                      class="col-dynamic-production sortable"
                      @click="sortBy(`dynamic-${key}-productionOrder`)"
                      :class="{ 'sort-active': sortColumn === `dynamic-${key}-productionOrder` }"
                    >
                      Пр-на поръчка
                      <span class="sort-indicator">
                        <span v-if="sortColumn === `dynamic-${key}-productionOrder`" class="sort-arrow">
                          {{ sortDirection === 'asc' ? '↑' : '↓' }}
                        </span>
                        <span v-else class="sort-arrows">↕</span>
                      </span>
                    </th>
                  </template>
                </tr>
              </thead>
              
              <tbody>
                <tr 
                  v-for="(order, index) in paginatedData" 
                  :key="order.material + '-' + index"
                  class="data-row"
                  @click="viewOrder(order)"
                >
                  <!-- Basic Information -->
                  <td class="cell-material">{{ order.material }}</td>
                  <td class="cell-plant">{{ order.plant }}</td>
                  
                  <!-- Inventory Data - Now includes toProduce and totalAvailableQuantity -->
                  <td class="cell-requested">{{ formatQuantity(order.requestedQuantity, order.requestedQuantityUnit) }}</td>
                  <!-- NEW: To Produce Cell -->
                  <td class="cell-to-produce">{{ formatNumber(order.toProduce || 0) }}</td>
                  <!-- NEW: Total Available Quantity Cell -->
                  <td class="cell-total-available">{{ formatNumber(order.totalAvailableQuantity || 0) }}</td>
                  <!-- Cumulative Quantity Cell -->
                  <td class="cell-cumulative">{{ formatNumber(order.cumulativeQuantity || 0) }}</td>
                  <td class="cell-available">{{ formatNumber(order.availableNotCharged) }}</td>
                  <td class="cell-charged">{{ formatNumber(order.availableCharged) }}</td>
                  <!-- Final Battery Cell -->
                  <td class="cell-final-battery">{{ formatNumber(order.finalBattery || 0) }}</td>
                  
                  <!-- Dynamic Columns - Each Sales Order + Customer group -->
                  <template v-for="(key, keyIndex) in dynamicColumnKeys" :key="key">
                    <td :class="['cell-dynamic-qty', { 'first-dynamic-group': keyIndex === 0 }]">
                      {{ order.dynamicSoItems?.[key]?.quantity ? formatNumber(order.dynamicSoItems[key].quantity) : '-' }}
                    </td>
                    <td class="cell-dynamic-planned">
                      {{ order.dynamicSoItems?.[key]?.plannedOrder || '-' }}
                    </td>
                    <td class="cell-dynamic-production">
                      {{ order.dynamicSoItems?.[key]?.productionOrder || '-' }}
                    </td>
                  </template>
                </tr>
                
                <!-- No data row -->
                <tr v-if="sortedAndFilteredData.length === 0" class="no-data-row">
                  <td :colspan="totalColumns" class="no-data-cell">
                    {{ searchTerm ? 'No matching records found' : 'No data available' }}
                  </td>
                </tr>
              </tbody>
              
              <!-- Footer with Totals -->
              <tfoot>
                <tr class="footer-totals">
                  <!-- Basic Information Totals -->
                  <td class="footer-material">{{ sortedAndFilteredData.length }} записа</td>
                  <td class="footer-plant">{{ getUniquePlants() }} завода</td>
                  
                  <!-- Inventory Totals - Now includes toProduce and totalAvailableQuantity -->
                  <td class="footer-requested">Общо: {{ formatNumber(getTotalRequested()) }} бр.</td>
                  <!-- NEW: To Produce Total -->
                  <td class="footer-to-produce">Общо: {{ formatNumber(getTotalToProduce()) }} бр.</td>
                  <!-- NEW: Total Available Quantity Total -->
                  <td class="footer-total-available">Общо: {{ formatNumber(getTotalAvailableQuantity()) }} бр.</td>
                  <!-- Cumulative Quantity Total -->
                  <td class="footer-cumulative">Общо: {{ formatNumber(getTotalCumulativeQuantity()) }} бр.</td>
                  <td class="footer-available">Общо: {{ formatNumber(getTotalAvailableNotCharged()) }} бр.</td>
                  <td class="footer-charged">Общо: {{ formatNumber(getTotalAvailableCharged()) }} бр.</td>
                  <!-- Final Battery Total -->
                  <td class="footer-final-battery">Общо: {{ formatNumber(getTotalFinalBattery()) }} бр.</td>
                  
                  <!-- Dynamic Column Totals - Each Sales Order + Customer group -->
                  <template v-for="(key, keyIndex) in dynamicColumnKeys" :key="key">
                    <td :class="['footer-dynamic-qty', { 'first-dynamic-group': keyIndex === 0 }]">Общо: {{ formatNumber(getDynamicTotal(key, 'quantity')) }} бр.</td>
                    <td class="footer-dynamic-planned">{{ getDynamicCount(key, 'plannedOrder') }} поръчки</td>
                    <td class="footer-dynamic-production">{{ getDynamicCount(key, 'productionOrder') }} поръчки</td>
                  </template>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div class="pagination-controls">
            <div class="pagination-info">
              Показване {{ paginationDisplay.start }} до {{ paginationDisplay.end }} от {{ paginationDisplay.total }} записа
              <span v-if="searchTerm">(филтрирани от {{ activeWeekData.salesOrderMainList.length }} записа)</span>
            </div>
            <div class="pagination-buttons">
              <button 
                class="btn btn-secondary pagination-btn"
                :disabled="currentPage === 1"
                @click="goToPage(1)"
              >
                Първа
              </button>
              <button 
                class="btn btn-secondary pagination-btn"
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                Предишна
              </button>
              <span class="page-numbers">
                Страница {{ currentPage }} от {{ totalPages }}
              </span>
              <button 
                class="btn btn-secondary pagination-btn"
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                Следваща
              </button>
              <button 
                class="btn btn-secondary pagination-btn"
                :disabled="currentPage === totalPages"
                @click="goToPage(totalPages)"
              >
                Последна
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No data message for active week -->
      <div v-else-if="activeWeekData && activeWeekData.salesOrderMainList.length === 0" class="no-data-message">
        <p>No data available for week {{ activeWeekData.reqDlvWeek }}</p>
      </div>
    </div>

    <!-- Order Details Modal -->
    <div v-if="selectedOrder" class="modal-overlay" @click="closeModal">
      <div class="modal order-details-modal" @click.stop>
        <div class="modal-header">
          <h3>Sales Order Item Details</h3>
          <button class="modal-close" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="order-details">
            <div class="detail-group">
              <label>Material:</label>
              <span class="detail-value">{{ selectedOrder.material }}</span>
            </div>
            
            <div class="detail-group">
              <label>Plant:</label>
              <span class="detail-value">{{ selectedOrder.plant }}</span>
            </div>
            
            <div class="detail-group">
              <label>Requested Quantity:</label>
              <span class="detail-value">{{ selectedOrder.requestedQuantity }} {{ selectedOrder.requestedQuantityUnit }}</span>
            </div>

            <!-- NEW: To Produce Detail -->
            <div class="detail-group">
              <label>To Produce:</label>
              <span class="detail-value">{{ selectedOrder.toProduce || 0 }}</span>
            </div>

            <!-- NEW: Total Available Quantity Detail -->
            <div class="detail-group">
              <label>Total Available Quantity:</label>
              <span class="detail-value">{{ selectedOrder.totalAvailableQuantity || 0 }}</span>
            </div>

            <!-- Cumulative Quantity Detail -->
            <div class="detail-group">
              <label>Cumulative Quantity:</label>
              <span class="detail-value">{{ selectedOrder.cumulativeQuantity || 0 }}</span>
            </div>
            
            <div class="detail-group">
              <label>Available Not Charged:</label>
              <span class="detail-value">{{ selectedOrder.availableNotCharged }}</span>
            </div>
            
            <div class="detail-group">
              <label>Available Charged:</label>
              <span class="detail-value">{{ selectedOrder.availableCharged }}</span>
            </div>

            <!-- Final Battery Detail -->
            <div class="detail-group">
              <label>Final Battery:</label>
              <span class="detail-value">{{ selectedOrder.finalBattery || 0 }}</span>
            </div>

            <div class="detail-group">
              <label>Quantity Unit:</label>
              <span class="detail-value">{{ selectedOrder.requestedQuantityUnit }}</span>
            </div>
          </div>

          <!-- Availability Status -->
          <div class="availability-status">
            <h4>Availability Analysis</h4>
            <div class="availability-grid">
              <div class="availability-item">
                <span class="availability-label">Total Available:</span>
                <span class="availability-value">{{ getTotalAvailable(selectedOrder) }}</span>
              </div>
              <div class="availability-item">
                <span class="availability-label">Fulfillment Rate:</span>
                <span class="availability-value">{{ getFulfillmentRate(selectedOrder) }}%</span>
              </div>
              <div class="availability-item">
                <span class="availability-label">To Produce:</span>
                <span class="availability-value">{{ selectedOrder.toProduce || 0 }}</span>
              </div>
              <div class="availability-item">
                <span class="availability-label">Cumulative Quantity:</span>
                <span class="availability-value">{{ selectedOrder.cumulativeQuantity || 0 }}</span>
              </div>
              <div class="availability-item">
                <span class="availability-label">Final Battery:</span>
                <span class="availability-value">{{ selectedOrder.finalBattery || 0 }}</span>
              </div>
              <div class="availability-item">
                <span class="availability-label">Status:</span>
                <span 
                  class="status-badge" 
                  :class="getAvailabilityStatusClass(selectedOrder)"
                >
                  {{ getAvailabilityStatus(selectedOrder) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Dynamic SO Items -->
          <div v-if="selectedOrder.dynamicSoItems && Object.keys(selectedOrder.dynamicSoItems).length > 0" class="dynamic-so-items">
            <h4>Dynamic Sales Order Items</h4>
            <div class="dynamic-items-grid">
              <div
                v-for="(item, key) in selectedOrder.dynamicSoItems"
                :key="key"
                class="dynamic-item-card"
              >
                <div class="dynamic-item-header">
                  <span class="dynamic-item-key">{{ key }}</span>
                </div>
                <div class="dynamic-item-details">
                  <div class="dynamic-item-row" v-if="item.quantity">
                    <span class="dynamic-item-label">Quantity:</span>
                    <span class="dynamic-item-value">{{ item.quantity }}</span>
                  </div>
                  <div class="dynamic-item-row" v-if="item.plannedOrder">
                    <span class="dynamic-item-label">Planned Order:</span>
                    <span class="dynamic-item-value">{{ item.plannedOrder }}</span>
                  </div>
                  <div class="dynamic-item-row" v-if="item.productionOrder">
                    <span class="dynamic-item-label">Production Order:</span>
                    <span class="dynamic-item-value">{{ item.productionOrder }}</span>
                  </div>
                  <div class="dynamic-item-row" v-if="item.customer">
                    <span class="dynamic-item-label">Customer:</span>
                    <span class="dynamic-item-value">{{ item.customer }}</span>
                  </div>
                  <div class="dynamic-item-row" v-if="item.completeDelivery !== undefined">
                    <span class="dynamic-item-label">Complete Delivery:</span>
                    <span class="dynamic-item-value">{{ item.completeDelivery ? 'Yes' : 'No' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useSalesOrders } from '@/composables/useSalesOrders'
import { salesOrderService } from '@/services/salesOrderService'
import type { SalesOrderMain, SalesOrderByDate } from '@/types/api'

// Composables and existing state
const {
  salesOrdersByDate,
  allSalesOrders,
  loading,
  error,
  pagination,
  filters,
  hasData,
  hasError,
  isEmpty,
  applyFilters,
  clearFilters,
  clearError,
  nextPage,
  prevPage,
  setCredentials,
  clearCredentials,
  fetchSalesOrders,
  formatDateForBackend
} = useSalesOrders()

// Component state
const selectedOrder = ref<SalesOrderMain | null>(null)
const showCredentialsModal = ref(false)
const savingCredentials = ref(false)
const credentialsError = ref('')
const credentialsForm = ref({
  username: '',
  password: ''
})

// API parameters with PrimeVue Date objects
const apiDateFromDate = ref<Date | null>(null)
const apiDateToDate = ref<Date | null>(null)
const activeWeekTab = ref<string>('')
const activeWeekIndex = ref<number>(0)
const selectedPlant = ref('All')

// Date validation
const dateFromError = ref('')
const dateToError = ref('')

// Custom table state
const searchTerm = ref('')
const pageLength = ref(15)
const currentPage = ref(1)

// Sorting state
const sortColumn = ref<string>('')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Force re-render state
const componentKey = ref(0)
const localCredentialsState = ref(false)

// Computed properties
const hasCredentials = computed(() => {
  const serviceHasCredentials = salesOrderService.hasCredentials()
  return serviceHasCredentials || localCredentialsState.value
})

const hasDateErrors = computed(() => {
  return !!(dateFromError.value || dateToError.value)
})

const activeWeekData = computed(() => {
  if (!sortedSalesOrdersByDate.value.length || !activeWeekTab.value) {
    return sortedSalesOrdersByDate.value[0] || null
  }
  return sortedSalesOrdersByDate.value.find(weekData => weekData.reqDlvWeek === activeWeekTab.value) || null
})

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

// Updated filteredData computed property that includes sorting
const sortedAndFilteredData = computed(() => {
  if (!activeWeekData.value) return []
  
  let data = [...activeWeekData.value.salesOrderMainList]
  
  // Apply plant filter
  if (selectedPlant.value !== 'All') {
    data = data.filter(order => order.plant === selectedPlant.value)
  }
  
  // Apply search filter
  if (searchTerm.value.trim()) {
    const search = searchTerm.value.toLowerCase()
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

const filteredData = computed(() => {
  return sortedAndFilteredData.value
})

const totalRecords = computed(() => {
  return sortedAndFilteredData.value.length
})

const totalPages = computed(() => {
  if (totalRecords.value === 0) return 1
  return Math.ceil(totalRecords.value / pageLength.value)
})

const startIndex = computed(() => {
  return (currentPage.value - 1) * pageLength.value
})

const displayEndIndex = computed(() => {
  const start = (currentPage.value - 1) * pageLength.value
  const itemsPerPage = parseInt(pageLength.value)
  const calculatedEnd = start + itemsPerPage
  return Math.min(calculatedEnd, totalRecords.value)
})

const endIndex = computed(() => {
  return displayEndIndex.value
})

const paginatedData = computed(() => {
  const data = sortedAndFilteredData.value
  const start = startIndex.value
  const itemsPerPage = parseInt(pageLength.value)
  const end = start + itemsPerPage
  
  const result = data.slice(start, end)
  return result
})

const paginationDisplay = computed(() => {
  const start = (currentPage.value - 1) * parseInt(pageLength.value)
  const itemsPerPage = parseInt(pageLength.value)
  const total = totalRecords.value
  const end = Math.min(start + itemsPerPage, total)
  
  return {
    start: total === 0 ? 0 : start + 1,
    end: end,
    total: total,
    currentPage: currentPage.value,
    totalPages: totalPages.value
  }
})

const totalColumns = computed(() => {
  return 9 + (dynamicColumnKeys.value.length * 3)
})

// Force re-render method
const forceRerender = () => {
  componentKey.value++
}

// Date validation methods
const validateDateFrom = () => {
  dateFromError.value = ''
  
  if (!apiDateFromDate.value) {
    dateFromError.value = 'Началната дата е задължителна'
    return
  }
  
  if (apiDateToDate.value && apiDateFromDate.value > apiDateToDate.value) {
    dateFromError.value = 'Началната дата не може да бъде след крайната дата'
  }
}

const validateDateTo = () => {
  dateToError.value = ''
  
  if (!apiDateToDate.value) {
    dateToError.value = 'Крайната дата е задължителна'
    return
  }
  
  if (apiDateFromDate.value && apiDateToDate.value < apiDateFromDate.value) {
    dateToError.value = 'Крайната дата не може да бъде преди началната дата'
  }
}

const onDateFromSelect = () => {
  validateDateFrom()
  if (apiDateToDate.value) {
    validateDateTo()
  }
}

const onDateToSelect = () => {
  validateDateTo()
  if (apiDateFromDate.value) {
    validateDateFrom()
  }
}

// Sorting methods
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

// Methods
const filterData = () => {
  currentPage.value = 1
}

const updatePageLength = () => {
  const newPageLength = parseInt(pageLength.value)
  const newMaxPage = Math.ceil(totalRecords.value / newPageLength)
  
  if (currentPage.value > newMaxPage && newMaxPage > 0) {
    currentPage.value = newMaxPage
  }
}

const goToPage = (page) => {
  const maxPage = totalPages.value
  if (page >= 1 && page <= maxPage) {
    currentPage.value = page
  }
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

// Utility methods
const formatNumber = (value: number) => {
  return value.toLocaleString()
}

const formatQuantity = (quantity: number, unit: string) => {
  return `${formatNumber(quantity)} ${unit}`
}

// Order and tab management
const viewOrder = (order: SalesOrderMain) => {
  selectedOrder.value = order
}

const closeModal = () => {
  selectedOrder.value = null
}

const setActiveWeekTab = (weekName: string, index: number) => {
  activeWeekTab.value = weekName
  activeWeekIndex.value = index
  selectedPlant.value = 'All'
  searchTerm.value = ''
  currentPage.value = 1
  resetSort()
}

const applyPlantFilter = () => {
  currentPage.value = 1
}

// Date and API methods
const initializeDateInputs = () => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  apiDateFromDate.value = startOfMonth
  apiDateToDate.value = endOfMonth
}

const formatDateDisplay = (date: Date | null) => {
  if (!date) return ''
  try {
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return date.toString()
  }
}

const loadDataFromAPI = async () => {
  if (!apiDateFromDate.value || !apiDateToDate.value) {
    dateFromError.value = !apiDateFromDate.value ? 'Началната дата е задължителна' : ''
    dateToError.value = !apiDateToDate.value ? 'Крайната дата е задължителна' : ''
    return
  }

  if (hasDateErrors.value) {
    return
  }

  try {
    filters.reqDelDateBegin = formatDateForBackend(apiDateFromDate.value)
    filters.reqDelDateEnd = formatDateForBackend(apiDateToDate.value)
    
    filters.material = ''
    filters.plant = ''
    pagination.page = 0
    activeWeekTab.value = ''
    activeWeekIndex.value = 0
    searchTerm.value = ''
    currentPage.value = 1
    resetSort()
    
    await fetchSalesOrders()
  } catch (error) {
    console.error('❌ Error in loadDataFromAPI:', error)
    alert('Error loading data: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

const loadDataFromAPIWithCurrentMonth = async () => {
  initializeDateInputs()
  await loadDataFromAPI()
}

// Credentials management
const saveCredentials = async () => {
  if (!credentialsForm.value.username || !credentialsForm.value.password) {
    credentialsError.value = 'Both username and password are required'
    return
  }

  savingCredentials.value = true
  credentialsError.value = ''

  try {
    // Save credentials
    setCredentials(credentialsForm.value.username, credentialsForm.value.password)
    
    // Force local state update
    localCredentialsState.value = true
    
    // Wait for Vue to process
    await nextTick()
    
    // Force re-render
    forceRerender()
    
    // Close modal
    showCredentialsModal.value = false
    credentialsForm.value = { username: '', password: '' }
    credentialsError.value = ''
    
    // Initialize dates
    initializeDateInputs()
    
  } catch (error) {
    console.error('❌ Error saving credentials:', error)
    credentialsError.value = error instanceof Error ? error.message : 'Failed to save credentials'
    localCredentialsState.value = false
    showCredentialsModal.value = true
  } finally {
    savingCredentials.value = false
  }
}

const closeCredentialsModal = () => {
  showCredentialsModal.value = false
  credentialsForm.value = { username: '', password: '' }
  credentialsError.value = ''
  savingCredentials.value = false
}

const clearCredentialsAndReload = () => {
  clearCredentials()
  localCredentialsState.value = false
  clearError()
  showCredentialsModal.value = true
}

// Helper functions for availability calculations
const getTotalAvailable = (order: SalesOrderMain) => {
  return order.availableNotCharged + order.availableCharged
}

const getFulfillmentRate = (order: SalesOrderMain) => {
  const total = getTotalAvailable(order)
  if (order.requestedQuantity === 0) return 0
  return Math.round((total / order.requestedQuantity) * 100)
}

const getAvailabilityStatus = (order: SalesOrderMain) => {
  const rate = getFulfillmentRate(order)
  if (rate >= 100) return 'Full'
  if (rate >= 50) return 'Partial'
  return 'Low'
}

const getAvailabilityStatusClass = (order: SalesOrderMain) => {
  const status = getAvailabilityStatus(order)
  switch (status) {
    case 'Full': return 'status-success'
    case 'Partial': return 'status-warning'
    case 'Low': return 'status-error'
    default: return 'status-warning'
  }
}

const getPlannedOrderForKey = (key: string) => {
  if (!activeWeekData.value) return 'N/A'
  
  for (const order of activeWeekData.value.salesOrderMainList) {
    if (order.dynamicSoItems?.[key]?.plannedOrder) {
      return order.dynamicSoItems[key].plannedOrder
    }
  }
  
  return 'N/A'
}

// Watchers
watch([sortedAndFilteredData, selectedPlant, searchTerm], () => {
  if (currentPage.value > totalPages.value && totalPages.value > 0) {
    currentPage.value = 1
  }
}, { deep: true })

watch(pageLength, () => {
  updatePageLength()
})

watch(salesOrdersByDate, (newData) => {
  if (newData.length > 0 && !activeWeekTab.value) {
    setActiveWeekTab(newData[0].reqDlvWeek, 0)
  }
}, { deep: true })

watch([selectedPlant, searchTerm], () => {
  currentPage.value = 1
})

watch([apiDateFromDate, apiDateToDate], () => {
  if (apiDateFromDate.value) validateDateFrom()
  if (apiDateToDate.value) validateDateTo()
})

// Initialize component
onMounted(() => {
  const initialHasCredentials = salesOrderService.hasCredentials()
  localCredentialsState.value = initialHasCredentials
  
  if (!initialHasCredentials) {
    showCredentialsModal.value = true
  } else {
    initializeDateInputs()
  }
})
</script>

<style scoped>
/* Import base SalesOrder styles */
@import '@/styles/views/salesOrder/SalesOrder.css';

/* Import two-row header specific styles */
@import '@/styles/views/salesOrder/SalesOrdersTwoRowHeader.css';

@import '@/styles/views/salesOrder/SalesOrdersDatePicker.css';

/* NEW: Cumulative Quantity Column Styles */
.col-cumulative { 
  background: #fef3c7 !important; 
  color: #d97706 !important;
  font-weight: 600;
}

.cell-cumulative { 
  background-color: #fef3c7; 
  color: #d97706;
  font-weight: 600;
}

.footer-cumulative {
  background-color: #fef3c7 !important;
  text-align: right !important;
  font-weight: 700 !important;
  color: #d97706 !important;
}

/* Final Battery Column Styles */
.col-final-battery { 
  background: #fef2f2 !important; 
  color: #991b1b !important;
  border-right: 2px solid #1f2937 !important; /* Border after Final Battery */
  position: relative;
  z-index: 12 !important; /* Higher z-index for vertical borders */
}

.cell-final-battery { 
  background-color: #fef2f2; 
  color: #991b1b;
  font-weight: 600;
  border-right: 2px solid #1f2937 !important; /* Border after Final Battery */
  position: relative;
  z-index: 3 !important; /* Higher z-index for vertical borders in body */
}

.footer-final-battery {
  background-color: #f0f9ff !important;
  text-align: right !important;
  font-weight: 700 !important;
  color: var(--color-primary) !important;
  border-right: 2px solid #1f2937 !important; /* Border after Final Battery in footer */
}

/* Update first dynamic group styling to account for new column */
.first-dynamic-group {
  border-left: 2px solid #7c3aed !important;
}

/* Ensure proper sorting indicator styling */
.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
}

.sortable:hover {
  background-color: rgba(59, 130, 246, 0.1) !important;
}

.sort-indicator {
  display: inline-block;
  margin-left: 4px;
  font-size: 10px;
  opacity: 0.7;
}

.sort-active .sort-indicator {
  opacity: 1;
  color: var(--color-primary) !important;
}

.sort-arrow {
  font-weight: bold;
}

.sort-arrows {
  opacity: 0.5;
}

/* Date error styling */
.date-errors {
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: var(--border-radius-md);
}

.date-error {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-error);
  font-size: 14px;
  margin-bottom: 4px;
}

.date-error:last-child {
  margin-bottom: 0;
}

/* Responsive adjustments for new column */
@media (max-width: 768px) {
  .sales-orders-table-custom {
    min-width: 1300px; /* Increase minimum width to accommodate new cumulative column */
  }
  
  .col-cumulative,
  .cell-cumulative,
  .footer-cumulative,
  .col-final-battery,
  .cell-final-battery,
  .footer-final-battery {
    min-width: 80px;
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .col-cumulative,
  .cell-cumulative,
  .footer-cumulative,
  .col-final-battery,
  .cell-final-battery,
  .footer-final-battery {
    min-width: 60px;
    font-size: 10px;
    padding: 4px 2px;
  }
  
  .sales-orders-table-custom {
    min-width: 1100px; /* Adjust for mobile */
  }
}
</style>