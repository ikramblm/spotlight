import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../l10n/app_localizations.dart';
import 'add_employee_dialog.dart';
import 'employee_detail_screen.dart';
import 'employees_controller.dart';

class EmployeeListScreen extends ConsumerWidget {
  const EmployeeListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final employeesAsync = ref.watch(employeeListProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.employeesTitle)),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showAddEmployeeDialog(context),
        child: const Icon(Icons.person_add),
      ),
      body: employeesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (employees) {
          if (employees.isEmpty) {
            return Center(child: Text(l10n.noEmployeesYet));
          }
          return ListView.builder(
            itemCount: employees.length,
            itemBuilder: (context, index) {
              final employee = employees[index];
              return ListTile(
                title: Text(employee.fullName),
                subtitle: Text(employee.position),
                trailing: Text('${employee.baseSalary} DZD'),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => EmployeeDetailScreen(employee: employee)),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
