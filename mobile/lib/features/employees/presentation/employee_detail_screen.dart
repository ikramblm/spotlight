import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_exception.dart';
import '../../../core/models/employee.dart';
import '../../../core/models/payroll.dart';
import '../../../design_system/widgets.dart';
import '../../../l10n/app_localizations.dart';
import 'employees_controller.dart';
import 'run_payroll_dialog.dart';

class EmployeeDetailScreen extends ConsumerWidget {
  const EmployeeDetailScreen({super.key, required this.employee});

  final Employee employee;

  String _statusLabel(AppLocalizations l10n, EmploymentStatus status) {
    switch (status) {
      case EmploymentStatus.active:
        return l10n.employmentStatusActive;
      case EmploymentStatus.onLeave:
        return l10n.employmentStatusOnLeave;
      case EmploymentStatus.terminated:
        return l10n.employmentStatusTerminated;
    }
  }

  Color _statusColor(BuildContext context, EmploymentStatus status) {
    switch (status) {
      case EmploymentStatus.active:
        return Colors.green;
      case EmploymentStatus.onLeave:
        return Colors.orange;
      case EmploymentStatus.terminated:
        return Theme.of(context).colorScheme.error;
    }
  }

  String _paymentStatusLabel(AppLocalizations l10n, PayrollPaymentStatus status) {
    switch (status) {
      case PayrollPaymentStatus.paid:
        return l10n.paymentStatusPaid;
      case PayrollPaymentStatus.unpaid:
        return l10n.paymentStatusUnpaid;
      case PayrollPaymentStatus.partial:
        return l10n.paymentStatusPartial;
    }
  }

  Future<void> _markPaid(BuildContext context, WidgetRef ref, PayrollRun run) async {
    try {
      await ref.read(employeesRepositoryProvider).markPaid(run.id);
      ref.invalidate(payrollHistoryProvider(employee.id));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e is ApiException ? e.message : '$e')));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final historyAsync = ref.watch(payrollHistoryProvider(employee.id));

    return Scaffold(
      appBar: AppBar(title: Text(employee.fullName)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => showRunPayrollDialog(context, employee.id),
        icon: const Icon(Icons.payments_outlined),
        label: Text(l10n.runPayroll),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(employee.position, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          StatusBadge(
            label: _statusLabel(l10n, employee.employmentStatus),
            color: _statusColor(context, employee.employmentStatus),
          ),
          const SizedBox(height: 8),
          Text('${l10n.baseSalary}: ${employee.baseSalary} DZD'),
          Text('${l10n.startDate}: ${employee.startDate}'),
          const Divider(height: 32),
          Text(l10n.payrollHistory, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          historyAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Text(error.toString()),
            data: (runs) {
              if (runs.isEmpty) {
                return Text(l10n.noPayrollHistoryYet);
              }
              return Column(
                children: runs
                    .map(
                      (run) => Card(
                        child: ListTile(
                          title: Text('${run.periodStart} – ${run.periodEnd}'),
                          subtitle: Text('${l10n.netPay}: ${run.netPay} DZD'),
                          trailing: run.paymentStatus == PayrollPaymentStatus.paid
                              ? StatusBadge(label: _paymentStatusLabel(l10n, run.paymentStatus), color: Colors.green)
                              : TextButton(
                                  onPressed: () => _markPaid(context, ref, run),
                                  child: Text(l10n.markPaid),
                                ),
                        ),
                      ),
                    )
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }
}
