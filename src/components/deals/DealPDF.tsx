'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Deal } from '@/types/deals';
import { UnderwritingResult, formatCurrency, formatPercent } from '@/lib/services/underwriting';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 10,
        backgroundColor: '#F3F4F6',
        padding: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    label: {
        fontSize: 10,
        color: '#6B7280',
    },
    value: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    card: {
        width: '48%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 4,
        marginBottom: 10,
    },
    kpiValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    kpiLabel: {
        fontSize: 10,
        color: '#6B7280',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 8,
        color: '#9CA3AF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
    },
});

interface DealPDFProps {
    deal: Deal;
    analysis?: UnderwritingResult | null;
}

export default function DealPDF({ deal, analysis }: DealPDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>{deal.address_line1}</Text>
                    <Text style={styles.subtitle}>{deal.city}, {deal.state} {deal.zip}</Text>
                </View>

                {/* Property Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Property Overview</Text>
                    <View style={styles.grid}>
                        <View style={styles.card}>
                            <Text style={styles.label}>List Price</Text>
                            <Text style={styles.value}>{formatCurrency(deal.list_price)}</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.label}>Estimated Rent</Text>
                            <Text style={styles.value}>{deal.estimated_rent ? formatCurrency(deal.estimated_rent) : 'N/A'}</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.label}>Configuration</Text>
                            <Text style={styles.value}>{deal.beds} Bed / {deal.baths} Bath</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.label}>Size</Text>
                            <Text style={styles.value}>{deal.sqft?.toLocaleString()} sqft</Text>
                        </View>
                    </View>
                </View>

                {/* Analysis */}
                {analysis && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Financial Analysis</Text>
                        <View style={styles.grid}>
                            <View style={styles.card}>
                                <Text style={styles.kpiLabel}>Cap Rate</Text>
                                <Text style={styles.kpiValue}>{formatPercent(analysis.capRate)}</Text>
                            </View>
                            <View style={styles.card}>
                                <Text style={styles.kpiLabel}>Cash on Cash</Text>
                                <Text style={styles.kpiValue}>{formatPercent(analysis.cashOnCash)}</Text>
                            </View>
                            <View style={styles.card}>
                                <Text style={styles.kpiLabel}>Monthly Cash Flow</Text>
                                <Text style={styles.kpiValue}>{formatCurrency(analysis.monthlyCashFlow)}</Text>
                            </View>
                            <View style={styles.card}>
                                <Text style={styles.kpiLabel}>DSCR</Text>
                                <Text style={styles.kpiValue}>{analysis.dscr}</Text>
                            </View>
                        </View>

                        <View style={{ marginTop: 10 }}>
                            <View style={styles.row}>
                                <Text style={styles.label}>Total Cash Required</Text>
                                <Text style={styles.value}>{formatCurrency(analysis.totalCashRequired)}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Monthly Mortgage</Text>
                                <Text style={styles.value}>{formatCurrency(analysis.monthlyMortgage)}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Total Monthly Expenses</Text>
                                <Text style={styles.value}>{formatCurrency(analysis.totalMonthlyExpenses + analysis.monthlyMortgage)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.footer}>
                    <Text>Generated by ScoutzOS - The Real Estate Operating System</Text>
                </View>
            </Page>
        </Document>
    );
}
