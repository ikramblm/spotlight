import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/utils/file_export.dart';
import '../../../l10n/app_localizations.dart';
import 'expenses_controller.dart';

class FinancialSummaryScreen extends ConsumerStatefulWidget {
  const FinancialSummaryScreen({super.key});

  @override
  ConsumerState<FinancialSummaryScreen> createState() => _FinancialSummaryScreenState();
}

class _FinancialSummaryScreenState extends ConsumerState<FinancialSummaryScreen> {
  late DateTime _from;
  late DateTime _to;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _from = DateTime(now.year, now.month, 1);
    _to = DateTime(now.year, now.month + 1, 0);
  }

  Future<void> _pickRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020, 1, 1),
      lastDate: DateTime(2035, 12, 31),
      initialDateRange: DateTimeRange(start: _from, end: _to),
    );
    if (range != null) {
      setState(() {
        _from = range.start;
        _to = range.end;
      });
    }
  }

  Future<void> _exportPdf(BuildContext context, WidgetRef ref) async {
    try {
      final bytes = await ref.read(expensesRepositoryProvider).exportSummaryPdf(from: _from, to: _to);
      await shareExportedFile(bytes: bytes, fileName: 'financial-summary.pdf', mimeType: 'application/pdf');
    } catch (e) {
      if (!context.mounted) return;
      final l10n = AppLocalizations.of(context)!;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : '${l10n.exportFailed}: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final dateFormat = MaterialLocalizations.of(context).formatMediumDate;
    final summaryAsync = ref.watch(financialSummaryProvider((from: _from, to: _to)));

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.financialSummary),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf_outlined),
            tooltip: l10n.exportPdf,
            onPressed: () => _exportPdf(context, ref),
          ),
          IconButton(
            icon: const Icon(Icons.receipt_long),
            tooltip: l10n.viewExpenses,
            onPressed: () => context.push('/expenses'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: OutlinedButton.icon(
              onPressed: _pickRange,
              icon: const Icon(Icons.date_range),
              label: Text('${dateFormat(_from)} – ${dateFormat(_to)}'),
            ),
          ),
          Expanded(
            child: summaryAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, _) => Center(child: Text(error.toString())),
              data: (summary) {
                return ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      childAspectRatio: 1.6,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      children: [
                        _KpiCard(label: l10n.revenue, value: summary.revenue, color: Colors.blue),
                        _KpiCard(label: l10n.paymentsReceived, value: summary.paymentsReceived, color: Colors.green),
                        _KpiCard(label: l10n.expensesTitle, value: summary.expenses, color: Colors.orange),
                        _KpiCard(
                          label: l10n.outstandingBalance,
                          value: summary.outstandingBalance,
                          color: Colors.red,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(l10n.expensesByCategory, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    ...summary.expensesByCategory.map(
                      (c) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(c.categoryName),
                        trailing: Text('${c.total} DZD'),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: color.withValues(alpha: 0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: color)),
            const SizedBox(height: 4),
            Text(
              '$value DZD',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: color),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
