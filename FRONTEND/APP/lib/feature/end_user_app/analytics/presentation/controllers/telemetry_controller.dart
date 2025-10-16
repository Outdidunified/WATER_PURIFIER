import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/models/telemetry_model.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/repositories/telemetry_repository.dart';
import 'package:get/get.dart';

class TelemetryController extends GetxController {
  final TelemetryRepository _repository = TelemetryRepository();

  var isLoading = false.obs;
  var isRefreshing = false.obs; // Separate loading state for refreshes
  var telemetryResponse = Rxn<TelemetryResponse>();
  var errorMessage = ''.obs;
  var selectedDeviceId = ''.obs;

  Future<void> fetchTelemetry(String deviceId, {bool isInitialLoad = true}) async {
    if (deviceId.isEmpty) return;

    if (isInitialLoad) {
      isLoading.value = true;
      errorMessage.value = '';
      telemetryResponse.value = null; // Clear previous data only for initial load
    } else {
      isRefreshing.value = true; // Use refresh loading state for updates
    }
    selectedDeviceId.value = deviceId;

    try {
      final response = await _repository.fetchTelemetry(deviceId);
      telemetryResponse.value = response;
      errorMessage.value = ''; // Clear any previous errors on success
    } catch (e) {
      if (isInitialLoad) {
        errorMessage.value = e.toString();
      }
      // Don't update error message during refresh to avoid UI disruption
    } finally {
      if (isInitialLoad) {
        isLoading.value = false;
      } else {
        isRefreshing.value = false;
      }
    }
  }
}