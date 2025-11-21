// data/task_api_service.dart
import 'dart:convert';
import 'dart:io';
import 'package:ionhive_technician_app/core/controllers/session_controller.dart';
import 'package:ionhive_technician_app/core/core.dart';
import 'package:ionhive_technician_app/core/services/base_api_service.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:http/http.dart' as http;
import 'package:get/get.dart';
import 'package:http_parser/http_parser.dart'; // 👈 Required for MediaType
import 'urls.dart';

class TaskApiService extends BaseApiService {
  final SessionController _sessionController = Get.find<SessionController>();

  Future<Map<String, dynamic>> getAllAssignedTasks() async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;
    final assignedTechnicianId = _sessionController.technicianId.value;

    return makeRequest<Map<String, dynamic>>(
      url: TasknUrl.getAllAssignedTaskDetails.url,
      method: TasknUrl.getAllAssignedTaskDetails.method,
      body: {
        'user_id': userId,
        "email": email,
        "role_id": 2,
        "assigned_technician_id": assignedTechnicianId
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> updateTaskDetails({
    required int taskId,
    required String taskStatus,
    String? pendingReason,
    String? otp,
    File? beforeImage,
    File? afterImage,
    bool collectPayment = false,
    String? paymentMethod,
    String? razorpayPaymentId,
    String? razorpaySignature,
  }) async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;
    final technicianId = _sessionController.technicianId.value;
    const int roleId =
    2; // Hardcoded as per the backend requirement, now as int

    // Prepare form fields (all values must be strings)
    final Map<String, dynamic> updatesPayload = {
      'task_status': taskStatus,
      'pending_reason': pendingReason ?? '',
      'modified_by': technicianId,
      'modified_date': DateTime.now().toUtc().toIso8601String(),
    };

    if (paymentMethod != null) {
      updatesPayload['paymentMethod'] = paymentMethod;
    }

    if (collectPayment) {
      updatesPayload['collectPayment'] = true;
    }

    final fields = {
      'task_id': taskId.toString(),
      'user_id': userId.toString(),
      'role_id': roleId.toString(),
      'email': email,
      'technician_id': technicianId,
      if (otp != null) 'otp': otp,
      if (razorpayPaymentId != null) 'razorpay_payment_id': razorpayPaymentId,
      if (razorpaySignature != null) 'razorpay_signature': razorpaySignature,
      // Convert updates map to a JSON string
      'updates': jsonEncode(updatesPayload),
    };

    // Prepare files
    final List<http.MultipartFile> files = [];
    if (beforeImage != null) {
      files.add(await http.MultipartFile.fromPath(
        'image_before_service',
        beforeImage.path,
        contentType: MediaType('image', 'jpeg'), // 👈 or 'png', etc.
      ));
    }
    if (afterImage != null) {
      files.add(await http.MultipartFile.fromPath(
        'image_after_service',
        afterImage.path,
        contentType: MediaType('image', 'jpeg'), // 👈 or 'png', etc.
      ));
    }

    return makeMultipartRequest<Map<String, dynamic>>(
      url: TasknUrl.updateTaskDetails.url,
      method: TasknUrl.updateTaskDetails.method,
      fields: fields,
      files: files.isNotEmpty ? files : null,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> acceptDeclineTask({
    required int taskId,
    required String action,
    String? declineReason,
    DateTime? estimatedStart,
    DateTime? estimatedEnd,
  }) async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;
    final technicianId = _sessionController.technicianId.value;
    const int roleId = 2;

    final body = {
      'user_id': userId,
      'email': email,
      'role_id': roleId,
      'technician_id': technicianId,
      'task_id': taskId,
      'action': action,
      if (declineReason != null) 'decline_reason': declineReason,
      if (estimatedStart != null) 'estimated_start': estimatedStart
          .toIso8601String(),
      if (estimatedEnd != null) 'estimated_end': estimatedEnd.toIso8601String(),
    };

    return makeRequest<Map<String, dynamic>>(
      url: TasknUrl.acceptDeclineTask.url,
      method: TasknUrl.acceptDeclineTask.method,
      body: body,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> getTechnicianLeaveRequests({
    required String technicianId,
    required String email,
  }) async {
    return makeRequest<Map<String, dynamic>>(
      url: '${Core.baseUrl}/api/app/technicianhome/getTechnicianLeaveRequests',
      method: 'POST',
      body: {
        'technician_id': technicianId,
        'email': email,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> getRejectionHistory() async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;
    final assignedTechnicianId = _sessionController.technicianId.value;

    return makeRequest<Map<String, dynamic>>(
      url: '${Core.baseUrl}/api/app/technicianhome/getRejectionHistory',
      method: 'POST',
      body: {
        'user_id': userId,
        'email': email,
        'role_id': 2,
        'assigned_technician_id': assignedTechnicianId,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> updateInProgressTaskLeaveAction({
    required String technicianId,
    required String email,
    required int taskId,
    required String action,
  }) async {
    final body = {
      'technician_id': technicianId,
      'email': email,
      'task_id': taskId,
      'action': action,
    };

    return makeRequest<Map<String, dynamic>>(
      url: TasknUrl.updateInProgressTaskLeaveAction.url,
      method: TasknUrl.updateInProgressTaskLeaveAction.method,
      body: body,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> setupBleConnection({
    required String wpDeviceId,
    required String macId,
    required String taskId,
    required String technicianId,
  }) async {
    final body = {
      'wp_device_id': wpDeviceId,
      'mac_id': macId,
      'task_id': taskId,
      'technician_id': technicianId,
    };

    return makeRequest<Map<String, dynamic>>(
      url: TasknUrl.setupBleConnection.url,
      method: TasknUrl.setupBleConnection.method,
      body: body,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> storeBleAck(Map<String, dynamic> payload) async {
    return makeRequest<Map<String, dynamic>>(
      url: '${Core.baseUrl}/api/app/technicianhome/storeBleAck',
      method: 'POST',
      body: payload,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> storeMacId(Map<String, dynamic> payload) async {
    return makeRequest<Map<String, dynamic>>(
      url: '${Core.baseUrl}/api/app/technicianhome/storeMacId',
      method: 'POST',
      body: payload,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<List<Map<String, dynamic>>> getProductsWithPlans() async {
    return makeRequest<List<Map<String, dynamic>>>(
      url: TasknUrl.getProductsWithPlans.url,
      method: TasknUrl.getProductsWithPlans.method,
      responseParser: (data) {
        if (data is Map<String, dynamic> && data['data'] is List) {
          return (data['data'] as List).cast<Map<String, dynamic>>();
        }
        return [];
      },
    );
  }

  Future<Map<String, dynamic>> createRechargeOrder({
    required String technicianId,
    required String email,
    required int taskId,
    required String wpDeviceId,
    required String productModelId,
    required ProductPlan selectedPlan,
    required ProductDuration selectedDuration,
    required Map<String, dynamic> deliveryAddress,
    required double discountedPrice,
    required double discountAmount,
    required double gstAmount,
    required double grandTotal,
    required double priceWithGST,
    required double price,
    required double subtotal,
    required double codFee,
    String? modelType,
  }) async {
    final body = {
      'technician_id': technicianId,
      'email': email,
      'task_id': taskId,
      'wp_device_id': wpDeviceId,
      'productModelId': productModelId,
      'modelType': modelType,
      'selectedPlan': selectedPlan.toJson(),
      'selectedDuration': selectedDuration.toJson(),
      'deliveryAddress': deliveryAddress,
      'discountedPrice': discountedPrice,
      'discountAmount': discountAmount,
      'gstAmount': gstAmount,
      'grandTotal': grandTotal,
      'priceWithGST': priceWithGST,
      'price': price,
      'subtotal': subtotal,
      'codFee': codFee,
    };

    return makeRequest<Map<String, dynamic>>(
      url: TasknUrl.createRechargeOrder.url,
      method: TasknUrl.createRechargeOrder.method,
      body: body,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> getActiveSubscriptionDetails({
    required int userId,
    required String email,
    required int roleId,
  }) async {
    final body = {
      'user_id': userId,
      'email': email,
      'role_id': 3,
    };

    return makeRequest<Map<String, dynamic>>(
      url: TasknUrl.getActiveSubscriptionDetails.url,
      method: TasknUrl.getActiveSubscriptionDetails.method,
      body: body,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
