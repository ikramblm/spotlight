import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/models/dashboard_summary.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../dashboard/presentation/dashboard_controller.dart';

/// Landing screen: a role-aware KPI summary (architecture doc §8's single-round-trip
/// /dashboard endpoint - which cards render depends entirely on what the signed-in user's
/// permissions unlocked server-side) followed by entry points into the modules they can reach.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final user = ref.watch(authControllerProvider).value;
    final canSeeDashboard = user?.hasPermission('dashboard.view') ?? false;
    final canSeeCalendar =
        (user?.hasPermission('calendar.view') ?? false) || (user?.hasPermission('calendar.view_today') ?? false);
    final canCheckIn = user?.hasPermission('checkin.scan') ?? false;
    final canSeeConfiscations = user?.hasPermission('confiscations.view') ?? false;
    final canSeeFinances = user?.hasPermission('expenses.view') ?? false;
    final canSeeEmployees = user?.hasPermission('employees.view') ?? false;
    final canSeeCaterers = user?.hasPermission('caterers.view') ?? false;
    final canSeeSuppliers = user?.hasPermission('suppliers.view') ?? false;
    final canSeeEquipment = user?.hasPermission('equipment.view') ?? false;
    final canSeeArchives = user?.hasPermission('archives.view') ?? false;
    final canSeeAuditLog = user?.hasPermission('audit_logs.view') ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appTitle),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: l10n.logOut,
            onPressed: () => ref.read(authControllerProvider.notifier).logout(),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const Icon(Icons.event_available, size: 48),
              const SizedBox(height: 12),
              Text(l10n.signedInAs(user?.email ?? '-')),
              Text(l10n.role(user?.role.name ?? '-')),
              if (canSeeDashboard) ...[
                const SizedBox(height: 24),
                const _DashboardKpis(),
              ],
              if (canSeeCalendar) ...[
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () => context.push('/calendar'),
                  icon: const Icon(Icons.calendar_month),
                  label: Text(l10n.viewCalendar),
                ),
              ],
              if (canCheckIn) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/checkin'),
                  icon: const Icon(Icons.qr_code_scanner),
                  label: Text(l10n.checkInTitle),
                ),
              ],
              if (canSeeConfiscations) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/confiscations'),
                  icon: const Icon(Icons.inventory_2_outlined),
                  label: Text(l10n.confiscationsTitle),
                ),
              ],
              if (canSeeFinances) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/finances'),
                  icon: const Icon(Icons.attach_money),
                  label: Text(l10n.financialSummary),
                ),
              ],
              if (canSeeEmployees) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/employees'),
                  icon: const Icon(Icons.badge_outlined),
                  label: Text(l10n.employeesTitle),
                ),
              ],
              if (canSeeCaterers) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/caterers'),
                  icon: const Icon(Icons.restaurant_outlined),
                  label: Text(l10n.caterersTitle),
                ),
              ],
              if (canSeeSuppliers) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/suppliers'),
                  icon: const Icon(Icons.local_shipping_outlined),
                  label: Text(l10n.suppliersTitle),
                ),
              ],
              if (canSeeEquipment) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/equipment'),
                  icon: const Icon(Icons.handyman_outlined),
                  label: Text(l10n.equipmentTitle),
                ),
              ],
              if (canSeeArchives) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/archives'),
                  icon: const Icon(Icons.archive_outlined),
                  label: Text(l10n.archivesTitle),
                ),
              ],
              if (canSeeAuditLog) ...[
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/audit-logs'),
                  icon: const Icon(Icons.fact_check_outlined),
                  label: Text(l10n.auditLogTitle),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _DashboardKpis extends ConsumerWidget {
  const _DashboardKpis();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final summaryAsync = ref.watch(dashboardSummaryProvider);

    return summaryAsync.when(
      loading: () => const Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator()),
      error: (_, _) => const SizedBox.shrink(),
      data: (summary) {
        final cards = <Widget>[
          if (summary.todaysEventsCount != null)
            _KpiCard(label: l10n.todaysEvents, value: '${summary.todaysEventsCount}', color: Colors.blue),
          if (summary.upcomingBookingsCount != null)
            _KpiCard(label: l10n.upcomingBookings, value: '${summary.upcomingBookingsCount}', color: Colors.teal),
          if (summary.pendingBookingRequestsCount != null)
            _KpiCard(
              label: l10n.pendingRequests,
              value: '${summary.pendingBookingRequestsCount}',
              color: Colors.purple,
            ),
          if (summary.activeConfiscationsCount != null)
            _KpiCard(
              label: l10n.itemsInCustody,
              value: '${summary.activeConfiscationsCount}',
              color: Colors.orange,
            ),
          if (summary.financial case final DashboardFinancial financial) ...[
            _KpiCard(label: l10n.revenueThisMonth, value: '${financial.revenueThisMonth} DZD', color: Colors.green),
            _KpiCard(
              label: l10n.outstandingBalance,
              value: '${financial.outstandingBalance} DZD',
              color: Colors.red,
            ),
          ],
        ];

        if (cards.isEmpty) return const SizedBox.shrink();

        return Wrap(spacing: 8, runSpacing: 8, alignment: WrapAlignment.center, children: cards);
      },
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(value, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: color)),
            Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: color)),
          ],
        ),
      ),
    );
  }
}
