import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/models/active_subscription_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/repositories/telemetry_repository.dart';
import 'package:get/get.dart';

class ActiveSubscriptionController extends GetxController {
  final TelemetryRepository _repository = TelemetryRepository();

  var isLoading = false.obs;
  var errorMessage = ''.obs;
  var subscriptions = <SubscriptionItem>[].obs;

  Future<void> fetchActiveSubscriptions(int userId, String email) async {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      final responseJson = await _repository.fetchActiveSubscriptions(userId, email);
      final resp = ActiveSubscriptionResponse.fromJson(responseJson);
      if (!resp.error) {
        subscriptions.value = resp.data;
      } else {
        errorMessage.value = resp.message;
      }
    } catch (e) {
      errorMessage.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }
}