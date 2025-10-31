class LeaveRequest {
  final String id;
  final String technicianId;
  final String technicianName;
  final String technicianEmail;
  final DateTime fromDate;
  final DateTime toDate;
  final int numberOfDays;
  final String? reason;
  final String status;
  final DateTime requestedDate;
  final DateTime createdAt;
  final DateTime? approvalDate;
  final String? approvedBy;
  final String? rejectionReason;

  LeaveRequest({
    required this.id,
    required this.technicianId,
    required this.technicianName,
    required this.technicianEmail,
    required this.fromDate,
    required this.toDate,
    required this.numberOfDays,
    this.reason,
    required this.status,
    required this.requestedDate,
    required this.createdAt,
    this.approvalDate,
    this.approvedBy,
    this.rejectionReason,
  });

  factory LeaveRequest.fromJson(Map<String, dynamic> json) {
    return LeaveRequest(
      id: json['_id'] ?? '',
      technicianId: json['technician_id'] ?? '',
      technicianName: json['technician_name'] ?? '',
      technicianEmail: json['technician_email'] ?? '',
      fromDate: json['from_date'] != null
          ? DateTime.parse(json['from_date'].toString())
          : DateTime.now(),
      toDate: json['to_date'] != null
          ? DateTime.parse(json['to_date'].toString())
          : DateTime.now(),
      numberOfDays: json['number_of_days'] ?? 0,
      reason: json['reason'],
      status: json['status'] ?? 'Requested',
      requestedDate: json['requested_date'] != null
          ? DateTime.parse(json['requested_date'].toString())
          : DateTime.now(),
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'].toString())
          : DateTime.now(),
      approvalDate: json['approval_date'] != null
          ? DateTime.parse(json['approval_date'].toString())
          : null,
      approvedBy: json['approved_by'],
      rejectionReason: json['rejection_reason'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'technician_id': technicianId,
      'technician_name': technicianName,
      'technician_email': technicianEmail,
      'from_date': fromDate.toIso8601String(),
      'to_date': toDate.toIso8601String(),
      'number_of_days': numberOfDays,
      'reason': reason,
      'status': status,
      'requested_date': requestedDate.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'approval_date': approvalDate?.toIso8601String(),
      'approved_by': approvedBy,
      'rejection_reason': rejectionReason,
    };
  }

  String getStatusColor() {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'requested':
      default:
        return 'amber';
    }
  }
}
