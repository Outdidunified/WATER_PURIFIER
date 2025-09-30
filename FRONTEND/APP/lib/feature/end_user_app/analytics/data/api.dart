import 'package:ionhive_water_purifier/core/services/base_api_service.dart';
import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/data/urls.dart';
import 'package:get/get.dart';

class AnalyticsApiCalls extends BaseApiService {
  final SessionController _sessionController = Get.find<SessionController>();

  Future<Map<String, dynamic>> fetchAnalytics() async {
    final userId = _sessionController.userId.value;

    return makeRequest<Map<String, dynamic>>(
      url: AnalyticsUrls.analytics.url,
      method: AnalyticsUrls.analytics.method,
      body: {
        'user_id': userId,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> fetchTelemetry(String deviceId) async {
    return makeRequest<Map<String, dynamic>>(
      url: AnalyticsUrls.telemetry(deviceId).url,
      method: AnalyticsUrls.telemetry(deviceId).method,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> fetchActiveSubscriptions(int userId, String email) async {
    return makeRequest<Map<String, dynamic>>(
      url: AnalyticsUrls.activeSubscriptions.url,
      method: AnalyticsUrls.activeSubscriptions.method,
      body: {
        'user_id': userId,
        'email': email,
        'role_id': 3,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
