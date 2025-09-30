import 'package:ionhive_water_purifier/core/core.dart';
import 'package:ionhive_water_purifier/core/services/endpoint.dart';

class AnalyticsUrls {
  static final Endpoint analytics = Endpoint(
      url: '${Core.baseUrl}/api/app/analytics/getDailyWaterConsumption',
      method: 'POST');

  static final Endpoint activeSubscriptions = Endpoint(
      url: '${Core.baseUrl}/api/app/enduserhome/getActiveSubscriptionDetails',
      method: 'POST');

  static Endpoint telemetry(String deviceId) => Endpoint(
      url: '${Core.baseUrl}/api/app/telemetry/latest/$deviceId',
      method: 'GET');
}
