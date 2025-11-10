import 'package:ionhive_water_purifier/core/controllers/session_controller.dart';
import 'package:ionhive_water_purifier/core/services/base_api_service.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/home/data/urls.dart';
import 'package:get/get.dart';

class SubscriptionApi extends BaseApiService {
  final SessionController _sessionController = Get.find<SessionController>();

  Future<Map<String, dynamic>> fetchActiveSubscription() async {
    final userId = _sessionController.userId.value;
    final email = _sessionController.emailId.value;

    return makeRequest<Map<String, dynamic>>(
      url: SubscriptionUrl.GetActiveSubscription.url,
      method: SubscriptionUrl.GetActiveSubscription.method,
      body: {'user_id': userId, "email": email, "role_id": 3},
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> fetchLatestFeatureValues({
    required int userId,
    required String wpDeviceId,
  }) async {
    return makeRequest<Map<String, dynamic>>(
      url: SubscriptionUrl.GetLatestFeatureValues.url,
      method: SubscriptionUrl.GetLatestFeatureValues.method,
      body: {
        'user_id': userId,
        'wp_device_id': wpDeviceId,
      },
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> fetchTelemetryData({
    required String wpDeviceId,
  }) async {
    final url = SubscriptionUrl.GetTelemetryData.url.replaceAll('{wp_device_id}', wpDeviceId);
    return makeRequest<Map<String, dynamic>>(
      url: url,
      method: SubscriptionUrl.GetTelemetryData.method,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }

  Future<Map<String, dynamic>> storeBleAck(Map<String, dynamic> payload) async {
    return makeRequest<Map<String, dynamic>>(
      url: SubscriptionUrl.StoreBleAck.url,
      method: SubscriptionUrl.StoreBleAck.method,
      body: payload,
      responseParser: (data) => data as Map<String, dynamic>,
    );
  }
}
