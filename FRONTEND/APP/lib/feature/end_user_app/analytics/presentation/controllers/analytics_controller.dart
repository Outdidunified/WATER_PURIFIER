import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/repositories/analytics_repository.dart';
import 'package:get/get.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/models/analytics_model.dart';

class AnalyticsController extends GetxController {
  final AnalyticsRepository _repository = AnalyticsRepository();

  var isLoading = false.obs;
  var analyticsResponse = Rxn<AnalyticsResponse>();
  var errorMessage = ''.obs;

  @override
  void onInit() {
    super.onInit();
    fetchAnalytics();
  }

  Future<void> fetchAnalytics() async {
    isLoading.value = true;
    errorMessage.value = '';

    try {
      final response = await _repository.fetchAnalytics();
      if (!response.error) {
        analyticsResponse.value = response;
      } else {
        errorMessage.value = response.message;
      }
    } catch (e) {
      errorMessage.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }
}
