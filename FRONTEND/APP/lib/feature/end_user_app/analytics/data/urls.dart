import 'package:aquapulse_app/core/core.dart';
import 'package:aquapulse_app/core/services/endpoint.dart';

class AnalyticsUrls {
  static final Endpoint analytics = Endpoint(
      url: '${Core.baseUrl}/api/app/analytics/getDailyWaterConsumption',
      method: 'POST');
}
