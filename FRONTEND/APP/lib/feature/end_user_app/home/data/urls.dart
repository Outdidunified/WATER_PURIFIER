import 'package:ionhive_water_purifier/core/core.dart';
import 'package:ionhive_water_purifier/core/services/endpoint.dart';

class SubscriptionUrl {
  static final Endpoint GetActiveSubscription = Endpoint(
    url: '${Core.baseUrl}/api/app/enduserhome/getActiveSubscriptionDetails',
    method: 'POST',
  );

  static final Endpoint GetLatestFeatureValues = Endpoint(
    url: '${Core.baseUrl}/api/app/enduserhome/getLatestFeatureValues',
    method: 'POST',
  );

  static final Endpoint GetTelemetryData = Endpoint(
    url: '${Core.baseUrl}/api/app/telemetry/latest/{wp_device_id}',
    method: 'GET',
  );

  static final Endpoint StoreBleAck = Endpoint(
    url: '${Core.baseUrl}/api/app/enduserhome/storeBleAck',
    method: 'POST',
  );
}
