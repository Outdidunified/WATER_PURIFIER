import 'dart:io';

import 'package:aquapulse_app/feature/service_installation_app/home/data/api.dart';
import 'package:aquapulse_app/feature/service_installation_app/home/domain/models/home_model.dart';

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
        throw Exception(response['message'] ?? 'Failed to fetch tasks');
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
  }) async {
    try {
      final response = await _api.updateTaskDetails(
        taskId: taskId,
        taskStatus: taskStatus,
        pendingReason: pendingReason,
        otp: otp,
        beforeImage: beforeImage,
        afterImage: afterImage,
      );
      return TaskUpdateResponse.fromJson(response);
    } catch (e) {
      // Fallback for other errors
      throw Exception('Error updating task: $e');
    }
  }
}
