class DashboardFinancial {
  final String revenueThisMonth;
  final String outstandingBalance;

  const DashboardFinancial({required this.revenueThisMonth, required this.outstandingBalance});

  factory DashboardFinancial.fromJson(Map<String, dynamic> json) {
    return DashboardFinancial(
      revenueThisMonth: json['revenueThisMonth'] as String,
      outstandingBalance: json['outstandingBalance'] as String,
    );
  }
}

/// Which fields come back depends on the requester's own permissions (backend §8: "single
/// round trip" aggregate) - every field here is nullable, and the UI only renders the cards
/// it actually received.
class DashboardSummary {
  final int? todaysEventsCount;
  final int? upcomingBookingsCount;
  final int? pendingBookingRequestsCount;
  final int? activeConfiscationsCount;
  final DashboardFinancial? financial;

  const DashboardSummary({
    this.todaysEventsCount,
    this.upcomingBookingsCount,
    this.pendingBookingRequestsCount,
    this.activeConfiscationsCount,
    this.financial,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      todaysEventsCount: json['todaysEventsCount'] as int?,
      upcomingBookingsCount: json['upcomingBookingsCount'] as int?,
      pendingBookingRequestsCount: json['pendingBookingRequestsCount'] as int?,
      activeConfiscationsCount: json['activeConfiscationsCount'] as int?,
      financial: json['financial'] != null
          ? DashboardFinancial.fromJson(json['financial'] as Map<String, dynamic>)
          : null,
    );
  }
}
