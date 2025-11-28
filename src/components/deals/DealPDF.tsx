'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Deal } from '@/types/deals';
import { UnderwritingResult, formatCurrency, formatPercent } from '@/lib/services/underwriting';

const NAVY_BLUE = '#1e3a5f';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: NAVY_BLUE,
        paddingBottom: 15,
    },
    logo: {
        fontSize: 20,
        fontWeight: 'bold',
        color: NAVY_BLUE,
        letterSpacing: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    investmentTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: NAVY_BLUE,
    },
    generatedDate: {
        fontSize: 9,
        color: '#6B7280',
        marginTop: 4,
    },
    // Property Photo Placeholder
    photoPlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: '#E5E7EB',
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    photoText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    // Two Column Layout
    twoColumn: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    column: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
        padding: 15,
    },
    columnTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: NAVY_BLUE,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 9,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#111827',
    },
    // Investment Metrics
    metricsSection: {
        marginBottom: 20,
    },
    metricsTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: NAVY_BLUE,
        marginBottom: 12,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    metricBox: {
        flex: 1,
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
    },
    metricBoxGreen: {
        backgroundColor: '#DCFCE7',
        borderWidth: 1,
        borderColor: '#22C55E',
    },
    metricBoxYellow: {
        backgroundColor: '#FEF9C3',
        borderWidth: 1,
        borderColor: '#EAB308',
    },
    metricBoxRed: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    metricBoxNeutral: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    metricValueGreen: {
        color: '#15803D',
    },
    metricValueYellow: {
        color: '#A16207',
    },
    metricValueRed: {
        color: '#DC2626',
    },
    metricValueNeutral: {
        color: '#374151',
    },
    metricLabel: {
        fontSize: 8,
        color: '#6B7280',
        textAlign: 'center',
    },
    // AI Investment Thesis
    thesisSection: {
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
        padding: 15,
    },
    thesisTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: NAVY_BLUE,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    recommendationBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    recommendationText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    prosConsContainer: {
        flexDirection: 'row',
        gap: 20,
    },
    prosConsColumn: {
        flex: 1,
    },
    prosConsTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    proTitle: {
        color: '#15803D',
    },
    conTitle: {
        color: '#DC2626',
    },
    listItem: {
        fontSize: 8,
        color: '#374151',
        marginBottom: 4,
        paddingLeft: 8,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 12,
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    footerBrand: {
        fontSize: 9,
        fontWeight: 'bold',
        color: NAVY_BLUE,
    },
    footerDate: {
        fontSize: 8,
        color: '#9CA3AF',
    },
    disclaimer: {
        fontSize: 7,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 1.4,
    },
});

interface DealPDFProps {
    deal: Deal;
    analysis?: UnderwritingResult | null;
}

// Helper function to determine metric color coding
const getCapRateStyle = (capRate: number) => {
    if (capRate >= 0.08) return { box: styles.metricBoxGreen, value: styles.metricValueGreen };
    if (capRate >= 0.05) return { box: styles.metricBoxYellow, value: styles.metricValueYellow };
    return { box: styles.metricBoxRed, value: styles.metricValueRed };
};

const getCashOnCashStyle = (coc: number) => {
    if (coc >= 0.10) return { box: styles.metricBoxGreen, value: styles.metricValueGreen };
    if (coc >= 0.06) return { box: styles.metricBoxYellow, value: styles.metricValueYellow };
    return { box: styles.metricBoxRed, value: styles.metricValueRed };
};

const getCashFlowStyle = (cashFlow: number) => {
    if (cashFlow >= 300) return { box: styles.metricBoxGreen, value: styles.metricValueGreen };
    if (cashFlow >= 100) return { box: styles.metricBoxYellow, value: styles.metricValueYellow };
    return { box: styles.metricBoxRed, value: styles.metricValueRed };
};

const getDSCRStyle = (dscr: number) => {
    if (dscr >= 1.25) return { box: styles.metricBoxGreen, value: styles.metricValueGreen };
    if (dscr >= 1.0) return { box: styles.metricBoxYellow, value: styles.metricValueYellow };
    return { box: styles.metricBoxRed, value: styles.metricValueRed };
};

const getRecommendationColor = (analysis: UnderwritingResult | null | undefined) => {
    if (!analysis) return '#6B7280';
    if (analysis.capRate >= 0.07 && analysis.cashOnCash >= 0.08 && analysis.dscr >= 1.2) return '#15803D';
    if (analysis.capRate >= 0.05 && analysis.cashOnCash >= 0.05 && analysis.dscr >= 1.0) return '#EAB308';
    return '#DC2626';
};

const getRecommendationText = (analysis: UnderwritingResult | null | undefined) => {
    if (!analysis) return 'ANALYSIS PENDING';
    if (analysis.capRate >= 0.07 && analysis.cashOnCash >= 0.08 && analysis.dscr >= 1.2) return 'STRONG BUY';
    if (analysis.capRate >= 0.05 && analysis.cashOnCash >= 0.05 && analysis.dscr >= 1.0) return 'HOLD / MONITOR';
    return 'PASS';
};

const generatePros = (deal: Deal, analysis: UnderwritingResult | null | undefined) => {
    const pros: string[] = [];
    if (analysis) {
        if (analysis.capRate >= 0.07) pros.push('Above-market cap rate indicates strong income potential');
        if (analysis.cashOnCash >= 0.08) pros.push('Excellent cash-on-cash return exceeds typical benchmarks');
        if (analysis.dscr >= 1.25) pros.push('Strong debt service coverage provides cushion against vacancies');
        if (analysis.monthlyCashFlow >= 200) pros.push('Positive monthly cash flow from day one');
    }
    if (deal.year_built && deal.year_built >= 2000) pros.push('Newer construction reduces near-term maintenance costs');
    if (deal.sqft && deal.sqft >= 1500) pros.push('Spacious layout appeals to broader tenant pool');
    if (pros.length === 0) pros.push('Property meets basic investment criteria');
    return pros.slice(0, 4);
};

const generateCons = (deal: Deal, analysis: UnderwritingResult | null | undefined) => {
    const cons: string[] = [];
    if (analysis) {
        if (analysis.capRate < 0.05) cons.push('Below-average cap rate limits income potential');
        if (analysis.cashOnCash < 0.06) cons.push('Cash-on-cash return below market standards');
        if (analysis.dscr < 1.1) cons.push('Tight debt coverage increases risk during vacancies');
        if (analysis.monthlyCashFlow < 100) cons.push('Limited cash flow margin for unexpected expenses');
    }
    if (deal.year_built && deal.year_built < 1980) cons.push('Older property may require significant capital improvements');
    if (cons.length === 0) cons.push('Market conditions should be monitored');
    return cons.slice(0, 4);
};

export default function DealPDF({ deal, analysis }: DealPDFProps) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const capRateStyle = analysis ? getCapRateStyle(analysis.capRate) : { box: styles.metricBoxNeutral, value: styles.metricValueNeutral };
    const cocStyle = analysis ? getCashOnCashStyle(analysis.cashOnCash) : { box: styles.metricBoxNeutral, value: styles.metricValueNeutral };
    const cashFlowStyle = analysis ? getCashFlowStyle(analysis.monthlyCashFlow) : { box: styles.metricBoxNeutral, value: styles.metricValueNeutral };
    const dscrStyle = analysis ? getDSCRStyle(analysis.dscr) : { box: styles.metricBoxNeutral, value: styles.metricValueNeutral };

    const pros = generatePros(deal, analysis);
    const cons = generateCons(deal, analysis);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>ScoutzOS</Text>
                    <View style={styles.headerRight}>
                        <Text style={styles.investmentTitle}>Investment Summary</Text>
                        <Text style={styles.generatedDate}>Generated: {currentDate}</Text>
                    </View>
                </View>

                {/* Property Photo Placeholder */}
                <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoText}>Property Photo</Text>
                </View>

                {/* Two Column Layout */}
                <View style={styles.twoColumn}>
                    {/* Left Column - Property Details */}
                    <View style={styles.column}>
                        <Text style={styles.columnTitle}>Property Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Address</Text>
                            <Text style={styles.detailValue}>{deal.address_line1}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>City, State ZIP</Text>
                            <Text style={styles.detailValue}>{deal.city}, {deal.state} {deal.zip}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Property Type</Text>
                            <Text style={styles.detailValue}>{deal.property_type || 'Single Family'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Beds / Baths</Text>
                            <Text style={styles.detailValue}>{deal.beds} BD / {deal.baths} BA</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Square Footage</Text>
                            <Text style={styles.detailValue}>{deal.sqft?.toLocaleString() || 'N/A'} sqft</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Year Built</Text>
                            <Text style={styles.detailValue}>{deal.year_built || 'N/A'}</Text>
                        </View>
                    </View>

                    {/* Right Column - Financial Summary */}
                    <View style={styles.column}>
                        <Text style={styles.columnTitle}>Financial Summary</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>List Price</Text>
                            <Text style={styles.detailValue}>{formatCurrency(deal.list_price)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Estimated Rent</Text>
                            <Text style={styles.detailValue}>{deal.estimated_rent ? formatCurrency(deal.estimated_rent) + '/mo' : 'N/A'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Annual Taxes</Text>
                            <Text style={styles.detailValue}>{deal.taxes ? formatCurrency(deal.taxes) : 'N/A'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Annual Insurance</Text>
                            <Text style={styles.detailValue}>{deal.insurance ? formatCurrency(deal.insurance) : 'Est. ' + formatCurrency(deal.list_price * 0.005)}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>HOA (Monthly)</Text>
                            <Text style={styles.detailValue}>{deal.hoa ? formatCurrency(deal.hoa) : 'N/A'}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Gross Rent Multiplier</Text>
                            <Text style={styles.detailValue}>{deal.estimated_rent ? (deal.list_price / (deal.estimated_rent * 12)).toFixed(1) : 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Investment Metrics */}
                <View style={styles.metricsSection}>
                    <Text style={styles.metricsTitle}>Investment Metrics</Text>
                    <View style={styles.metricsGrid}>
                        <View style={[styles.metricBox, capRateStyle.box]}>
                            <Text style={[styles.metricValue, capRateStyle.value]}>
                                {analysis ? formatPercent(analysis.capRate) : 'N/A'}
                            </Text>
                            <Text style={styles.metricLabel}>Cap Rate</Text>
                        </View>
                        <View style={[styles.metricBox, cocStyle.box]}>
                            <Text style={[styles.metricValue, cocStyle.value]}>
                                {analysis ? formatPercent(analysis.cashOnCash) : 'N/A'}
                            </Text>
                            <Text style={styles.metricLabel}>Cash on Cash</Text>
                        </View>
                        <View style={[styles.metricBox, cashFlowStyle.box]}>
                            <Text style={[styles.metricValue, cashFlowStyle.value]}>
                                {analysis ? formatCurrency(analysis.monthlyCashFlow) : 'N/A'}
                            </Text>
                            <Text style={styles.metricLabel}>Monthly Cash Flow</Text>
                        </View>
                        <View style={[styles.metricBox, dscrStyle.box]}>
                            <Text style={[styles.metricValue, dscrStyle.value]}>
                                {analysis ? analysis.dscr.toFixed(2) : 'N/A'}
                            </Text>
                            <Text style={styles.metricLabel}>DSCR</Text>
                        </View>
                    </View>
                </View>

                {/* AI Investment Thesis */}
                <View style={styles.thesisSection}>
                    <Text style={styles.thesisTitle}>AI Investment Thesis</Text>
                    <View style={[styles.recommendationBadge, { backgroundColor: getRecommendationColor(analysis) }]}>
                        <Text style={styles.recommendationText}>{getRecommendationText(analysis)}</Text>
                    </View>
                    <View style={styles.prosConsContainer}>
                        <View style={styles.prosConsColumn}>
                            <Text style={[styles.prosConsTitle, styles.proTitle]}>Pros</Text>
                            {pros.map((pro, index) => (
                                <Text key={index} style={styles.listItem}>• {pro}</Text>
                            ))}
                        </View>
                        <View style={styles.prosConsColumn}>
                            <Text style={[styles.prosConsTitle, styles.conTitle]}>Cons</Text>
                            {cons.map((con, index) => (
                                <Text key={index} style={styles.listItem}>• {con}</Text>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        <Text style={styles.footerBrand}>Generated by ScoutzOS</Text>
                        <Text style={styles.footerDate}>{currentDate}</Text>
                    </View>
                    <Text style={styles.disclaimer}>
                        This investment summary is for informational purposes only and does not constitute financial, legal, or investment advice.
                        All projections are estimates based on available data and assumptions. Past performance does not guarantee future results.
                        Consult with qualified professionals before making investment decisions.
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
