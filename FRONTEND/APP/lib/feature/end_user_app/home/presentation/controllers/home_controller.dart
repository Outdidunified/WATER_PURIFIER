import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/repositories/home_repository.dart';
import 'package:get/get.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/home_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/device_model.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';

class SubscriptionController extends GetxController {
  final SubscriptionRepository _repository = SubscriptionRepository();

  // List of all orders/subscriptions
  RxList<Order> orders = <Order>[].obs;
  // Currently selected/active subscription for display
  Rx<Order?> activeSubscription = Rx<Order?>(null);
  Rx<DeviceData?> deviceData = Rx<DeviceData?>(null);
  String? _lastSelectedSmartOrderId;
  RxBool isLoading = false.obs;
  RxString errorMessage = ''.obs;

  Timer? _telemetryTimer;

  @override
  void onInit() {
    super.onInit();
    fetchOrders();
    fetchLatestFeatureValues(showLoading: true);
    _startTelemetryPolling();
  }

  @override
  void onClose() {
    _telemetryTimer?.cancel();
    super.onClose();
  }

  void _startTelemetryPolling() {
    // Start polling every 5 seconds for telemetry data
    _telemetryTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (activeSubscription.value != null) {
        fetchLatestFeatureValues();
      }
    });
  }

  Future<void> fetchOrders() async {
    isLoading.value = true;

    try {
      final response = await _repository.getOrdersByUserId();
      final sessionController = Get.find<SessionController>();

      if (!response.error) {
        errorMessage.value = '';

        if (response.data.isEmpty) {
          // No orders found
          orders.clear();
          activeSubscription.value = null;
          await sessionController.saveSession(
            userId: sessionController.userId.value,
            emailId: sessionController.emailId.value,
            token: sessionController.token.value,
            userRole: sessionController.userRole.value,
            isSubscribed: false,
            username: sessionController.username.value,
            technicianId: sessionController.technicianId.value,
          );
        } else {
          // Save orders list
          orders.assignAll(response.data);

          // Determine initial active subscription prioritizing previous smart selection
          final smartOrders = response.data.where((order) => order.modelType?.toLowerCase() == 'smart').toList();
          Order? initialActive;

          if (_lastSelectedSmartOrderId != null) {
            initialActive = smartOrders.firstWhere(
              (order) => order.id == _lastSelectedSmartOrderId,
              orElse: () => smartOrders.isNotEmpty ? smartOrders.first : response.data.first,
            );
          } else if (smartOrders.isNotEmpty) {
            initialActive = smartOrders.first;
          }

          activeSubscription.value = initialActive ?? response.data.first;
          if (smartOrders.isNotEmpty) {
            _lastSelectedSmartOrderId = activeSubscription.value?.id;
          }

          // Pick first active order/device for subscription flag
          final firstOrder = response.data.first;
          await sessionController.saveSession(
            userId: sessionController.userId.value,
            emailId: sessionController.emailId.value,
            token: sessionController.token.value,
            userRole: sessionController.userRole.value,
            isSubscribed: true,
            username: sessionController.username.value,
            technicianId: sessionController.technicianId.value,
          );
        }
      } else {
        errorMessage.value = response.message;
      }
    } catch (e) {
      errorMessage.value = "Note: $e";
    } finally {
      isLoading.value = false;
    }
  }

  // Method to select a specific subscription
  void selectSubscription(Order order) {
    activeSubscription.value = order;
    if (order.modelType?.toLowerCase() == 'smart') {
      _lastSelectedSmartOrderId = order.id;
    }
    deviceData.value = null;
    fetchLatestFeatureValues(showLoading: true);
  }

  Future<void> fetchActiveSubscription() async {
    // Alias for backward compatibility - just fetch orders
    await fetchOrders();
  }

  Future<void> fetchLatestFeatureValues({bool showLoading = false}) async {
    if (showLoading) {
      isLoading.value = true;
    }
    // Don't clear error message until we have a successful response
    // This allows us to keep showing the error banner with cached data

    try {
      // Get the session controller to access the user ID
      final sessionController = Get.find<SessionController>();

      // Get the device ID from the active subscription if available
      String deviceId = "";
      if (activeSubscription.value != null) {
        deviceId = activeSubscription.value!.wpDeviceId;
      }

      // Only proceed if we have a valid device ID
      if (deviceId.isEmpty) {
        if (errorMessage.value.isEmpty) {
          errorMessage.value =
              "No active device found. Please check your subscription.";
        }
        isLoading.value = false;
        return;
      }

      final response = await _repository.getTelemetryData(
        wpDeviceId: deviceId,
      );

      if (!response.error) {
        // Update device data - set to null if no data available
        deviceData.value = response.data;
        // Clear error message on success only if fetchActiveSubscription didn't set one
        if (errorMessage.value.contains('feature values')) {
          errorMessage.value = '';
        }
      } else {
        // Set error message but don't clear existing data
        // Only set error if active subscription fetch didn't already set one
        if (errorMessage.value.isEmpty) {
          errorMessage.value = response.message;
        }
      }
    } catch (e) {
      // Set error message but don't clear existing data
      // Only set error if active subscription fetch didn't already set one
      if (errorMessage.value.isEmpty) {
        errorMessage.value = "Note: $e";
      }
    } finally {
      isLoading.value = false;
    }
  }

  Future<Map<String, dynamic>> storeBleAck(Map<String, dynamic> payload) async {
    try {
      final response = await _repository.storeBleAck(payload);
      return response;
    } catch (e) {
      debugPrint('Error storing BLE ack: $e');
      rethrow;
    }
  }
}
