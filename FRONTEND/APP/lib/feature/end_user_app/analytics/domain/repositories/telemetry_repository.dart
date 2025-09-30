import 'package:ionhive_water_purifier/feature/end_user_app/analytics/data/api.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/models/telemetry_model.dart';

class TelemetryRepository {
  final AnalyticsApiCalls _api = AnalyticsApiCalls();

  Future<TelemetryResponse> fetchTelemetry(String deviceId) async {
    try {
      final responseJson = await _api.fetchTelemetry(deviceId);
      return TelemetryResponse.fromJson(responseJson);
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> fetchActiveSubscriptions(int userId, String email) async {
    try {
      return await _api.fetchActiveSubscriptions(userId, email);
    } catch (e) {
      rethrow;
    }
  }
}