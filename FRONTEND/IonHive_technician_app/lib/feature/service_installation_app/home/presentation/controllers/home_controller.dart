import 'dart:io';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:ionhive_technician_app/feature/service_installation_app/home/domain/repositories/home_repository.dart';
import 'package:ionhive_technician_app/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';

class TechnicianController extends GetxController {
  final TaskRepository taskRepository;
  final RxBool _isFetching = false.obs; // Flag to prevent multiple fetches

  // Task types map
  final Map<int, String> taskTypes = {1: 'Installation', 2: 'Service'};

  // Reactive state variables
  final RxList<Task> allTasks = <Task>[].obs;
  final RxList<Task> filteredTasks = <Task>[].obs;
  final RxString selectedStatusFilter = 'Pending'.obs;
  final RxInt selectedTaskType = 1.obs; // 1 for Installation, 2 for Service
  final RxBool isRefreshing = false.obs;
  final RxString errorMessageTask = ''.obs;
  final RxString errorMessageTaskUpdation = ''.obs;

  TechnicianController(this.taskRepository);

  @override
  void onInit() {
    super.onInit();
    loadTasks();
  }

  Future<void> loadTasks() async {
    if (_isFetching.value) return; // Skip if already fetching

    try {
      _isFetching.value = true;
      isRefreshing.value = true;
      errorMessageTask.value = '';

      final tasksData = await taskRepository.getAllAssignedTasks();
      debugPrint('Raw tasks data: $tasksData');
      allTasks.value = tasksData;
      filterTasksByType(selectedStatusFilter.value, selectedTaskType.value);

      debugPrint('Tasks fetched: ${allTasks.length}');
    } catch (e) {
      final error = e.toString();
      debugPrint('Error details: $error');

      if (error.contains('Resource not found') ||
          error.contains('No tasks found')) {
        errorMessageTask.value =
            '🔍 No tasks found for this technician (Status: 404)';
      } else {
        errorMessageTask.value = 'Failed to load tasks: $error';
      }

      debugPrint('Error loading tasks: $e');
    } finally {
      _isFetching.value = false;
      isRefreshing.value = false;
      allTasks.refresh();
      filteredTasks.refresh();
    }
  }

  Future<void> updateTask({
    required int taskId,
    required String taskStatus,
    String? pendingReason,
    String? otp,
    File? beforeImage,
    File? afterImage,
  }) async {
    try {
      isRefreshing.value = true;
      final response = await taskRepository.updateTaskDetails(
        taskId: taskId,
        taskStatus: taskStatus,
        pendingReason: pendingReason,
        otp: otp,
        beforeImage: beforeImage,
        afterImage: afterImage,
      );

      if (!response.error) {
        Get.back();
        CustomSnackbar.showSuccess(message: response.message);
        await loadTasks();
      } else {
        CustomSnackbar.showError(message: response.message);
      }
    } catch (e) {
      errorMessageTaskUpdation.value = e.toString();
      debugPrint('Error updating task: $e');
      rethrow;
    } finally {
      isRefreshing.value = false;
    }
  }

  Future<void> acceptDeclineTask({
    required int taskId,
    required String action,
    String? declineReason,
    DateTime? estimatedEnd,
  }) async {
    try {
      isRefreshing.value = true;
      final response = await taskRepository.acceptDeclineTask(
        taskId: taskId,
        action: action,
        declineReason: declineReason,
        estimatedEnd: estimatedEnd,
      );

      if (!response.error) {
        CustomSnackbar.showSuccess(message: response.message);
        await loadTasks();
      } else {
        CustomSnackbar.showError(message: response.message);
      }
    } catch (e) {
      errorMessageTaskUpdation.value = e.toString();
      debugPrint('Error accepting/declining task: $e');
      rethrow;
    } finally {
      isRefreshing.value = false;
    }
  }

  void filterTasks(String? status) {
    filterTasksByType(status, selectedTaskType.value);
  }

  void switchTaskType(int taskType) {
    selectedTaskType.value = taskType;
    filterTasksByType(selectedStatusFilter.value, taskType);
  }

  int getTaskCount(String status) {
    final count = allTasks
        .where((task) => task.taskStatus?.toLowerCase() == status.toLowerCase())
        .length;
    debugPrint('Task count (status: $status): $count');
    return count;
  }

  int getTaskCountByType(String status, int taskType) {
    final count = allTasks
        .where((task) =>
            task.taskStatus?.toLowerCase() == status.toLowerCase() &&
            task.taskType == taskType)
        .length;
    debugPrint('Task count (status: $status, type: $taskType): $count');
    return count;
  }

  void filterTasksByType(String? status, int taskType) {
    selectedStatusFilter.value = status ?? 'Pending';
    filteredTasks.value = allTasks
        .where((task) =>
            task.taskType == taskType &&
            (status == null ||
                task.taskStatus?.toLowerCase() == status.toLowerCase()))
        .toList();
    filteredTasks.refresh();
    debugPrint(
        'Filtered tasks by type (status: ${selectedStatusFilter.value}, type: $taskType): ${filteredTasks.length}');
  }

  void resetState() {
    allTasks.clear();
    filteredTasks.clear();
    selectedStatusFilter.value = 'Pending';
    selectedTaskType.value = 1;
    errorMessageTask.value = '';
    errorMessageTaskUpdation.value = '';
    isRefreshing.value = false;
    debugPrint('Controller state reset');
  }

  @override
  void onClose() {
    // Avoid resetting state to preserve data
    super.onClose();
  }
}
