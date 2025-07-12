class ServiceRequestResponse {
  final bool error;
  final String message;
  final ServiceRequestData? data;

  ServiceRequestResponse({
    required this.error,
    required this.message,
    this.data,
  });

  factory ServiceRequestResponse.fromJson(Map<String, dynamic> json) {
    return ServiceRequestResponse(
      error: json['error'] as bool,
      message: json['message'] as String,
      data: json['data'] != null
          ? ServiceRequestData.fromJson(json['data'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ServiceRequestData {
  final int taskId;
  final String taskStatus;
  final int taskType;
  final int? assignedTechnicianId;
  final String? pendingReason;
  final DateTime createdDate;
  final String? modifiedBy;
  final DateTime? modifiedDate;
  final DateTime? assignedDate;
  final String taskDescription;
  final List<String> imageBeforeService;
  final List<String> imageAfterService;
  final int taskCreatedByUserId;
  final String taskCreatedByUserEmail;
  final int roleId;
  final String? otp;
  final String id;

  ServiceRequestData({
    required this.taskId,
    required this.taskStatus,
    required this.taskType,
    this.assignedTechnicianId,
    this.pendingReason,
    required this.createdDate,
    this.modifiedBy,
    this.modifiedDate,
    this.assignedDate,
    required this.taskDescription,
    required this.imageBeforeService,
    required this.imageAfterService,
    required this.taskCreatedByUserId,
    required this.taskCreatedByUserEmail,
    required this.roleId,
    this.otp,
    required this.id,
  });

  factory ServiceRequestData.fromJson(Map<String, dynamic> json) {
    return ServiceRequestData(
      taskId: json['task_id'] as int,
      taskStatus: json['task_status'] as String,
      taskType: json['task_type'] as int,
      assignedTechnicianId: json['assigned_technician_id'] as int?,
      pendingReason: json['pending_reason'] as String?,
      createdDate: DateTime.parse(json['created_date'] as String),
      modifiedBy: json['modified_by'] as String?,
      modifiedDate: json['modified_date'] != null
          ? DateTime.parse(json['modified_date'] as String)
          : null,
      assignedDate: json['assigned_date'] != null
          ? DateTime.parse(json['assigned_date'] as String)
          : null,
      taskDescription: json['task_description'] as String,
      imageBeforeService: (json['image_before_service'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      imageAfterService: (json['image_after_service'] as List<dynamic>)
          .map((e) => e as String)
          .toList(),
      taskCreatedByUserId: json['task_created_by_user_id'] as int,
      taskCreatedByUserEmail: json['task_created_by_user_email'] as String,
      roleId: json['role_id'] as int,
      otp: json['otp'] as String?,
      id: json['_id'] as String,
    );
  }
}
