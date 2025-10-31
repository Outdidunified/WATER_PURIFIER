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

  Future<String?> generateQR(int taskId, String taskStatus) async {
    try {
      final response = await taskRepository.updateTaskDetails(
        taskId: taskId,
        taskStatus: taskStatus,
        paymentMethod: 'QR',
      );
      if (!response.error) {
        return response.qrCode;
      } else {
        throw Exception(response.message);
      }
    } catch (e) {
      debugPrint('Error generating QR: $e');
      rethrow;
    }
  }

  Future<void> updateTask({
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
      isRefreshing.value = true;
      final response = await taskRepository.updateTaskDetails(
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

      if (!response.error) {
        if (Get.isDialogOpen ?? false) Get.back();
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

  Future<List<dynamic>> getTechnicianLeaveRequests({
    required String technicianId,
    required String email,
  }) async {
    try {
      return await taskRepository.getTechnicianLeaveRequests(
        technicianId: technicianId,
        email: email,
      );
    } catch (e) {
      debugPrint('Error fetching leave requests: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> setupBleConnection({
    required String wpDeviceId,
    required String macId,
    required String taskId,
    required String technicianId,
  }) async {
    try {
      return await taskRepository.setupBleConnection(
        wpDeviceId: wpDeviceId,
        macId: macId,
        taskId: taskId,
        technicianId: technicianId,
      );
    } catch (e) {
      debugPrint('Error setting up BLE connection: $e');
      rethrow;
    }
  }

  Future<void> updateInProgressTaskLeaveAction({
    required String technicianId,
    required String email,
    required int taskId,
    required String action,
  }) async {
    try {
      isRefreshing.value = true;
      final response = await taskRepository.updateInProgressTaskLeaveAction(
        technicianId: technicianId,
        email: email,
        taskId: taskId,
        action: action,
      );

      if (!response.error) {
        CustomSnackbar.showSuccess(message: response.message);
        await loadTasks();
      } else {
        CustomSnackbar.showError(message: response.message);
      }
    } catch (e) {
      errorMessageTaskUpdation.value = e.toString();
      debugPrint('Error updating task leave action: $e');
      rethrow;
    } finally {
      isRefreshing.value = false;
    }
  }

  void filterTasks(String? status) {
    selectedStatusFilter.value = status ?? 'Pending';
    filteredTasks.value = allTasks
        .where((task) =>
            status == null ||
            task.taskStatus?.toLowerCase() == status.toLowerCase())
        .toList();
    filteredTasks.refresh();
    debugPrint(
        'Filtered tasks by status: ${selectedStatusFilter.value} - Count: ${filteredTasks.length}');
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
