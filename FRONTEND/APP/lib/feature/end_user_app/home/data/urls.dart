import 'package:aquapulse_app/core/core.dart';
import 'package:aquapulse_app/core/services/endpoint.dart';

class SubscriptionUrl {
  static final Endpoint GetActiveSubscription = Endpoint(
    url: '${Core.baseUrl}/api/app/enduserhome/getActiveSubscriptionDetails',
    method: 'POST',
  );

  static final Endpoint GetLatestFeatureValues = Endpoint(
    url: '${Core.baseUrl}/api/app/enduserhome/getLatestFeatureValues',
    method: 'POST',
  );
}
