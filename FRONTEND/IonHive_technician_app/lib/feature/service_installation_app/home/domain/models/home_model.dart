// feature/service_installation_app/home/domain/models/home_model.dart
import 'package:flutter/material.dart';

class Product {
  final String? modelName;
  final String? modelType;
  final String? wpDeviceId;
  final Map<String, dynamic>? selectedPlan;
  final Map<String, dynamic>? selectedDuration;

  Product({
    this.modelName,
    this.modelType,
    this.wpDeviceId,
    this.selectedPlan,
    this.selectedDuration,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final dynamic modelTypeValue = json['model_type'] ?? json['modelType'];
    return Product(
      modelName: json['model_name'] != null ? json['model_name'].toString() : null,
      modelType: modelTypeValue != null ? modelTypeValue.toString() : null,
      wpDeviceId: json['wp_device_id'] != null ? json['wp_device_id'].toString() : null,
      selectedPlan: json['selectedPlan'] as Map<String, dynamic>?,
      selectedDuration: json['selectedDuration'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'model_name': modelName,
      'model_type': modelType,
      'wp_device_id': wpDeviceId,
      'selectedPlan': selectedPlan,
      'selectedDuration': selectedDuration,
    };
  }
}

class Address {
  final String? name;
  final String? phone;
  final String? street;
  final String? landmark;
  final String? city;
  final String? district;
  final String? state;
  final String? pincode;
  final String? email;

  Address({
    this.name,
    this.phone,
    this.street,
    this.landmark,
    this.city,
    this.district,
    this.state,
    this.pincode,
    this.email,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      name: json['name'] != null ? json['name'].toString() : null,
      phone: json['phone'] != null ? json['phone'].toString() : null,
      street: json['street'] != null ? json['street'].toString() : null,
      landmark: json['landmark'] != null ? json['landmark'].toString() : null,
      city: json['city'] != null ? json['city'].toString() : null,
      district: json['district'] != null ? json['district'].toString() : null,
      state: json['state'] != null ? json['state'].toString() : null,
      pincode: json['pincode'] != null ? json['pincode'].toString() : null,
      email: json['email'] != null ? json['email'].toString() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'street': street,
      'landmark': landmark,
      'city': city,
      'district': district,
      'state': state,
      'pincode': pincode,
      'email': email,
    };
  }
}

class PaymentInfo {
  final String? paymentType;
  final String? paymentStatus;
  final double? totalPrice;
  final double? subtotal;
  final double? securityDeposit;
  final double? gstAmount;
  final String? paymentMethod;
  final DateTime? paymentCollectedAt;
  final String? qrCode; // QR code for UPI payment

  const PaymentInfo({
    this.paymentType,
    this.paymentStatus,
    this.totalPrice,
    this.subtotal,
    this.securityDeposit,
    this.gstAmount,
    this.paymentMethod,
    this.paymentCollectedAt,
    this.qrCode,
  });

  factory PaymentInfo.fromJson(Map<String, dynamic> json) {
    double? parseDouble(dynamic value) {
      if (value == null) return null;
      if (value is num) return value.toDouble();
      return double.tryParse(value.toString());
    }

    DateTime? parseDate(dynamic value) {
      if (value == null) return null;
      try {
        return DateTime.parse(value.toString());
      } catch (_) {
        return null;
      }
    }

    final dynamic qrValue = json['qrCode'] ?? json['qr_code'];

    return PaymentInfo(
      paymentType: json['paymentType']?.toString(),
      paymentStatus: json['paymentStatus']?.toString(),
      totalPrice: parseDouble(json['totalPrice']),
      subtotal: parseDouble(json['subtotal']),
      securityDeposit: parseDouble(json['securityDeposit']),
      gstAmount: parseDouble(json['gstAmount']),
      paymentMethod: json['paymentMethod']?.toString(),
      paymentCollectedAt:
          parseDate(json['paymentCollectedAt'] ?? json['payment_collected_at']),
      qrCode: qrValue?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'paymentType': paymentType,
      'paymentStatus': paymentStatus,
      'totalPrice': totalPrice,
      'subtotal': subtotal,
      'securityDeposit': securityDeposit,
      'gstAmount': gstAmount,
      'paymentMethod': paymentMethod,
      'paymentCollectedAt': paymentCollectedAt?.toIso8601String(),
      if (qrCode != null) 'qrCode': qrCode,
    };
  }
}

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
  final Address? address;
  final Product? product;
  final PaymentInfo? paymentSnapshot;
  final String? orderPaymentStatus;
  final bool? paymentCollected;
  final String? paymentMethod;
  final bool? waitingStatus;
  final String? leaveAction;

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
    this.address,
    this.product,
    this.paymentSnapshot,
    this.orderPaymentStatus,
    this.paymentCollected,
    this.paymentMethod,
    this.waitingStatus,
    this.leaveAction,
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
      address: json['address'] != null
          ? Address.fromJson(json['address'] as Map<String, dynamic>)
          : null,
      product: json['product'] != null
          ? Product.fromJson(json['product'] as Map<String, dynamic>)
          : null,
      paymentSnapshot: json['payment_snapshot'] != null
          ? PaymentInfo.fromJson(json['payment_snapshot'] as Map<String, dynamic>)
          : null,
      orderPaymentStatus: json['order_snapshot'] != null && json['order_snapshot']['paymentStatus'] != null
          ? safeToString(json['order_snapshot']['paymentStatus'])
          : null,
      paymentCollected: json['paymentCollected'] is bool
          ? json['paymentCollected'] as bool?
          : json['collectPayment'] is bool
              ? json['collectPayment'] as bool?
              : null,
      paymentMethod: json['paymentMethod'] != null
          ? safeToString(json['paymentMethod'])
          : null,
      waitingStatus: json['waiting_status'] is bool
          ? json['waiting_status'] as bool?
          : null,
      leaveAction: json['leave_action'] != null
          ? safeToString(json['leave_action'])
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
      'address': address?.toJson(),
      'product': product?.toJson(),
      'payment_snapshot': paymentSnapshot?.toJson(),
      'waiting_status': waitingStatus,
      'leave_action': leaveAction,
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
  final String? qrCode;

  TaskUpdateResponse({
    required this.error,
    required this.message,
    this.qrCode,
  });

  factory TaskUpdateResponse.fromJson(Map<String, dynamic> json) {
    return TaskUpdateResponse(
      error: json['error'] as bool? ?? true,
      message: json['message']?.toString() ?? 'Unknown error',
      qrCode: json['qrCode']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'error': error,
      'message': message,
      'qrCode': qrCode,
    };
  }
}
