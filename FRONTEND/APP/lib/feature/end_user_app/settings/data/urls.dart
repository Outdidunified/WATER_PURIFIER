import 'package:ionhive_water_purifier/core/core.dart';
import 'package:ionhive_water_purifier/core/services/endpoint.dart';

class SettingsUrl {
  static final Endpoint FetchUserDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/settings/fetchuserdetails',
    method: 'POST',
  );

  static final Endpoint UpdateUserDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/settings/updateuserdetails',
    method: 'POST',
  );

  static final Endpoint createServiceRequest = Endpoint(
    url: '${Core.baseUrl}/api/app/settings/createServiceRequest',
    method: 'POST',
  );

  static final Endpoint UpdateNotificationSettings = Endpoint(
    url: '${Core.baseUrl}/api/app/settings/updateNotificationSettings',
    method: 'POST',
  );

  static final Endpoint fetchPaymentHistory = Endpoint(
    url: '${Core.baseUrl}/api/app/settings/fetchpaymenthistory',
    method: 'POST',
  );

  static final Endpoint downloadInvoice = Endpoint(
    url: '${Core.baseUrl}/api/website/orders/',
    method: 'GET',
  );
}
