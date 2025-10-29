import 'dart:io';

import 'package:ionhive_technician_app/feature/service_installation_app/home/data/api.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';

class TaskRepository {
  final TaskApiService _api = TaskApiService();

  Future<List<Task>> getAllAssignedTasks() async {
    try {
      final response = await _api.getAllAssignedTasks();

      if (response['error'] == false) {
        return (response['data'] as List<dynamic>)
            .map((taskJson) => Task.fromJson(taskJson))
            .toList();
      } else {
        // If no tasks found (status 402), return empty list instead of throwing
        final message = response['message'] ?? '';
        if (message.contains('No tasks found')) {
          return [];
        } else {
          throw Exception(response['message'] ?? 'Failed to fetch tasks');
        }
      }
    } catch (e) {
      throw Exception('Error fetching tasks: $e');
    }
  }

  Future<TaskUpdateResponse> updateTaskDetails({
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
    try {
      final response = await _api.updateTaskDetails(
        taskId: taskId,
        taskStatus: taskStatus,
        pendingReason: pendingReason,
        otp: otp,
        beforeImage: beforeImage,
        afterImage: afterImage,
        collectPayment: collectPayment,
        paymentMethod: paymentMethod,
        razorpayPaymentId: razorpayPaymentId,
        razorpaySignature: razorpaySignature,
      );
      return TaskUpdateResponse.fromJson(response);
    } catch (e) {
      // Fallback for other errors
      throw Exception('Error updating task: $e');
    }
  }

  Future<TaskUpdateResponse> acceptDeclineTask({
    required int taskId,
    required String action,
    String? declineReason,
    DateTime? estimatedEnd,
  }) async {
    try {
      final response = await _api.acceptDeclineTask(
        taskId: taskId,
        action: action,
        declineReason: declineReason,
        estimatedEnd: estimatedEnd,
      );
      return TaskUpdateResponse.fromJson(response);
    } catch (e) {
      throw Exception('Error accepting/declining task: $e');
    }
  }

  Future<List<dynamic>> getTechnicianLeaveRequests({
    required String technicianId,
    required String email,
  }) async {
    try {
      final response = await _api.getTechnicianLeaveRequests(
        technicianId: technicianId,
        email: email,
      );

      if (response['error'] == false) {
        return response['data'] as List<dynamic>;
      } else {
        throw Exception(response['message'] ?? 'Failed to fetch leave requests');
      }
    } catch (e) {
      throw Exception('Error fetching leave requests: $e');
    }
  }

  Future<TaskUpdateResponse> updateInProgressTaskLeaveAction({
    required String technicianId,
    required String email,
    required int taskId,
    required String action,
  }) async {
    try {
      final response = await _api.updateInProgressTaskLeaveAction(
        technicianId: technicianId,
        email: email,
        taskId: taskId,
        action: action,
      );
      return TaskUpdateResponse.fromJson(response);
    } catch (e) {
      throw Exception('Error updating task leave action: $e');
    }
  }

  Future<Map<String, dynamic>> setupBleConnection({
    required String wpDeviceId,
    required String macId,
    required String taskId,
    required String technicianId,
  }) async {
    try {
      final response = await _api.setupBleConnection(
        wpDeviceId: wpDeviceId,
        macId: macId,
        taskId: taskId,
        technicianId: technicianId,
      );
      return response as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Error setting up BLE connection: $e');
    }
  }
}
