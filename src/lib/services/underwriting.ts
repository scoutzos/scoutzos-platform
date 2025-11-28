export interface UnderwritingAssumptions {
    interestRate: number;
    loanToValue: number;
    amortizationYears: number;
    vacancyRate: number;
    managementRate: number;
    maintenanceRate: number;
    capexRate: number;
    closingCostRate: number;
}

export interface DealInput {
    purchasePrice: number;
    estimatedRent: number;
    propertyTaxes: number;
    insurance: number;
    hoa?: number;
}

export interface ExpenseBreakdown {
    propertyTaxes: number;
    insurance: number;
    hoa: number;
    vacancy: number;
    management: number;
    maintenance: number;
    capex: number;
}

export interface UnderwritingResult {
    purchasePrice: number;
    estimatedRent: number;
    downPayment: number;
    loanAmount: number;
    monthlyMortgage: number;
    closingCosts: number;
    totalCashRequired: number;
    grossMonthlyRent: number;
    effectiveGrossIncome: number;
    expenses: ExpenseBreakdown;
    totalMonthlyExpenses: number;
    noi: number;
    monthlyCashFlow: number;
    annualCashFlow: number;
    capRate: number;
    cashOnCash: number;
    dscr: number;
    assumptions: UnderwritingAssumptions;
    ratings: {
        capRate: 'excellent' | 'good' | 'fair' | 'poor';
        cashOnCash: 'excellent' | 'good' | 'fair' | 'poor';
        dscr: 'excellent' | 'good' | 'fair' | 'poor';
        cashFlow: 'excellent' | 'good' | 'fair' | 'poor';
    };
}

export const DEFAULT_ASSUMPTIONS: UnderwritingAssumptions = {
    interestRate: 7.5,
    loanToValue: 75,
    amortizationYears: 30,
    vacancyRate: 8,
    managementRate: 10,
    maintenanceRate: 5,
    capexRate: 5,
    closingCostRate: 3,
};

const THRESHOLDS = {
    capRate: { excellent: 10, good: 8, fair: 6 },
    cashOnCash: { excellent: 12, good: 10, fair: 6 },
    dscr: { excellent: 1.5, good: 1.25, fair: 1.0 },
    cashFlow: { excellent: 300, good: 200, fair: 100 },
};

export function calculateMonthlyMortgage(loanAmount: number, annualRate: number, years: number): number {
    if (loanAmount <= 0) return 0;
    if (annualRate <= 0) return loanAmount / (years * 12);

    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;

    const payment = loanAmount *
        (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);

    return Math.round(payment * 100) / 100;
}

export function calculateExpenses(
    monthlyRent: number,
    annualTaxes: number,
    annualInsurance: number,
    annualHoa: number,
    assumptions: UnderwritingAssumptions
): ExpenseBreakdown {
    return {
        propertyTaxes: Math.round((annualTaxes / 12) * 100) / 100,
        insurance: Math.round((annualInsurance / 12) * 100) / 100,
        hoa: Math.round((annualHoa / 12) * 100) / 100,
        vacancy: Math.round((monthlyRent * assumptions.vacancyRate / 100) * 100) / 100,
        management: Math.round((monthlyRent * assumptions.managementRate / 100) * 100) / 100,
        maintenance: Math.round((monthlyRent * assumptions.maintenanceRate / 100) * 100) / 100,
        capex: Math.round((monthlyRent * assumptions.capexRate / 100) * 100) / 100,
    };
}

export function sumExpenses(expenses: ExpenseBreakdown): number {
    return Object.values(expenses).reduce((sum, val) => sum + val, 0);
}

export function calculateCapRate(noi: number, purchasePrice: number): number {
    if (purchasePrice <= 0) return 0;
    return Math.round((noi / purchasePrice) * 10000) / 100;
}

export function calculateCashOnCash(annualCashFlow: number, totalCashInvested: number): number {
    if (totalCashInvested <= 0) return 0;
    return Math.round((annualCashFlow / totalCashInvested) * 10000) / 100;
}

export function calculateDSCR(noi: number, annualDebtService: number): number {
    if (annualDebtService <= 0) return 999;
    return Math.round((noi / annualDebtService) * 100) / 100;
}

function rateMetric(value: number, thresholds: { excellent: number; good: number; fair: number }): 'excellent' | 'good' | 'fair' | 'poor' {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.fair) return 'fair';
    return 'poor';
}

export function analyzeDeal(input: DealInput, customAssumptions?: Partial<UnderwritingAssumptions>): UnderwritingResult {
    const assumptions: UnderwritingAssumptions = { ...DEFAULT_ASSUMPTIONS, ...customAssumptions };

    if (input.purchasePrice <= 0) throw new Error('Purchase price must be greater than 0');
    if (input.estimatedRent <= 0) throw new Error('Estimated rent must be greater than 0');

    const downPaymentRate = 100 - assumptions.loanToValue;
    const downPayment = Math.round(input.purchasePrice * downPaymentRate / 100);
    const loanAmount = input.purchasePrice - downPayment;
    const monthlyMortgage = calculateMonthlyMortgage(loanAmount, assumptions.interestRate, assumptions.amortizationYears);
    const closingCosts = Math.round(input.purchasePrice * assumptions.closingCostRate / 100);
    const totalCashRequired = downPayment + closingCosts;

    const expenses = calculateExpenses(input.estimatedRent, input.propertyTaxes, input.insurance, input.hoa || 0, assumptions);
    const totalMonthlyExpenses = Math.round(sumExpenses(expenses) * 100) / 100;

    const grossMonthlyRent = input.estimatedRent;
    const effectiveGrossIncome = grossMonthlyRent - expenses.vacancy;

    const operatingExpensesOnly = expenses.propertyTaxes + expenses.insurance + expenses.hoa +
        expenses.management + expenses.maintenance + expenses.capex;
    const noi = (grossMonthlyRent - expenses.vacancy - operatingExpensesOnly) * 12;

    const monthlyCashFlow = Math.round((grossMonthlyRent - totalMonthlyExpenses - monthlyMortgage) * 100) / 100;
    const annualCashFlow = Math.round(monthlyCashFlow * 12 * 100) / 100;

    const capRate = calculateCapRate(noi, input.purchasePrice);
    const cashOnCash = calculateCashOnCash(annualCashFlow, totalCashRequired);
    const dscr = calculateDSCR(noi, monthlyMortgage * 12);

    const ratings = {
        capRate: rateMetric(capRate, THRESHOLDS.capRate),
        cashOnCash: rateMetric(cashOnCash, THRESHOLDS.cashOnCash),
        dscr: rateMetric(dscr, THRESHOLDS.dscr),
        cashFlow: rateMetric(monthlyCashFlow, THRESHOLDS.cashFlow),
    };

    return {
        purchasePrice: input.purchasePrice,
        estimatedRent: input.estimatedRent,
        downPayment,
        loanAmount,
        monthlyMortgage,
        closingCosts,
        totalCashRequired,
        grossMonthlyRent,
        effectiveGrossIncome: Math.round(effectiveGrossIncome * 100) / 100,
        expenses,
        totalMonthlyExpenses,
        noi: Math.round(noi * 100) / 100,
        monthlyCashFlow,
        annualCashFlow,
        capRate,
        cashOnCash,
        dscr,
        assumptions,
        ratings,
    };
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatPercent(value: number): string {
    return `${value.toFixed(2)}%`;
}

export function getRatingColor(rating: string): string {
    switch (rating) {
        case 'excellent': return 'text-green-600';
        case 'good': return 'text-green-500';
        case 'fair': return 'text-yellow-500';
        case 'poor': return 'text-red-500';
        default: return 'text-gray-500';
    }
}

export function getRatingBgColor(rating: string): string {
    switch (rating) {
        case 'excellent': return 'bg-green-100';
        case 'good': return 'bg-green-50';
        case 'fair': return 'bg-yellow-50';
        case 'poor': return 'bg-red-50';
        default: return 'bg-gray-50';
    }
}
