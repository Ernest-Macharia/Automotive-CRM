import { apiClient } from '@/lib/api/client';

export interface ReportSummary {
  opportunitiesCount: number;
  quotesCount: number;
  invoicesCount: number;
  totalPayments: number;
  totalOutstanding: number;
  jobcardsCount: number;
  waiversCount: number;
  vehiclesCount: number;
}

export interface SalesPerformance {
  totalopportunities: number;
  totalQuotes: number;
  totalInvoices: number;
  totalPaid: number;
  conversion: {
    opportunitiesToQuotes: number;
    quotesToInvoices: number;
  };
}

export interface RevenueTimelinePoint {
  date: string;
  amount: number;
}

export interface TechnicianProductivity {
  technicianId: string;
  technician: {
    id: string;
    email: string;
    role: string;
  } | null;
  totalJobs: number;
  completed: number;
  inProgress: number;
}

export interface TopCustomer {
  opportunityId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
  } | null;
  subject: string | null;
  totalInvoiced?: number;
  totalPaid?: number;
  invoicesCount?: number;
  totalQuoted?: number;
  quotesCount?: number;
  latestSubject?: string;
  opportunitiesCount?: number;
  type: 'invoice' | 'quote' | 'opportunity';
}

export interface OpportunitySource {
  source: string;
  count: number;
}

export interface DashboardSummary {
  title: string;
  period: string;
  totals: {
    opportunities: number;
    quotes: number;
    invoices: number;
    payments: number;
    outstanding: number;
  };
  conversions: {
    opportunitiesToQuotes: number;
    quotesToInvoices: number;
  };
  revenue: {
    total: number;
    timeline: RevenueTimelinePoint[];
  };
  topCustomers: TopCustomer[];
}

export interface SlaComplianceReport {
  totalOpportunities: number;
  compliant: number;
  breached: number;
  complianceRate: number;
  byBreachType?: Record<string, number>;
  byLISStatus?: Record<string, number>;
  averageTimeToBreach?: number;
  reassignments?: number;
}

export interface LisCompletenessReport {
  total: number;
  green: number;
  amber: number;
  red: number;
  completenessRate: number;
  averageScore?: number;
  commonMissingFields?: Array<{ field: string; count: number }>;
  byType?: Record<string, { green: number; amber: number; red: number }>;
}

export interface SlaTrendReport {
  byDay?: Array<{ date: string; total: number; breached: number; complianceRate: number }>;
  summary?: {
    period: string;
    averageCompliance: number;
    improvementTrend?: string;
    peakBreachDay?: { date: string; breaches: number };
  };
}

export interface WeeklyReportSettings {
  adminEmails: string[];
  schedule: string;
  timezone: string;
  nextRun: string;
}

export interface DateRangeDto {
  from?: string;
  to?: string;
  branchId?: string;
  salesRepId?: string;
}

export interface RoleDashboardResponse {
  role: string;
  scope?: {
    organizationIds?: string[];
  };
  summary?: Record<string, any>;
  businessNumbers?: {
    totalOpportunities?: number;
    openPipelineCount?: number;
    openPipelineValue?: number;
    wonDealsCount?: number;
    wonDealsValue?: number;
    quotesCount?: number;
    quotesValue?: number;
    invoicesCount?: number;
    invoicesValue?: number;
    paidInvoicesValue?: number;
    opportunitiesToQuotes?: number;
    quotesToInvoices?: number;
  };
  financeNumbers?: Record<string, any>;
  salesRepPerformance?: Array<Record<string, any>>;
  recentActivities?: Array<Record<string, any>>;
  featureUsage?: Array<Record<string, any>>;
  organizations?: Array<Record<string, any>>;
  convertedInvoices?: Array<Record<string, any>>;
}

class ReportService {
  // Helper method to build query params
  private buildQueryParams(params?: DateRangeDto): Record<string, string> {
    const queryParams: Record<string, string> = {};
    
    if (params?.from) queryParams.from = params.from;
    if (params?.to) queryParams.to = params.to;
    if (params?.branchId) queryParams.branchId = params.branchId;
    if (params?.salesRepId) queryParams.salesRepId = params.salesRepId;
    
    return queryParams;
  }

  async getRoleDashboard(params?: DateRangeDto): Promise<RoleDashboardResponse> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<RoleDashboardResponse>('/reports/dashboard/role', queryParams);
    } catch (error) {
      console.error('Error getting role dashboard:', error);
      throw error;
    }
  }

  // 1. Get dashboard summary
  async getSummary(params?: DateRangeDto): Promise<ReportSummary> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<ReportSummary>('/reports/summary', queryParams);
    } catch (error) {
      console.error('Error getting report summary:', error);
      throw error;
    }
  }

  // 2. Get sales performance
  async getSalesPerformance(params?: DateRangeDto): Promise<SalesPerformance> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<SalesPerformance>('/reports/sales-performance', queryParams);
    } catch (error) {
      console.error('Error getting sales performance:', error);
      throw error;
    }
  }

  // 3. Get revenue timeline
  async getRevenueTimeline(params?: DateRangeDto): Promise<RevenueTimelinePoint[]> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<RevenueTimelinePoint[]>('/reports/revenue-timeline', queryParams);
    } catch (error) {
      console.error('Error getting revenue timeline:', error);
      throw error;
    }
  }

  // 4. Get technician productivity
  async getTechnicianProductivity(params?: DateRangeDto): Promise<TechnicianProductivity[]> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<TechnicianProductivity[]>('/reports/technician-productivity', queryParams);
    } catch (error) {
      console.error('Error getting technician productivity:', error);
      throw error;
    }
  }

  // 5. Get top customers by invoiced amount
  async getTopCustomers(params?: DateRangeDto, limit: number = 10): Promise<TopCustomer[]> {
    try {
      const queryParams = { ...this.buildQueryParams(params), limit: limit.toString() };
      return await apiClient.get<TopCustomer[]>('/reports/top-customers', queryParams);
    } catch (error) {
      console.error('Error getting top customers:', error);
      throw error;
    }
  }

  // 6. Get top customers by opportunity count
  async getTopCustomersByOpportunities(params?: DateRangeDto, limit: number = 5): Promise<TopCustomer[]> {
    try {
      const queryParams = { ...this.buildQueryParams(params), limit: limit.toString() };
      return await apiClient.get<TopCustomer[]>('/reports/top-customers/opportunities', queryParams);
    } catch (error) {
      console.error('Error getting top customers by opportunities:', error);
      throw error;
    }
  }

  // 7. Get opportunity sources distribution
  async getOpportunitySources(params?: DateRangeDto): Promise<OpportunitySource[]> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<OpportunitySource[]>('/reports/opportunity-sources', queryParams);
    } catch (error) {
      console.error('Error getting opportunity sources:', error);
      throw error;
    }
  }

  // 8. Get scoped summary (branch or sales-rep filtered)
  async getScopedSummary(params?: DateRangeDto): Promise<ReportSummary> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<ReportSummary>('/reports/summary/scoped', queryParams);
    } catch (error) {
      console.error('Error getting scoped summary:', error);
      throw error;
    }
  }

  // 9. Get unified CRM dashboard summary
  async getDashboardSummary(params?: DateRangeDto): Promise<DashboardSummary> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<DashboardSummary>('/reports/dashboard', queryParams);
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      throw error;
    }
  }

  // 10. Get enhanced dashboard with SLA/LIS metrics
  async getDashboardWithSLA(params?: DateRangeDto): Promise<any> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<any>('/reports/dashboard/with-sla', queryParams);
    } catch (error) {
      console.error('Error getting dashboard with SLA:', error);
      throw error;
    }
  }

  // 11. Get SLA compliance report
  async getSLACompliance(params?: DateRangeDto): Promise<SlaComplianceReport> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<SlaComplianceReport>('/reports/sla/compliance', queryParams);
    } catch (error) {
      console.error('Error getting SLA compliance report:', error);
      throw error;
    }
  }

  // 12. Get SLA reassignment report
  async getSLAReassignments(params?: DateRangeDto): Promise<any> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<any>('/reports/sla/reassignments', queryParams);
    } catch (error) {
      console.error('Error getting SLA reassignment report:', error);
      throw error;
    }
  }

  // 13. Get LIS completeness report
  async getLISCompleteness(params?: DateRangeDto): Promise<LisCompletenessReport> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<LisCompletenessReport>('/reports/lis/completeness', queryParams);
    } catch (error) {
      console.error('Error getting LIS completeness report:', error);
      throw error;
    }
  }

  // 14. Get SLA trend
  async getSLATrend(params?: DateRangeDto): Promise<SlaTrendReport> {
    try {
      const queryParams = this.buildQueryParams(params);
      return await apiClient.get<SlaTrendReport>('/reports/sla/trend', queryParams);
    } catch (error) {
      console.error('Error getting SLA trend:', error);
      throw error;
    }
  }

  // 15. Send test weekly report email
  async sendTestWeeklyReport(email?: string): Promise<{ success?: boolean; message: string }> {
    try {
      const queryParams: Record<string, string> = {};
      if (email) queryParams.email = email;
      return await apiClient.get<{ success?: boolean; message: string }>(
        '/reports/weekly-report/test',
        queryParams
      );
    } catch (error) {
      console.error('Error sending test weekly report:', error);
      throw error;
    }
  }

  // 16. Send weekly report for custom period
  async sendCustomWeeklyReport(payload: {
    emails: string[];
    from: string;
    to: string;
  }): Promise<{ success?: boolean; message: string }> {
    try {
      return await apiClient.post<typeof payload, { success?: boolean; message: string }>(
        '/reports/weekly-report/send',
        payload
      );
    } catch (error) {
      console.error('Error sending custom weekly report:', error);
      throw error;
    }
  }

  // 17. Get weekly report settings
  async getWeeklyReportSettings(): Promise<WeeklyReportSettings> {
    try {
      return await apiClient.get<WeeklyReportSettings>('/reports/weekly-report/settings');
    } catch (error) {
      console.error('Error getting weekly report settings:', error);
      throw error;
    }
  }

  // Utility methods
  async getCurrentMonthSummary(): Promise<ReportSummary> {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const params: DateRangeDto = {
        from: firstDay.toISOString().split('T')[0],
        to: lastDay.toISOString().split('T')[0]
      };
      
      return await this.getSummary(params);
    } catch (error) {
      console.error('Error getting current month summary:', error);
      throw error;
    }
  }

  async getLast30DaysRevenue(): Promise<RevenueTimelinePoint[]> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      const params: DateRangeDto = {
        from: thirtyDaysAgo.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0]
      };
      
      return await this.getRevenueTimeline(params);
    } catch (error) {
      console.error('Error getting last 30 days revenue:', error);
      throw error;
    }
  }

  async getQuarterlyPerformance(quarter: 1 | 2 | 3 | 4, year: number = new Date().getFullYear()): Promise<SalesPerformance> {
    try {
      const quarterStart = new Date(year, (quarter - 1) * 3, 1);
      const quarterEnd = new Date(year, quarter * 3, 0);
      
      const params: DateRangeDto = {
        from: quarterStart.toISOString().split('T')[0],
        to: quarterEnd.toISOString().split('T')[0]
      };
      
      return await this.getSalesPerformance(params);
    } catch (error) {
      console.error(`Error getting Q${quarter} ${year} performance:`, error);
      throw error;
    }
  }

  async getYearToDateSummary(year: number = new Date().getFullYear()): Promise<ReportSummary> {
    try {
      const yearStart = new Date(year, 0, 1);
      const today = new Date();
      
      const params: DateRangeDto = {
        from: yearStart.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      };
      
      return await this.getSummary(params);
    } catch (error) {
      console.error(`Error getting YTD ${year} summary:`, error);
      throw error;
    }
  }

  async getBranchPerformance(branchId: string, params?: DateRangeDto): Promise<DashboardSummary> {
    try {
      const queryParams: DateRangeDto = {
        ...params,
        branchId
      };
      
      return await this.getDashboardSummary(queryParams);
    } catch (error) {
      console.error(`Error getting branch ${branchId} performance:`, error);
      throw error;
    }
  }

  async getSalesRepPerformance(salesRepId: string, params?: DateRangeDto): Promise<DashboardSummary> {
    try {
      const queryParams: DateRangeDto = {
        ...params,
        salesRepId
      };
      
      return await this.getDashboardSummary(queryParams);
    } catch (error) {
      console.error(`Error getting sales rep ${salesRepId} performance:`, error);
      throw error;
    }
  }

  async getConversionMetrics(params?: DateRangeDto): Promise<{
    opportunitiesToQuotes: number;
    quotesToInvoices: number;
    overallConversion: number;
  }> {
    try {
      const salesPerformance = await this.getSalesPerformance(params);
      
      const overallConversion = salesPerformance.totalopportunities > 0 
        ? (salesPerformance.totalInvoices / salesPerformance.totalopportunities) * 100
        : 0;
      
      return {
        opportunitiesToQuotes: salesPerformance.conversion.opportunitiesToQuotes,
        quotesToInvoices: salesPerformance.conversion.quotesToInvoices,
        overallConversion: parseFloat(overallConversion.toFixed(2))
      };
    } catch (error) {
      console.error('Error getting conversion metrics:', error);
      throw error;
    }
  }

  async getRevenueTrend(days: number = 30): Promise<{
    current: number;
    previous: number;
    trend: number;
    timeline: RevenueTimelinePoint[];
  }> {
    try {
      const now = new Date();
      const currentEnd = now;
      const currentStart = new Date();
      currentStart.setDate(currentEnd.getDate() - days);
      
      const previousEnd = new Date(currentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - days);
      
      const currentParams: DateRangeDto = {
        from: currentStart.toISOString().split('T')[0],
        to: currentEnd.toISOString().split('T')[0]
      };
      
      const previousParams: DateRangeDto = {
        from: previousStart.toISOString().split('T')[0],
        to: previousEnd.toISOString().split('T')[0]
      };
      
      const [currentRevenue, previousRevenue] = await Promise.all([
        this.getRevenueTimeline(currentParams),
        this.getRevenueTimeline(previousParams)
      ]);
      
      const currentTotal = currentRevenue.reduce((sum, point) => sum + point.amount, 0);
      const previousTotal = previousRevenue.reduce((sum, point) => sum + point.amount, 0);
      
      const trend = previousTotal > 0 
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : currentTotal > 0 ? 100 : 0;
      
      return {
        current: currentTotal,
        previous: previousTotal,
        trend: parseFloat(trend.toFixed(2)),
        timeline: currentRevenue
      };
    } catch (error) {
      console.error(`Error getting ${days}-day revenue trend:`, error);
      throw error;
    }
  }

  async getTopPerformingTechnicians(limit: number = 5, params?: DateRangeDto): Promise<TechnicianProductivity[]> {
    try {
      const technicians = await this.getTechnicianProductivity(params);
      return technicians
        .filter(t => t.technician !== null)
        .sort((a, b) => b.totalJobs - a.totalJobs)
        .slice(0, limit);
    } catch (error) {
      console.error(`Error getting top ${limit} performing technicians:`, error);
      throw error;
    }
  }

  async getCustomerLifetimeValue(customerEmail: string): Promise<{
    totalInvoiced: number;
    totalPaid: number;
    totalOpportunities: number;
    averageInvoiceValue: number;
    firstEngagement: Date | null;
    lastEngagement: Date | null;
  }> {
    try {
      const allTopCustomers = await this.getTopCustomers({}, 100);
      const customerData = allTopCustomers.find(c => c.customer?.email === customerEmail);
      
      if (!customerData) {
        return {
          totalInvoiced: 0,
          totalPaid: 0,
          totalOpportunities: 0,
          averageInvoiceValue: 0,
          firstEngagement: null,
          lastEngagement: null
        };
      }
      
      const totalInvoiced = customerData.totalInvoiced || 0;
      const totalPaid = customerData.totalPaid || 0;
      const totalOpportunities = customerData.opportunitiesCount || 1;
      const averageInvoiceValue = totalInvoiced / (customerData.invoicesCount || 1);
      
      return {
        totalInvoiced,
        totalPaid,
        totalOpportunities,
        averageInvoiceValue: parseFloat(averageInvoiceValue.toFixed(2)),
        firstEngagement: null,
        lastEngagement: null
      };
    } catch (error) {
      console.error(`Error getting lifetime value for customer ${customerEmail}:`, error);
      throw error;
    }
  }

  async exportReport(
    reportType: 'summary' | 'sales-performance' | 'revenue-timeline' | 'top-customers' | 'technician-productivity',
    format: 'csv' | 'json' = 'json',
    params?: DateRangeDto
  ): Promise<string> {
    try {
      let data: any;
      
      switch (reportType) {
        case 'summary':
          data = await this.getSummary(params);
          break;
        case 'sales-performance':
          data = await this.getSalesPerformance(params);
          break;
        case 'revenue-timeline':
          data = await this.getRevenueTimeline(params);
          break;
        case 'top-customers':
          data = await this.getTopCustomers(params);
          break;
        case 'technician-productivity':
          data = await this.getTechnicianProductivity(params);
          break;
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
      
      if (format === 'csv') {
        return this.convertToCSV(data, reportType);
      } else {
        return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.error(`Error exporting ${reportType} report in ${format} format:`, error);
      throw error;
    }
  }

  private convertToCSV(data: any, reportType: string): string {
    let csvContent = '';
    
    switch (reportType) {
      case 'summary':
        csvContent = [
          'Metric,Value',
          `Opportunities,${data.opportunitiesCount}`,
          `Quotes,${data.quotesCount}`,
          `Invoices,${data.invoicesCount}`,
          `Total Payments,${data.totalPayments}`,
          `Total Outstanding,${data.totalOutstanding}`,
          `Job Cards,${data.jobcardsCount}`,
          `Waivers,${data.waiversCount}`,
          `Vehicles,${data.vehiclesCount}`
        ].join('\n');
        break;
        
      case 'sales-performance':
        csvContent = [
          'Metric,Value',
          `Total Opportunities,${data.totalopportunities}`,
          `Total Quotes,${data.totalQuotes}`,
          `Total Invoices,${data.totalInvoices}`,
          `Total Paid,${data.totalPaid}`,
          `Opportunities to Quotes (%),${data.conversion.opportunitiesToQuotes}`,
          `Quotes to Invoices (%),${data.conversion.quotesToInvoices}`
        ].join('\n');
        break;
        
      case 'revenue-timeline':
        const headers = ['Date,Amount'];
        const rows = data.map((point: RevenueTimelinePoint) => `${point.date},${point.amount}`);
        csvContent = [...headers, ...rows].join('\n');
        break;
        
      case 'top-customers':
        csvContent = [
          'Customer Name,Email,Total Invoiced,Total Paid,Invoices Count,Type',
          ...data.map((customer: TopCustomer) => 
            `"${customer.customer?.name || 'Unknown'}",${customer.customer?.email || ''},${customer.totalInvoiced || customer.totalQuoted || 0},${customer.totalPaid || 0},${customer.invoicesCount || customer.quotesCount || 0},${customer.type}`
          )
        ].join('\n');
        break;
        
      case 'technician-productivity':
        csvContent = [
          'Technician Email,Total Jobs,Completed,In Progress,Completion Rate (%)',
          ...data.map((tech: TechnicianProductivity) => {
            const completionRate = tech.totalJobs > 0 ? (tech.completed / tech.totalJobs) * 100 : 0;
            return `"${tech.technician?.email || 'Unknown'}",${tech.totalJobs},${tech.completed},${tech.inProgress},${completionRate.toFixed(2)}`;
          })
        ].join('\n');
        break;
        
      default:
        csvContent = JSON.stringify(data);
    }
    
    return csvContent;
  }

  async getMonthlyReport(month: number, year: number = new Date().getFullYear()): Promise<{
    summary: ReportSummary;
    salesPerformance: SalesPerformance;
    revenueTimeline: RevenueTimelinePoint[];
    topCustomers: TopCustomer[];
  }> {
    try {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      
      const params: DateRangeDto = {
        from: firstDay.toISOString().split('T')[0],
        to: lastDay.toISOString().split('T')[0]
      };
      
      const [summary, salesPerformance, revenueTimeline, topCustomers] = await Promise.all([
        this.getSummary(params),
        this.getSalesPerformance(params),
        this.getRevenueTimeline(params),
        this.getTopCustomers(params)
      ]);
      
      return {
        summary,
        salesPerformance,
        revenueTimeline,
        topCustomers
      };
    } catch (error) {
      console.error(`Error getting monthly report for ${month}/${year}:`, error);
      throw error;
    }
  }

  async getWeeklyReport(weekOffset: number = 0): Promise<DashboardSummary> {
    try {
      const now = new Date();
      const currentDay = now.getDay();
      const startOffset = currentDay === 0 ? -6 : 1 - currentDay;
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + startOffset - (weekOffset * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const params: DateRangeDto = {
        from: weekStart.toISOString().split('T')[0],
        to: weekEnd.toISOString().split('T')[0]
      };
      
      return await this.getDashboardSummary(params);
    } catch (error) {
      console.error(`Error getting weekly report (offset: ${weekOffset}):`, error);
      throw error;
    }
  }

  async comparePeriods(
    period1: DateRangeDto,
    period2: DateRangeDto
  ): Promise<{
    period1: DashboardSummary;
    period2: DashboardSummary;
    comparison: {
      opportunitiesChange: number;
      revenueChange: number;
      conversionChange: number;
    };
  }> {
    try {
      const [period1Data, period2Data] = await Promise.all([
        this.getDashboardSummary(period1),
        this.getDashboardSummary(period2)
      ]);
      
      const opportunitiesChange = period1Data.totals.opportunities > 0
        ? ((period2Data.totals.opportunities - period1Data.totals.opportunities) / period1Data.totals.opportunities) * 100
        : period2Data.totals.opportunities > 0 ? 100 : 0;
      
      const revenueChange = period1Data.revenue.total > 0
        ? ((period2Data.revenue.total - period1Data.revenue.total) / period1Data.revenue.total) * 100
        : period2Data.revenue.total > 0 ? 100 : 0;
      
      const overallConversion1 = period1Data.totals.opportunities > 0
        ? (period1Data.totals.invoices / period1Data.totals.opportunities) * 100
        : 0;
      
      const overallConversion2 = period2Data.totals.opportunities > 0
        ? (period2Data.totals.invoices / period2Data.totals.opportunities) * 100
        : 0;
      
      const conversionChange = overallConversion1 > 0
        ? ((overallConversion2 - overallConversion1) / overallConversion1) * 100
        : overallConversion2 > 0 ? 100 : 0;
      
      return {
        period1: period1Data,
        period2: period2Data,
        comparison: {
          opportunitiesChange: parseFloat(opportunitiesChange.toFixed(2)),
          revenueChange: parseFloat(revenueChange.toFixed(2)),
          conversionChange: parseFloat(conversionChange.toFixed(2))
        }
      };
    } catch (error) {
      console.error('Error comparing periods:', error);
      throw error;
    }
  }

  // Debug method to test API connection
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const testData = await this.getSummary({
        from: '2025-01-01',
        to: '2025-01-31'
      });
      return {
        success: true,
        message: 'API Connection successful',
        data: testData
      };
    } catch (error: any) {
      console.error('❌ API Connection failed:', error);
      return {
        success: false,
        message: error.message || 'API Connection failed'
      };
    }
  }
}

export const reportService = new ReportService();
