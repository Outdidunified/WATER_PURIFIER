import 'package:aquapulse_app/core/services/base_api_service.dart';
import 'package:aquapulse_app/core/controllers/session_controller.dart';
import 'package:aquapulse_app/feature/end_user_app/analytics/data/urls.dart';
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
}
