import 'dart:async';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/repositories/home_repository.dart';
import 'package:get/get.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/domain/models/home_model.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';

class SubscriptionListController extends GetxController {
  final SubscriptionRepository _repository = SubscriptionRepository();

  // List of all orders/subscriptions
  RxList<Order> orders = <Order>[].obs;
  RxBool isLoading = false.obs;
  RxString errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchOrders();
  }

  Future<void> fetchOrders() async {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      final response = await _repository.getOrdersByUserId();
      final sessionController = Get.find<SessionController>();

      if (response.error) {
        errorMessage.value = response.message;
      } else {
        orders.assignAll(response.data);
      }
    } catch (e) {
      errorMessage.value = 'Failed to fetch orders: $e';
    } finally {
      isLoading.value = false;
    }
  }
}