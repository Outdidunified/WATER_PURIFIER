import 'package:aquapulse_app/feature/end_user_app/analytics/data/api.dart';
import 'package:aquapulse_app/feature/end_user_app/analytics/domain/models/analytics_model.dart';

class AnalyticsRepository {
  final AnalyticsApiCalls _api = AnalyticsApiCalls();

  Future<AnalyticsResponse> fetchAnalytics() async {
    try {
      final responseJson = await _api.fetchAnalytics();
      return AnalyticsResponse.fromJson(responseJson);
    } catch (e) {
      rethrow;
    }
  }
}
