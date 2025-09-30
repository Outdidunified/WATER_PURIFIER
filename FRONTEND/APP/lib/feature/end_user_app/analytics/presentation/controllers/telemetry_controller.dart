import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/models/telemetry_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/repositories/telemetry_repository.dart';
import 'package:get/get.dart';

class TelemetryController extends GetxController {
  final TelemetryRepository _repository = TelemetryRepository();

  var isLoading = false.obs;
  var telemetryResponse = Rxn<TelemetryResponse>();
  var errorMessage = ''.obs;
  var selectedDeviceId = ''.obs;

  Future<void> fetchTelemetry(String deviceId) async {
    if (deviceId.isEmpty) return;

    isLoading.value = true;
    errorMessage.value = '';
    telemetryResponse.value = null; // Clear previous data
    selectedDeviceId.value = deviceId;

    try {
      final response = await _repository.fetchTelemetry(deviceId);
      telemetryResponse.value = response;
    } catch (e) {
      errorMessage.value = e.toString();
    } finally {
      isLoading.value = false;
    }
  }
}