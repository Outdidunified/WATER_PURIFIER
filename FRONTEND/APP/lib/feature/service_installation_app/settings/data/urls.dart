import 'package:aquapulse_app/core/core.dart';
import 'package:aquapulse_app/core/services/endpoint.dart';

class SettingsUrl {
  static final Endpoint FetchUserDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/settings/fetchuserdetails',
    method: 'POST',
  );

  static final Endpoint UpdateUserDetails = Endpoint(
    url: '${Core.baseUrl}/api/app/settings/updateuserdetails',
    method: 'POST',
  );
}
