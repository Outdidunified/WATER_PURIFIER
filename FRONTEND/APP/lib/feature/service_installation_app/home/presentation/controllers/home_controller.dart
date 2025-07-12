import 'dart:io';
import 'package:aquapulse_app/feature/service_installation_app/home/domain/models/home_model.dart';
import 'package:aquapulse_app/feature/service_installation_app/home/domain/repositories/home_repository.dart';
import 'package:aquapulse_app/utils/widgets/snackbar/custom_snackbar.dart';
import 'package:flutter/foundation.dart';
import 'package:get/get.dart';

class TechnicianController extends GetxController {
  final TaskRepository taskRepository;
  final RxBool _isFetching = false.obs; // Flag to prevent multiple fetches

  // Reactive state variables
  final RxList<Task> allTasks = <Task>[].obs;
  final RxList<Task> filteredTasks = <Task>[].obs;
  final RxString selectedStatusFilter = 'Pending'.obs;
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
      filterTasks(selectedStatusFilter.value);

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

  void filterTasks(String? status) {
    selectedStatusFilter.value = status ?? 'Pending';
    if (status == null) {
      filteredTasks.value = List.from(allTasks);
    } else {
      filteredTasks.value = allTasks
          .where(
              (task) => task.taskStatus?.toLowerCase() == status.toLowerCase())
          .toList();
    }
    filteredTasks.refresh();
    debugPrint(
        'Filtered tasks (status: ${selectedStatusFilter.value}): ${filteredTasks.length}');
  }

  int getTaskCount(String status) {
    final count = allTasks
        .where((task) => task.taskStatus?.toLowerCase() == status.toLowerCase())
        .length;
    debugPrint('Task count (status: $status): $count');
    return count;
  }

  void resetState() {
    allTasks.clear();
    filteredTasks.clear();
    selectedStatusFilter.value = 'Pending';
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
