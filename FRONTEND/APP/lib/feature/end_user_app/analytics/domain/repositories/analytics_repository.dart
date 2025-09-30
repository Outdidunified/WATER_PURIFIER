import 'package:ionhive_water_purifier/feature/end_user_app/analytics/data/api.dart';
import 'package:ionhive_water_purifier/feature/end_user_app/analytics/domain/models/analytics_model.dart';

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
