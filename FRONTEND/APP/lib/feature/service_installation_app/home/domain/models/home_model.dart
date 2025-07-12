// feature/service_installation_app/home/domain/models/home_model.dart
import 'package:flutter/material.dart';

class Task {
  final String? id;
  final int? taskId;
  final String? taskStatus; // Kept as String, nullable for robustness
  final String? assignedTechnicianId;
  final String? pendingReason;
  final DateTime? createdDate;
  final String? modifiedBy;
  final DateTime? modifiedDate;
  final DateTime? assignedDate;
  final int? taskType;
  final String? taskDescription;
  final List<String>? imageBeforeService;
  final List<String>? imageAfterService;
  final int? taskCreatedByUserId;
  final String? taskCreatedByUserEmail;
  final String? otp;
  final String? assignedBy;
  final int? otd;
  final String? wpDeviceId;

  Task({
    this.id,
    this.taskId,
    this.taskStatus,
    this.assignedTechnicianId,
    this.pendingReason,
    this.createdDate,
    this.modifiedBy,
    this.modifiedDate,
    this.assignedDate,
    this.taskType,
    this.taskDescription,
    this.imageBeforeService,
    this.imageAfterService,
    this.taskCreatedByUserId,
    this.taskCreatedByUserEmail,
    this.otp,
    this.assignedBy,
    this.otd,
    this.wpDeviceId,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    // Helper function to parse date with fallback
    DateTime? parseDate(String? dateStr) {
      if (dateStr == null || dateStr.isEmpty) return null;
      try {
        return DateTime.parse(dateStr);
      } catch (e) {
        debugPrint('Invalid date format for $dateStr: $e');
        return null;
      }
    }

    // Safely handle lists, returning empty list if null or invalid
    List<String>? parseStringList(dynamic list) {
      if (list == null) return [];
      try {
        return List<String>.from(list.map((x) => x.toString()));
      } catch (e) {
        debugPrint('Invalid list format: $e');
        return [];
      }
    }

    // Helper function to safely convert any value to String
    String? safeToString(dynamic value) {
      if (value == null) return null;
      return value.toString();
    }

    return Task(
      id: json['_id'] != null ? safeToString(json['_id']) : null,
      taskId: json['task_id'] is int
          ? json['task_id'] as int?
          : json['task_id'] != null
              ? int.tryParse(json['task_id'].toString())
              : null,
      taskStatus: json['task_status'] != null
          ? safeToString(json['task_status'])
          : 'Unknown',
      assignedTechnicianId: json['assigned_technician_id'] != null
          ? safeToString(json['assigned_technician_id'])
          : null,
      pendingReason: json['pending_reason'] != null
          ? safeToString(json['pending_reason'])
          : null,
      createdDate: parseDate(json['created_date'] is String
          ? json['created_date'] as String?
          : json['created_date']?.toString()),
      modifiedBy: json['modified_by'] != null
          ? safeToString(json['modified_by'])
          : null,
      modifiedDate: parseDate(json['modified_date'] is String
          ? json['modified_date'] as String?
          : json['modified_date']?.toString()),
      assignedDate: parseDate(json['assigned_date'] is String
          ? json['assigned_date'] as String?
          : json['assigned_date']?.toString()),
      taskType: json['task_type'] is int
          ? json['task_type'] as int?
          : json['task_type'] != null
              ? int.tryParse(json['task_type'].toString())
              : null,
      taskDescription: json['task_description'] != null
          ? safeToString(json['task_description'])
          : null,
      imageBeforeService: parseStringList(json['image_before_service']),
      imageAfterService: parseStringList(json['image_after_service']),
      taskCreatedByUserId: json['task_created_by_user_id'] is int
          ? json['task_created_by_user_id'] as int?
          : json['task_created_by_user_id'] != null
              ? int.tryParse(json['task_created_by_user_id'].toString())
              : null,
      taskCreatedByUserEmail: json['task_created_by_user_email'] != null
          ? safeToString(json['task_created_by_user_email'])
          : null,
      otp: json['otp'] != null ? safeToString(json['otp']) : null,
      assignedBy: json['assigned_by'] != null
          ? safeToString(json['assigned_by'])
          : json['created_by'] != null
              ? safeToString(json['created_by'])
              : null,
      otd: json['otd'] is int
          ? json['otd'] as int?
          : json['otd'] != null
              ? int.tryParse(json['otd'].toString())
              : null,
      wpDeviceId: json['wp_device_id'] != null
          ? safeToString(json['wp_device_id'])
          : null,
    );
  }

  // Convert back to JSON with status as int if required by API
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'task_id': taskId,
      'task_status':
          _mapStatusToInt(taskStatus), // Convert String to int for API
      'assigned_technician_id': assignedTechnicianId,
      'pending_reason': pendingReason,
      'created_date': createdDate?.toIso8601String(),
      'modified_by': modifiedBy,
      'modified_date': modifiedDate?.toIso8601String(),
      'assigned_date': assignedDate?.toIso8601String(),
      'task_type': taskType,
      'task_description': taskDescription,
      'image_before_service': imageBeforeService,
      'image_after_service': imageAfterService,
      'task_created_by_user_id': taskCreatedByUserId,
      'task_created_by_user_email': taskCreatedByUserEmail,
      'otp': otp,
      'assigned_by': assignedBy,
      'otd': otd,
      'wp_device_id': wpDeviceId,
    };
  }

  // Helper to map String status back to int for API updates
  static int? _mapStatusToInt(String? status) {
    if (status == null) return null;
    switch (status.toLowerCase()) {
      case 'pending':
        return 0;
      case 'in progress':
        return 1;
      case 'completed':
        return 2;
      case 'unknown':
        return null;
      default:
        return null; // Handle unexpected values
    }
  }
}

class TaskUpdateResponse {
  final bool error;
  final String message;

  TaskUpdateResponse({
    required this.error,
    required this.message,
  });

  factory TaskUpdateResponse.fromJson(Map<String, dynamic> json) {
    return TaskUpdateResponse(
      error: json['error'] as bool? ?? true,
      message: json['message']?.toString() ?? 'Unknown error',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'error': error,
      'message': message,
    };
  }
}
